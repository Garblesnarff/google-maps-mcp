/**
 * tool-registry.ts - Central tool registration
 *
 * This file centralizes the registration of all tools provided by the Google Maps MCP server.
 * It imports tool definitions from their respective modules and exports them as a single array.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 * - All tool definition files (e.g., geocoding.ts, places.ts, etc.)
 *
 * @author Cline
 */
// Core Google Maps Tools
import { GEOCODE_TOOL, REVERSE_GEOCODE_TOOL } from "../tools/core/geocoding.js";
import { SEARCH_PLACES_TOOL, PLACE_DETAILS_TOOL } from "../tools/core/places.js";
import { DISTANCE_MATRIX_TOOL, DIRECTIONS_TOOL, ROUTES_TOOL } from "../tools/core/routing.js";
import { ELEVATION_TOOL } from "../tools/core/elevation.js";
// Environmental Data Tools
import { WEATHER_TOOL } from "../tools/environmental/weather.js";
import { AIR_QUALITY_TOOL } from "../tools/environmental/air-quality.js";
import { SOLAR_TOOL } from "../tools/environmental/solar.js";
import { POLLEN_TOOL } from "../tools/environmental/pollen.js";
// Visual Google Maps Tools
import { STREET_VIEW_TOOL } from "../tools/visual/street-view.js";
import { STATIC_MAP_TOOL } from "../tools/visual/static-maps.js";
// ====================================
// Tool Registry
// ====================================
/**
 * @constant ALL_TOOLS
 * @description An array containing all tool definitions exposed by this MCP server.
 */
export const ALL_TOOLS = [
    // Core Google Maps Tools
    GEOCODE_TOOL,
    REVERSE_GEOCODE_TOOL,
    SEARCH_PLACES_TOOL,
    PLACE_DETAILS_TOOL,
    DISTANCE_MATRIX_TOOL,
    ELEVATION_TOOL,
    DIRECTIONS_TOOL,
    // Environmental Data Tools
    WEATHER_TOOL,
    AIR_QUALITY_TOOL,
    SOLAR_TOOL,
    POLLEN_TOOL,
    ROUTES_TOOL,
    // Visual Google Maps Tools
    STREET_VIEW_TOOL,
    STATIC_MAP_TOOL,
];
//# sourceMappingURL=tool-registry.js.map