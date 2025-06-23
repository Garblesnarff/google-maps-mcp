/**
 * air-quality.ts - Air Quality tools
 *
 * This file contains the tool definition for getting air quality data.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Cline
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Air Quality Tools
// ====================================

/**
 * @constant AIR_QUALITY_TOOL
 * @description Tool definition for getting air quality data for wilderness areas and camping locations.
 */
export const AIR_QUALITY_TOOL: Tool = {
  name: "maps_air_quality",
  description: "Get air quality data for wilderness areas and camping locations",
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
      forecast_days: {
        type: "number",
        description: "Number of forecast days (1-5, default: 1)",
        default: 1
      }
    },
    required: ["latitude", "longitude"]
  }
};
