/**
 * http.ts - Shared HTTP helpers (native fetch, no dependencies)
 *
 * Adds two things on top of plain fetch, transparently, without changing
 * the public signatures of getJson/postJson/getBytes/sanitizeUrl:
 *   - Response caching (TTL, per-host policy) for getJson/postJson.
 *   - Retry with exponential backoff + jitter for transient failures.
 *
 * Env escape hatches:
 *   MAPS_MCP_NO_CACHE=1  - disable caching entirely (tests/debugging).
 *   MAPS_MCP_DEBUG=<any> - log one line per request to stderr.
 */

import { getDefaultCache } from "./cache.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2; // 3 attempts total
const RETRY_BASE_DELAYS_MS = [500, 1500];
const MAX_REASONABLE_RETRY_AFTER_S = 10;

const cache = getDefaultCache();

/** Strip sensitive query params (API key) from a URL for safe display. */
export function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("key");
    return u.toString();
  } catch {
    return url;
  }
}

// ====================================
// Cache TTL policy
// ====================================

export interface CacheTtlRule {
  /** Human-readable label, e.g. for debugging/tests. */
  name: string;
  /** Returns true if this rule applies to the given (full, unsanitized) URL. */
  test: (url: string) => boolean;
  ttlMs: number;
}

export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

/**
 * Ordered per-host/path TTL policy. First matching rule wins, so more
 * specific rules (e.g. places searchText vs. places details, both on
 * places.googleapis.com) must come before more general ones.
 */
export const CACHE_TTL_POLICY: CacheTtlRule[] = [
  {
    name: "google-geocode",
    test: (url) => url.includes("maps.googleapis.com") && url.includes("/geocode"),
    ttlMs: 6 * 60 * 60 * 1000, // 6h
  },
  {
    name: "places-search-text",
    test: (url) => url.includes("places.googleapis.com") && url.includes(":searchText"),
    ttlMs: 5 * 60 * 1000, // 5min
  },
  {
    name: "places-details",
    test: (url) => url.includes("places.googleapis.com"),
    ttlMs: 60 * 60 * 1000, // 1h
  },
  {
    name: "routes",
    test: (url) => url.includes("routes.googleapis.com"),
    ttlMs: 5 * 60 * 1000, // 5min
  },
  {
    name: "open-meteo-archive",
    // Historical data is immutable; must be checked before the general
    // open-meteo rule below since "archive-api.open-meteo.com" also
    // contains "api.open-meteo.com" / "open-meteo.com" as a substring.
    test: (url) => url.includes("archive-api.open-meteo.com"),
    ttlMs: 24 * 60 * 60 * 1000, // 24h
  },
  {
    name: "open-meteo",
    // Covers both api.open-meteo.com (forecast) and
    // air-quality-api.open-meteo.com (air quality).
    test: (url) => url.includes("open-meteo.com"),
    ttlMs: 10 * 60 * 1000, // 10min
  },
];

/** Resolve the TTL (ms) to use for caching a given request URL. */
export function resolveCacheTtlMs(url: string): number {
  for (const rule of CACHE_TTL_POLICY) {
    if (rule.test(url)) return rule.ttlMs;
  }
  return DEFAULT_CACHE_TTL_MS;
}

function isCachingDisabled(): boolean {
  return process.env.MAPS_MCP_NO_CACHE === "1";
}

/**
 * Build a cache key from method + URL + relevant headers + (for POST) body.
 * The API key is deliberately included in the key material (it's part of
 * what makes a request unique/authorized) but is never surfaced via
 * cacheStats() or debug logging - only opaque counts/sizes are exposed.
 */
function buildCacheKey(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: object
): string {
  const headerPart = Object.keys(headers)
    .sort()
    .map((k) => `${k.toLowerCase()}=${headers[k]}`)
    .join("&");
  const bodyPart = body !== undefined ? JSON.stringify(body) : "";
  return `${method} ${url}\n${headerPart}\n${bodyPart}`;
}

// ====================================
// Debug logging (stderr only - stdout is the MCP protocol channel)
// ====================================

function isDebugEnabled(): boolean {
  return !!process.env.MAPS_MCP_DEBUG;
}

