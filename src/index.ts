#!/usr/bin/env node

/**
 * index.ts - Google Maps MCP server entry point
 *
 * Registers all 14 tools on a modern McpServer (named, validated
 * arguments via zod) and connects over stdio.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerGeocodingTools } from "./tools/geocoding.js";
import { registerElevationTools } from "./tools/elevation.js";
import { registerPlacesTools } from "./tools/places.js";
import { registerRoutingTools } from "./tools/routing.js";
import { registerEnvironmentalTools } from "./tools/environmental.js";
import { registerVisualTools } from "./tools/visual.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "google-maps-mcp-server",
    version: "4.0.0",
  });

  registerGeocodingTools(server);
  registerElevationTools(server);
  registerPlacesTools(server);
  registerRoutingTools(server);
  registerEnvironmentalTools(server);
  registerVisualTools(server);

  return server;
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error(
      "WARNING: GOOGLE_MAPS_API_KEY is not set. Google-backed tools will return errors. " +
        "(Open-Meteo tools — weather, air quality, solar, pollen — work without a key.)"
    );
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Google Maps MCP server v4.0.0 running on stdio (14 tools)");
}

// Only start the server when executed directly (not when imported by tests).
const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url.endsWith(process.argv[1].split("/").pop() ?? "");

if (isDirectRun) {
  main().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
  });
}
