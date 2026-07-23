/**
 * http.ts - Shared HTTP helpers (native fetch, no dependencies)
 */

const DEFAULT_TIMEOUT_MS = 30_000;

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

async function parseOrThrow<T>(response: Response, url: string): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status} from ${sanitizeUrl(url)}: ${body.slice(0, 500)}`
    );
  }
  return (await response.json()) as T;
}

/** GET a URL and parse JSON. Throws with a sanitized, actionable message. */
export async function getJson<T>(
  url: string,
  headers: Record<string, string> = {}
): Promise<T> {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  return parseOrThrow<T>(response, url);
}

/** POST a JSON body and parse the JSON response. */
export async function postJson<T>(
  url: string,
  body: object,
  headers: Record<string, string> = {}
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  return parseOrThrow<T>(response, url);
}

/** GET a URL and return raw bytes (for image endpoints). */
export async function getBytes(
  url: string
): Promise<{ data: Buffer; contentType: string }> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
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
