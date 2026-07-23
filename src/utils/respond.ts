/**
 * respond.ts - Standard MCP tool response builders
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** Maximum characters returned in a single text response. */
export const CHARACTER_LIMIT = 25_000;

/** Successful text response. Objects are JSON-stringified and truncated at CHARACTER_LIMIT. */
export function ok(data: unknown): CallToolResult {
  let text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  if (text.length > CHARACTER_LIMIT) {
    text =
      text.slice(0, CHARACTER_LIMIT) +
      `\n... [truncated at ${CHARACTER_LIMIT} characters — narrow your query for full results]`;
  }
  return { content: [{ type: "text", text }], isError: false };
}

/** Error response with an actionable message. */
export function err(message: string): CallToolResult {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

/** Image response: inline image content block plus a text block of metadata. */
export function image(
  base64: string,
  mimeType: string,
  metadata: unknown
): CallToolResult {
  return {
    content: [
      { type: "image", data: base64, mimeType },
      { type: "text", text: JSON.stringify(metadata, null, 2) },
    ],
    isError: false,
  };
}

/** Wrap an async handler so any thrown error becomes a clean MCP error response. */
export function safe<A>(
  fn: (args: A) => Promise<CallToolResult>
): (args: A) => Promise<CallToolResult> {
  return async (args: A) => {
    try {
      return await fn(args);
    } catch (error) {
      return err(error instanceof Error ? error.message : String(error));
    }
  };
}
