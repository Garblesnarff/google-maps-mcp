/**
 * pollen.ts - Pollen tools
 *
 * This file contains the tool definition for getting pollen and allergy information.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Cline
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Pollen Tools
// ====================================

/**
 * @constant POLLEN_TOOL
 * @description Tool definition for getting pollen and allergy information for outdoor activities.
 */
export const POLLEN_TOOL: Tool = {
  name: "maps_pollen",
  description: "Get pollen and allergy information for outdoor activities",
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
        description: "Number of forecast days (1-5, default: 3)",
        default: 3
      }
    },
    required: ["latitude", "longitude"]
  }
};
