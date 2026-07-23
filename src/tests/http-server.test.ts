process.env.GOOGLE_MAPS_API_KEY = "test-key-123";

import type { Server } from "node:http";
import http from "node:http";

import { test, describe, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  installFetchMock,
  restoreFetchMock,
  resetFetchMock,
  mockRoute,
  jsonResponse,
} from "./fetch-mock.js";

import { runHttpServer } from "../http-server.js";

const PORT = 3271;
const AUTH_PORT = 3272;

/**
 * Issue a real HTTP request to the locally-running server using node:http,
 * deliberately bypassing globalThis.fetch (which is mocked for the
 * server's own outbound calls to Open-Meteo/Google in these tests).
 */
function requestLocal(
  port: number,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: {
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {}),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed: any = undefined;
          try {
            parsed = data ? JSON.parse(data) : undefined;
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let server: Server;

before(async () => {
  installFetchMock();
  server = await runHttpServer(PORT);
});

afterEach(() => {
  resetFetchMock();
});

after(async () => {
  restoreFetchMock();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("GET /health", () => {
  test("returns 200 ok with the current tool count", async () => {
    const res = await requestLocal(PORT, "GET", "/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.equal(res.body.tools, 19);
  });
});

describe("GET /api/tools", () => {
  test("returns all 19 tool names", async () => {
    const res = await requestLocal(PORT, "GET", "/api/tools");
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 19);
    assert.ok(res.body.some((t: { name: string }) => t.name === "maps_frost_dates"));
  });
});

describe("POST /api/tools/:name", () => {
  test("maps_weather returns ok:true with data (mocked open-meteo)", async () => {
    mockRoute("api.open-meteo.com/v1/forecast", () =>
      jsonResponse({
        current: {
          time: "2026-07-23T12:00",
          temperature_2m: 22.5,
          relative_humidity_2m: 40,
          apparent_temperature: 21,
          precipitation: 0,
          weather_code: 1,
          wind_speed_10m: 8,
          wind_direction_10m: 270,
        },
        daily: {
          time: ["2026-07-23"],
          temperature_2m_max: [25],
          temperature_2m_min: [12],
          precipitation_sum: [0],
          weather_code: [1],
        },
      })
    );

    const res = await requestLocal(PORT, "POST", "/api/tools/maps_weather", {
      latitude: 44.05,
      longitude: -121.31,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.data.current.conditions, "Mainly clear");
  });

  test("an unknown tool name returns 404", async () => {
    const res = await requestLocal(PORT, "POST", "/api/tools/bogus", {});
    assert.equal(res.status, 404);
    assert.equal(res.body.ok, false);
  });
});

describe("bearer auth", () => {
  let authServer: Server;

  before(async () => {
    process.env.MAPS_MCP_AUTH_TOKEN = "secret-token";
    authServer = await runHttpServer(AUTH_PORT);
  });

  after(async () => {
    delete process.env.MAPS_MCP_AUTH_TOKEN;
    await new Promise<void>((resolve) => authServer.close(() => resolve()));
  });

  test("401 without an Authorization header", async () => {
    const res = await requestLocal(AUTH_PORT, "GET", "/api/tools");
    assert.equal(res.status, 401);
    assert.equal(res.body.ok, false);
  });

  test("200 with a valid Bearer token", async () => {
    const res = await requestLocal(AUTH_PORT, "GET", "/api/tools", undefined, {
      Authorization: "Bearer secret-token",
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 19);
  });
});