function logDebug(
  method: string,
  url: string,
  status: number | "cached",
  ms: number,
  cacheState: "HIT" | "MISS" | "SKIP",
  retries: number
): void {
  if (!isDebugEnabled()) return;
  console.error(
    `[maps-mcp] ${method} ${sanitizeUrl(url)} status=${status} ms=${ms} cache=${cacheState} retries=${retries}`
  );
}

// ====================================
// Retry with exponential backoff + jitter
// ====================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelayMs(attemptIndex: number): number {
  const base =
    RETRY_BASE_DELAYS_MS[attemptIndex] ??
    RETRY_BASE_DELAYS_MS[RETRY_BASE_DELAYS_MS.length - 1];
  const jitter = base * 0.3 * Math.random();
  return Math.round(base + jitter);
}

/** Honor Retry-After (seconds) if present and reasonable; otherwise null. */
function retryAfterMs(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_REASONABLE_RETRY_AFTER_S) {
    return null;
  }
  return seconds * 1000;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

interface FetchResult {
  response: Response;
  retries: number;
}

/**
 * fetch() with retry on network errors, HTTP 429, and HTTP 5xx.
 * Up to MAX_RETRIES retries (MAX_RETRIES + 1 attempts total). Other 4xx
 * responses are returned immediately (not retried, not thrown here - the
 * caller decides how to surface non-ok responses).
 */
async function fetchWithRetry(url: string, init: RequestInit): Promise<FetchResult> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const signal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...init, signal });
      if (response.ok || !isRetryableStatus(response.status) || attempt >= MAX_RETRIES) {
        return { response, retries: attempt };
      }
      const delay = retryAfterMs(response) ?? backoffDelayMs(attempt);
      await sleep(delay);
      attempt++;
    } catch (error) {
      if (attempt >= MAX_RETRIES) {
        throw error;
      }
      await sleep(backoffDelayMs(attempt));
      attempt++;
    }
  }
}

// ====================================
// Response parsing
// ====================================

async function parseOrThrow<T>(response: Response, url: string): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status} from ${sanitizeUrl(url)}: ${body.slice(0, 500)}`
    );
  }
  return (await response.json()) as T;
}

// ====================================
// Public API (signatures unchanged)
// ====================================

/** GET a URL and parse JSON. Throws with a sanitized, actionable message. */
export async function getJson<T>(
  url: string,
  headers: Record<string, string> = {}
): Promise<T> {
  const noCache = isCachingDisabled();
  const cacheKey = buildCacheKey("GET", url, headers);

  if (!noCache) {
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      logDebug("GET", url, "cached", 0, "HIT", 0);
      return cached as T;
    }
  }

  const start = Date.now();
  const { response, retries } = await fetchWithRetry(url, { headers });
  const ms = Date.now() - start;
  logDebug("GET", url, response.status, ms, "MISS", retries);

  const data = await parseOrThrow<T>(response, url);

  if (!noCache) {
    cache.set(cacheKey, data, resolveCacheTtlMs(url));
  }

  return data;
}

/** POST a JSON body and parse the JSON response. */
export async function postJson<T>(
  url: string,
  body: object,
  headers: Record<string, string> = {}
): Promise<T> {
  const noCache = isCachingDisabled();
  const cacheKey = buildCacheKey("POST", url, headers, body);

  if (!noCache) {
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      logDebug("POST", url, "cached", 0, "HIT", 0);
      return cached as T;
    }
  }

  const start = Date.now();
  const { response, retries } = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - start;
  logDebug("POST", url, response.status, ms, "MISS", retries);

  const data = await parseOrThrow<T>(response, url);

  if (!noCache) {
    cache.set(cacheKey, data, resolveCacheTtlMs(url));
  }

  return data;
}

/** GET a URL and return raw bytes (for image endpoints). Never cached (large payloads). */
export async function getBytes(
  url: string
): Promise<{ data: Buffer; contentType: string }> {
  const start = Date.now();
  const { response, retries } = await fetchWithRetry(url, {});
  const ms = Date.now() - start;
  logDebug("GET", url, response.status, ms, "SKIP", retries);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status} from ${sanitizeUrl(url)}: ${body.slice(0, 500)}`
    );
  }
  const contentType = response.headers.get("content-type") ?? "image/png";
  const data = Buffer.from(await response.arrayBuffer());
  return { data, contentType };
}
