/**
 * http-server.ts - Dual-purpose HTTP entry point.
 *
 * 1. POST /mcp - a stateless streamable-HTTP MCP transport, one McpServer +
 *    one StreamableHTTPServerTransport per request (no session persistence).
 * 2. A thin REST layer (/health, /api/tools, /api/tools/:name) for non-MCP
 *    consumers (e.g. a garden-planner app backend) that would rather POST
 *    plain JSON than speak JSON-RPC.
 */

import type { Server } from "node:http";
import express, { type NextFunction, type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createServer } from "./index.js";
import { HANDLERS } from "./registry.js";

/** Reject requests that lack a valid bearer token, when auth is configured. */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = process.env.MAPS_MCP_AUTH_TOKEN;
  if (!token) {
    next();
    return;
  }
  const header = req.header("authorization") ?? "";
  const [scheme, value] = header.split(" ");
  if (scheme === "Bearer" && value === token) {
    next();
    return;
  }
  res.status(401).json({ ok: false, error: "Unauthorized" });
}

/** Convert a CallToolResult into REST-friendly JSON. */
function unwrapResult(result: { isError?: boolean; content: Array<any> }): {
  status: number;
  body: unknown;
} {
  const firstText = result.content.find((block) => block.type === "text") as
    | { type: "text"; text: string }
    | undefined;

  if (result.isError) {
    return {
      status: 400,
      body: { ok: false, error: firstText?.text ?? "Unknown error" },
    };
  }

  const imageBlock = result.content.find((block) => block.type === "image") as
    | { type: "image"; data: string; mimeType: string }
    | undefined;

  if (imageBlock) {
    // Convention (see utils/respond.ts `image()`): image block plus a
    // trailing text block of JSON metadata.
    const metadataBlock = result.content
      .filter((block) => block.type === "text")
      .pop() as { type: "text"; text: string } | undefined;

    let metadata: unknown = undefined;
    if (metadataBlock) {
      try {
        metadata = JSON.parse(metadataBlock.text);
      } catch {
        metadata = metadataBlock.text;
      }
    }

    return {
      status: 200,
      body: {
        ok: true,
        data: {
          image_base64: imageBlock.data,
          mime_type: imageBlock.mimeType,
          metadata,
        },
      },
    };
  }

  if (firstText) {
    try {
      const parsed = JSON.parse(firstText.text);
      return { status: 200, body: { ok: true, data: parsed } };
    } catch {
      return { status: 200, body: { ok: true, data: { text: firstText.text } } };
    }
  }

  return { status: 200, body: { ok: true, data: null } };
}

export async function runHttpServer(port: number): Promise<Server> {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const authEnabled = Boolean(process.env.MAPS_MCP_AUTH_TOKEN);

  // /health stays open even when auth is configured.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", version: "4.1.0", tools: Object.keys(HANDLERS).length });
  });

  app.post("/mcp", requireAuth, async (req, res) => {
    try {
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on("close", () => {
        transport.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling /mcp request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : String(error),
          },
          id: null,
        });
      }
    }
  });

  app.get("/api/tools", requireAuth, (_req, res) => {
    res.json(Object.keys(HANDLERS).map((name) => ({ name })));
  });

  app.post("/api/tools/:name", requireAuth, async (req, res) => {
    const name = String(req.params.name);
    const handler = HANDLERS[name];
    if (!handler) {
      res.status(404).json({
        ok: false,
        error: `Unknown tool: ${name}`,
        valid_names: Object.keys(HANDLERS),
      });
      return;
    }

    try {
      const result = await handler(req.body ?? {});
      const { status, body } = unwrapResult(result);
      res.status(status).json(body);
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(port, "0.0.0.0", () => {
      resolve(s);
    });
  });

  console.error(
    `Google Maps MCP server v4.1.0 running on http://0.0.0.0:${port} ` +
      `(19 tools; MCP: POST /mcp; REST: /api/tools; auth: ${
        authEnabled ? "enabled" : "disabled"
      })`
  );

  return server;
}
