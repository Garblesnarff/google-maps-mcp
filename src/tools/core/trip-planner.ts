/**
 * trip-planner.ts - Trip planner tool definition
 *
 * Composite tool: plans a whole trip (route + stops + destination weather)
 * in a single call.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Wonky
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Trip Planner Tool
// ====================================

/**
 * @constant PLAN_TRIP_TOOL
 * @description Tool definition for planning a complete trip.
 */
export const PLAN_TRIP_TOOL: Tool = {
  name: "maps_plan_trip",
  description:
    "Plan a complete trip in one call: computes the route, looks up each requested stop, and includes destination weather. " +
    "Fans out to directions, place search, geocoding, and weather internally.",
  inputSchema: {
    type: "object",
    properties: {
      origin: {
        type: "string",
        description: "Starting point address or coordinates"
      },
      destination: {
        type: "string",
        description: "Ending point address or coordinates"
      },
      mode: {
        type: "string",
        description: "Travel mode (driving, walking, bicycling, transit)",
        enum: ["driving", "walking", "bicycling", "transit"]
      },
      stops: {
        type: "array",
        items: { type: "string" },
        description: "Optional place queries to look up along the way (top result per query)"
      },
      include_weather: {
        type: "boolean",
        description: "Whether to include destination weather (default true)"
      }
    },
    required: ["origin", "destination"]
  }
};
