process.env.GOOGLE_MAPS_API_KEY = "test-key-123";

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  installFetchMock,
  restoreFetchMock,
  resetFetchMock,
  mockRoute,
  jsonResponse,
} from "./fetch-mock.js";

import { getJson, resolveCacheTtlMs } from "../utils/http.js";
import { cacheStats, clearCache } from "../utils/cache.js";

// fetch-mock.ts sets MAPS_MCP_NO_CACHE=1 at module load (so *other* test
// files exercise fresh routes every call). These tests need real caching
// behavior, so each test unsets it and restores whatever was there after.
let savedNoCache: string | undefined;

beforeEach(() => {
  installFetchMock();
  savedNoCache = process.env.MAPS_MCP_NO_CACHE;
  delete process.env.MAPS_MCP_NO_CACHE;
  clearCache();
});

afterEach(() => {
  resetFetchMock();
  restoreFetchMock();
  if (savedNoCache === undefined) {
    delete process.env.MAPS_MCP_NO_CACHE;
  } else {
    process.env.MAPS_MCP_NO_CACHE = savedNoCache;
  }
  clearCache();
});

describe("response caching", () => {
  test("two identical getJson calls hit the network once; the second is a cache HIT", async () => {
    let fetchCalls = 0;
    mockRoute("archive-api.open-meteo.com", () => {
      fetchCalls++;
      return jsonResponse({
        daily: { time: ["2025-01-01"], temperature_2m_min: [1], temperature_2m_max: [2] },
      });
    });

    const url = "https://archive-api.open-meteo.com/v1/archive?latitude=1&longitude=2";
    const first = await getJson<unknown>(url);
    const statsAfterFirst = cacheStats();
    const second = await getJson<unknown>(url);
    const statsAfterSecond = cacheStats();

    assert.deepEqual(first, second);
    assert.equal(fetchCalls, 1, "underlying fetch should only be called once");
    assert.equal(statsAfterFirst.misses, 1);
    assert.equal(statsAfterSecond.hits, 1);
  });
});

describe("resolveCacheTtlMs", () => {
  test("24h TTL for archive-api.open-meteo.com URLs", () => {
    assert.equal(
      resolveCacheTtlMs("https://archive-api.open-meteo.com/v1/archive?latitude=1&longitude=2"),
      24 * 60 * 60 * 1000
    );
  });

  test("6h TTL for maps.googleapis.com/maps/api/geocode URLs", () => {
    assert.equal(
      resolveCacheTtlMs("https://maps.googleapis.com/maps/api/geocode/json?address=x&key=abc"),
      6 * 60 * 60 * 1000
    );
  });
});

describe("retry with backoff", () => {
  test("500, 500, then 200 succeeds after 3 attempts total", async () => {
    let calls = 0;
    mockRoute("retry-500-then-200.test", () => {
      calls++;
      if (calls < 3) {
        return new Response("server error", { status: 500 });
      }
      return jsonResponse({ ok: true });
    });

    const result = await getJson<{ ok: boolean }>("https://retry-500-then-200.test/x");
    assert.deepEqual(result, { ok: true });
    assert.equal(calls, 3);
  });

  test("a non-retryable 400 fails fast (called once)", async () => {
    let calls = 0;
    mockRoute("bad-request.test", () => {
      calls++;
      return new Response("bad request", { status: 400 });
    });

    await assert.rejects(() => getJson("https://bad-request.test/x"));
    assert.equal(calls, 1);
  });
});
