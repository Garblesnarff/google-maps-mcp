/**
 * image-fetch.ts - Safe image download utility for visual tools
 *
 * Downloads a remote image with strict safety limits and returns it as
 * base64, ready for an MCP image content block. Enforces a content-type
 * allowlist, a maximum download size, and a request timeout. Never leaks
 * the request URL (which may carry the API key) in thrown errors.
 *
 * Dependencies:
 * - node-fetch
 *
 * @author Wonky
 */

import fetch from "node-fetch";

// ====================================
// Image Fetch Utilities
// ====================================

/** Default maximum image download: 5 MB. */
export const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Default fetch timeout: 30 seconds. */
export const DEFAULT_IMAGE_TIMEOUT_MS = 30_000;

export interface FetchedImage {
  /** Base64-encoded image bytes (no data: prefix). */
  data: string;
  /** MIME type from the response, e.g. "image/png". */
  mimeType: string;
  /** Decoded byte length. */
  bytes: number;
}

export interface FetchImageOptions {
  maxBytes?: number;
  timeoutMs?: number;
}

/**
 * Replaces an API key query parameter in a URL with [REDACTED].
 */
export function redactApiKey(url: string): string {
  return url.replace(/([?&]key=)[^&]*/i, "$1[REDACTED]");
}

/**
 * Downloads an image URL and returns it as base64.
 *
 * @param {string} url - The image URL to download.
 * @param {FetchImageOptions} [options] - Size and timeout limits.
 * @returns {Promise<FetchedImage>} The image bytes, MIME type, and size.
 * @throws {Error} On network failure, non-OK status, non-image
 *   content-type, or when the download exceeds maxBytes. Error messages
 *   never include the URL or API key.
 */
export async function fetchImageAsBase64(
  url: string,
  options: FetchImageOptions = {}
): Promise<FetchedImage> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_IMAGE_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_IMAGE_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Image request failed with HTTP status ${response.status}`);
    }

    const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/")) {
      throw new Error(`Unexpected content type "${contentType || "unknown"}"; expected an image`);
    }

    const declaredLength = response.headers.get("content-length");
    if (declaredLength !== null) {
      const parsed = parseInt(declaredLength, 10);
      if (!Number.isNaN(parsed) && parsed > maxBytes) {
        throw new Error(`Image size ${parsed} bytes exceeds the ${maxBytes} byte limit`);
      }
    }

    // Stream the body with a hard cap so a lying content-length can't OOM us.
    const chunks: Buffer[] = [];
    let total = 0;
    const body = response.body;
    if (!body) {
      throw new Error("Image response had no body");
    }
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      total += chunk.length;
      if (total > maxBytes) {
        throw new Error(`Image download exceeded the ${maxBytes} byte limit`);
      }
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);
    return {
      data: buffer.toString("base64"),
      mimeType: contentType,
      bytes: buffer.length,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Image request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
