/**
 * server.ts - Shared MCP server factory
 *
 * Creates the configured MCP Server (tool list + dispatch) without binding
 * it to any transport. Both entry points use this:
 * - index.ts  -> stdio (local use)
 * - http.ts   -> Streamable HTTP (hosted use)
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/server/index.js (for Server)
 * - @modelcontextprotocol/sdk/types.js (for CallToolRequestSchema, ListToolsRequestSchema)
 * - ./registry/tool-registry.js (for ALL_TOOLS)
 * - ./handlers/handler-registry.js (for HANDLER_MAP)
 * - ./utils/error-handling.js (for createErrorResponse)
 *
 * @author Wonky
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { ALL_TOOLS } from "./registry/tool-registry.js";
import { createErrorResponse } from "./utils/error-handling.js";
import { HANDLER_MAP } from "./handlers/handler-registry.js";

// ====================================
// Server Factory
// ====================================

/**
 * Creates a fully configured MCP Server with all tools registered and
 * the CallTool dispatcher wired to the handler registry. The caller
 * connects it to a transport (stdio or Streamable HTTP).
 *
 * @returns {Server} The configured MCP server (not yet connected).
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: "mcp-server/google-maps-enhanced-visual",
      version: "0.3.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      // Find the handler function associated with the tool name
      const handler = HANDLER_MAP[request.params.name];

      if (!handler) {
        return createErrorResponse(`Unknown tool: ${request.params.name}`);
      }

      try {
        // Extract API arguments (which may be undefined in some cases)
        const params = request.params.arguments || {};

        // Ensure handlers receive properly structured arguments
        const response = await handler(...Object.values(params as Record<string, string>) || []);
        return response;
      } catch (error) {
        return createErrorResponse(`Error invoking handler: ${(error as Error).message}`);
      }

    } catch (error) {
      return createErrorResponse(`Error handling tool call: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  return server;
}
