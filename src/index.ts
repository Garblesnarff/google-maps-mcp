#!/usr/bin/env node

/**
 * index.ts - stdio entry point
 *
 * Local-use entry point: creates the MCP server and connects it over stdio.
 * For hosted use, see http.ts (Streamable HTTP).
 *
 * @author Cline
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

// ====================================
// Server Initialization (stdio)
// ====================================

async function runServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Google Maps Enhanced Visual MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
