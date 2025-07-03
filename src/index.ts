#!/usr/bin/env node

/**
 * index.ts - Main server orchestration
 *
 * This file serves as the entry point for the Google Maps MCP server.
 * It initializes the MCP server, registers all available tools, and
 * dispatches incoming tool call requests to their respective handlers.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/server/index.js (for Server)
 * - @modelcontextprotocol/sdk/server/stdio.js (for StdioServerTransport)
 * - @modelcontextprotocol/sdk/types.js (for CallToolRequestSchema, ListToolsRequestSchema)
 * - ./registry/tool-registry.js (for ALL_TOOLS)
 * - All handler files (e.g., geocoding.ts, places.ts, etc.)
 * - ./utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { ALL_TOOLS } from "./registry/tool-registry.js";
import { createErrorResponse } from "./utils/error-handling.js";
import { HANDLER_MAP } from "./handlers/handler-registry.js";

// ====================================
// Server Setup
// ====================================

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

// Set up request handlers
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

// ====================================
// Server Initialization
// ====================================

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Google Maps Enhanced Visual MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
