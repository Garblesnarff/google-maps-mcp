/**
 * fetch-mock.ts - Minimal globalThis.fetch mock for smoke tests.
 *
 * Not a test file itself (no test() calls) — a shared helper imported by the
 * *.test.ts files in this directory.
 *
 * Routes are matched by URL substring, in the order they were registered.
 * Every outgoing request is recorded in `capturedRequests` so tests can
 * assert on headers (e.g. X-Goog-FieldMask) actually sent by the handlers.
 */

export interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export type RouteHandler = (
  url: string,
  init: RequestInit | undefined
) => Response | Promise<Response>;

interface Route {
  match: string;
  handler: RouteHandler;
}

export const capturedRequests: CapturedRequest[] = [];

let routes: Route[] = [];
let originalFetch: typeof globalThis.fetch | undefined;

/** Install the mock in place of globalThis.fetch. */
export function installFetchMock(): void {
  originalFetch = globalThis.fetch;
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();

    const headers: Record<string, string> = {};
    if (init?.headers) {
      for (const [key, value] of new Headers(init.headers)) {
        headers[key.toLowerCase()] = value;
      }
    }

    capturedRequests.push({
      url,
      method: init?.method ?? "GET",
      headers,
      body: typeof init?.body === "string" ? init.body : undefined,
    });

    const route = routes.find((r) => url.includes(r.match));
    if (!route) {
      throw new Error(`fetch-mock: no route configured for URL: ${url}`);
    }
    return route.handler(url, init);
  }) as typeof fetch;
}

/** Restore the real globalThis.fetch. */
export function restoreFetchMock(): void {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
}

/** Clear all registered routes and captured requests (call between tests). */
export function resetFetchMock(): void {
  routes = [];
  capturedRequests.length = 0;
}

/** Register a mock response for any request URL containing `match`. */
export function mockRoute(match: string, handler: RouteHandler): void {
  routes.push({ match, handler });
}

/** Build a JSON Response, mirroring what Google/Open-Meteo endpoints return. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Build a small fake binary image Response (PNG magic bytes by default). */
export function imageResponse(
  status = 200,
  contentType = "image/png"
): Response {
  return new Response(new Uint8Array([137, 80, 78, 71]).buffer, {
    status,
    headers: { "content-type": contentType },
  });
}
