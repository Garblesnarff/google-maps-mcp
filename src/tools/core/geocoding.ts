/**
 * geocoding.ts - Geocoding tools
 *
 * This file contains the tool definitions for geocoding and reverse geocoding.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Cline
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Geocoding Tools
// ====================================

/**
 * @constant GEOCODE_TOOL
 * @description Tool definition for converting an address into geographic coordinates.
 */
export const GEOCODE_TOOL: Tool = {
    name: "maps_geocode",
    description: "Convert an address into geographic coordinates",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The address to geocode"
        }
      },
      required: ["address"]
    }
  };

/**
 * @constant REVERSE_GEOCODE_TOOL
 * @description Tool definition for converting coordinates into an address.
 */
export const REVERSE_GEOCODE_TOOL: Tool = {
  name: "maps_reverse_geocode",
  description: "Convert coordinates into an address",
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
      }
    },
    required: ["latitude", "longitude"]
  }
};
