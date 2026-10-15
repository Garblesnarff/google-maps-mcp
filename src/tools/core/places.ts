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
  description: "Search for places using the Google Places API (New)",
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
      },
      fields: {
        type: "string",
        description: "Optional comma-separated field mask for the Places API (New) response, e.g. 'places.displayName,places.formattedAddress'. Omit for the default useful set."
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
  description: "Get detailed information about a specific place using the Google Places API (New)",
  inputSchema: {
    type: "object",
    properties: {
      place_id: {
        type: "string",
        description: "The place ID to get details for"
      },
      fields: {
        type: "string",
        description: "Optional comma-separated field mask for the Places API (New) response, e.g. 'displayName,formattedAddress'. Omit for the default useful set."
      }
    },
    required: ["place_id"]
  }
};
