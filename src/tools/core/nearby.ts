/**
 * nearby.ts - Places Nearby Search tool definition
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Wonky
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * @constant NEARBY_SEARCH_TOOL
 * @description Tool definition for searching places near a location.
 */
export const NEARBY_SEARCH_TOOL: Tool = {
  name: "maps_search_nearby",
  description:
    "Search for places near a location using the Places API (New) Nearby Search. " +
    "Find restaurants, shops, attractions, and more within a radius.",
  inputSchema: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Center latitude (-90 to 90)"
      },
      longitude: {
        type: "number",
        description: "Center longitude (-180 to 180)"
      },
      radius: {
        type: "number",
        description: "Search radius in meters (max 50000)"
      },
      included_types: {
        type: "array",
        items: { type: "string" },
        description: "Optional place types to include, e.g. [\"restaurant\", \"cafe\"]"
      },
      max_results: {
        type: "number",
        description: "Max results to return (1-20, default 10)"
      }
    },
    required: ["latitude", "longitude", "radius"]
  }
};
