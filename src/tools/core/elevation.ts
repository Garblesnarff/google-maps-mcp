/**
 * elevation.ts - Elevation tools
 *
 * This file contains the tool definition for getting elevation data.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Cline
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Elevation Tools
// ====================================

/**
 * @constant ELEVATION_TOOL
 * @description Tool definition for getting elevation data for locations on the earth.
 */
export const ELEVATION_TOOL: Tool = {
  name: "maps_elevation",
  description: "Get elevation data for locations on the earth",
  inputSchema: {
    type: "object",
    properties: {
      locations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" }
          },
          required: ["latitude", "longitude"]
        },
        description: "Array of locations to get elevation for"
      }
    },
    required: ["locations"]
  }
};
