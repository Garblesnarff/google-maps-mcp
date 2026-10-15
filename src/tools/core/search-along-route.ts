/**
 * search-along-route.ts - Search Along Route tool definition
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Wonky
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * @constant SEARCH_ALONG_ROUTE_TOOL
 * @description Tool definition for searching places along a route polyline.
 */
export const SEARCH_ALONG_ROUTE_TOOL: Tool = {
  name: "maps_search_along_route",
  description:
    "Search for places along a route using the Places API (New). " +
    "Give it an encoded polyline (e.g. from maps_directions) and a query like " +
    "\"gas station\" to find stops without detouring far.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "What to search for, e.g. \"gas station\", \"coffee\""
      },
      encoded_polyline: {
        type: "string",
        description: "Encoded polyline of the route to search along"
      },
      max_results: {
        type: "number",
        description: "Max results to return (1-20, default 10)"
      }
    },
    required: ["query", "encoded_polyline"]
  }
};
