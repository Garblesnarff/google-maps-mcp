#!/usr/bin/env node

/**
 * http.ts - Streamable HTTP entry point (hosted use)
 *
 * Runs the MCP server over Streamable HTTP so remote agents can connect:
 *   POST /mcp      -> JSON-RPC requests (stateless; no session affinity needed)
 *   GET  /healthz  -> health check (no auth)
 *
 * Environment:
 *   PORT               - listen port (default 3000; Botkeep injects its own)
 *   MCP_HOST           - bind address (default 0.0.0.0)
 *   MCP_BEARER_TOKEN   - required bearer token. If unset, the server runs
 *                        WITHOUT auth and logs a loud warning (local dev only).
 *   GOOGLE_MAPS_API_KEY - Google Maps API key (server-side, never exposed)
 *
 * Security notes:
 * - Stateless transport: every request gets a fresh MCP server instance, so
 *   the process works behind load balancers with no sticky sessions.
 * - Bearer tokens are compared with crypto.timingSafeEqual and never logged.
 * - Simple per-IP rate limiting (60 req/min) guards the Google Maps bill.
 * - Request bodies are capped at 1 MB.
 *
 * Dependencies:
 * - node:http, node:crypto (built-in)
 * - @modelcontextprotocol/sdk/server/streamableHttp.js
 * - ./server.js (for createServer)
 *
 * @author Wonky
 */

import http from "node:http";
import crypto from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { ALL_TOOLS } from "./registry/tool-registry.js";

// ====================================
// Configuration
// ====================================

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.MCP_HOST || "0.0.0.0";
const BEARER_TOKEN = process.env.MCP_BEARER_TOKEN || "";

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

// ====================================
// Per-IP rate limiter (in-memory)
// ====================================

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  // Opportunistic cleanup so the map can't grow forever.
  if (rateBuckets.size > 10_000) {
    for (const [key, b] of rateBuckets) {
      if (now > b.resetAt) {
        rateBuckets.delete(key);
      }
    }
  }
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

// ====================================
// Auth
// ====================================

function isAuthorized(req: http.IncomingMessage): boolean {
  if (!BEARER_TOKEN) {
    return true; // dev mode — warned loudly at startup
  }
  const header = req.headers["authorization"] || "";
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) {
    return false;
  }
  const provided = Buffer.from(match[1]);
  const expected = Buffer.from(BEARER_TOKEN);
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

// ====================================
// Body parsing
// ====================================

function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text.length === 0 ? undefined : JSON.parse(text));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// ====================================
// Request handling
// ====================================

function clientIp(req: http.IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

async function handleMcp(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  if (!isAuthorized(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized: valid Bearer token required" }));
    return;
  }

  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: (error as Error).message }));
    return;
  }

  const server = createServer();
  // Stateless: no session IDs, so no sticky sessions needed behind a proxy.
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (error) {
    console.error("MCP request failed:", (error as Error).message);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
}

function requestListener(req: http.IncomingMessage, res: http.ServerResponse): void {
  const url = new URL(req.url || "/", "http://localhost");
  const start = Date.now();

  res.on("finish", () => {
    // Never log tokens, keys, or request bodies.
    console.error(`${req.method} ${url.pathname} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });

  if (url.pathname === "/healthz" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", tools: ALL_TOOLS.length }));
    return;
  }

  if (url.pathname === "/mcp" && req.method === "POST") {
    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Rate limit exceeded, try again shortly" }));
      return;
    }
    handleMcp(req, res).catch((error) => {
      console.error("Unhandled MCP error:", (error as Error).message);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}

// ====================================
// Startup
// ====================================

const httpServer = http.createServer(requestListener);

httpServer.listen(PORT, HOST, () => {
  console.error(`Google Maps MCP (Streamable HTTP) listening on http://${HOST}:${PORT}/mcp`);
  console.error(`Tools exposed: ${ALL_TOOLS.length}`);
  if (!BEARER_TOKEN) {
    console.error("WARNING: MCP_BEARER_TOKEN is not set — the server accepts unauthenticated requests. Set it before exposing this publicly.");
  } else {
    console.error("Bearer-token auth enabled.");
  }
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error("WARNING: GOOGLE_MAPS_API_KEY is not set — Google API calls will fail.");
  }
});

process.on("SIGTERM", () => {
  console.error("SIGTERM received, shutting down.");
  httpServer.close(() => process.exit(0));
});
