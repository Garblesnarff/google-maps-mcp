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
// Import all handler functions
import { handleGeocode, handleReverseGeocode } from "./handlers/core/geocoding.js";
import { handlePlaceSearch, handlePlaceDetails } from "./handlers/core/places.js";
import { handleDistanceMatrix, handleDirections, handleRoutes } from "./handlers/core/routing.js";
import { handleElevation } from "./handlers/core/elevation.js";
import { handleWeather } from "./handlers/environmental/weather.js";
import { handleAirQuality } from "./handlers/environmental/air-quality.js";
import { handleSolar } from "./handlers/environmental/solar.js";
import { handlePollen } from "./handlers/environmental/pollen.js";
import { handleStreetView } from "./handlers/visual/street-view.js";
import { handleStaticMap } from "./handlers/visual/static-maps.js";
// ====================================
// Server Setup
// ====================================
const server = new Server({
    name: "mcp-server/google-maps-enhanced-visual",
    version: "0.3.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        let response;
        switch (request.params.name) {
            // Core Google Maps handlers
            case "maps_geocode": {
                const { address } = request.params.arguments;
                response = await handleGeocode(address);
                break;
            }
            case "maps_reverse_geocode": {
                const { latitude, longitude } = request.params.arguments;
                response = await handleReverseGeocode(latitude, longitude);
                break;
            }
            case "maps_search_places": {
                const { query, location, radius } = request.params.arguments;
                response = await handlePlaceSearch(query, location, radius);
                break;
            }
            case "maps_place_details": {
                const { place_id } = request.params.arguments;
                response = await handlePlaceDetails(place_id);
                break;
            }
            case "maps_distance_matrix": {
                const { origins, destinations, mode } = request.params.arguments;
                response = await handleDistanceMatrix(origins, destinations, mode);
                break;
            }
            case "maps_elevation": {
                const { locations } = request.params.arguments;
                response = await handleElevation(locations);
                break;
            }
            case "maps_directions": {
                const { origin, destination, mode } = request.params.arguments;
                response = await handleDirections(origin, destination, mode);
                break;
            }
            // Environmental handlers
            case "maps_weather": {
                const { latitude, longitude, forecast_days, include_hourly } = request.params.arguments;
                response = await handleWeather(latitude, longitude, forecast_days, include_hourly);
                break;
            }
            case "maps_air_quality": {
                const { latitude, longitude, forecast_days } = request.params.arguments;
                response = await handleAirQuality(latitude, longitude, forecast_days);
                break;
            }
            case "maps_solar": {
                const { latitude, longitude, tilt, azimuth, forecast_days } = request.params.arguments;
                response = await handleSolar(latitude, longitude, tilt, azimuth, forecast_days);
                break;
            }
            case "maps_pollen": {
                const { latitude, longitude, forecast_days } = request.params.arguments;
                response = await handlePollen(latitude, longitude, forecast_days);
                break;
            }
            case "maps_routes": {
                const { origin, destination, travel_mode, routing_preference } = request.params.arguments;
                response = await handleRoutes(origin, destination, travel_mode, routing_preference);
                break;
            }
            // Visual handlers with download support
            case "maps_street_view": {
                const { location, size, heading, pitch, fov, download, downloadDir } = request.params.arguments;
                response = await handleStreetView(location, size, heading, pitch, fov, download, downloadDir);
                break;
            }
            case "maps_static_map": {
                const { center, zoom, size, maptype, markers, download, downloadDir } = request.params.arguments;
                response = await handleStaticMap(center, zoom, size, maptype, markers, download, downloadDir);
                break;
            }
            default:
                response = createErrorResponse(`Unknown tool: ${request.params.name}`);
        }
        return response; // Explicitly cast to any to bypass strict type checking
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map