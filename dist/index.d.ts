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
export {};
//# sourceMappingURL=index.d.ts.map