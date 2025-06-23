/**
 * places.ts - Places tools
 *
 * This file contains the tool definitions for searching places and getting place details.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Cline
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Places Tools
// ====================================

/**
 * @constant SEARCH_PLACES_TOOL
 * @description Tool definition for searching for places using Google Places API.
 */
export const SEARCH_PLACES_TOOL: Tool = {
  name: "maps_search_places",
  description: "Search for places using Google Places API",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query"
      },
      location: {
        type: "object",
        properties: {
          latitude: { type: "number" },
          longitude: { type: "number" }
        },
        description: "Optional center point for the search"
      },
      radius: {
        type: "number",
        description: "Search radius in meters (max 50000)"
      }
    },
    required: ["query"]
  }
};

/**
 * @constant PLACE_DETAILS_TOOL
 * @description Tool definition for getting detailed information about a specific place.
 */
export const PLACE_DETAILS_TOOL: Tool = {
  name: "maps_place_details",
  description: "Get detailed information about a specific place",
  inputSchema: {
    type: "object",
    properties: {
      place_id: {
        type: "string",
        description: "The place ID to get details for"
      }
    },
    required: ["place_id"]
  }
};
