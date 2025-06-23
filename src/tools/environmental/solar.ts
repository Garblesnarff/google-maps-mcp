/**
 * solar.ts - Solar tools
 *
 * This file contains the tool definition for getting solar irradiance data.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Cline
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Solar Tools
// ====================================

/**
 * @constant SOLAR_TOOL
 * @description Tool definition for getting solar irradiance data for solar power planning at campsites.
 */
export const SOLAR_TOOL: Tool = {
  name: "maps_solar",
  description: "Get solar irradiance data for solar power planning at campsites",
  inputSchema: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude coordinate"
      },
      longitude: {
        type: "number",
        description: "Longitude coordinate"
      },
      tilt: {
        type: "number",
        description: "Solar panel tilt angle in degrees (0-90, default: optimal angle)",
        default: 0
      },
      azimuth: {
        type: "number",
        description: "Solar panel azimuth angle in degrees (default: 180 for south)",
        default: 180
      },
      forecast_days: {
        type: "number",
        description: "Number of forecast days (1-5, default: 1)",
        default: 1
      }
    },
    required: ["latitude", "longitude"]
  }
};
