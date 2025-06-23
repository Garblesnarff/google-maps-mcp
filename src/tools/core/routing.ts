/**
 * routing.ts - Routing tools
 *
 * This file contains the tool definitions for directions, distance matrix, and routes.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Cline
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Routing Tools
// ====================================

/**
 * @constant DISTANCE_MATRIX_TOOL
 * @description Tool definition for calculating travel distance and time for multiple origins and destinations.
 */
export const DISTANCE_MATRIX_TOOL: Tool = {
  name: "maps_distance_matrix",
  description: "Calculate travel distance and time for multiple origins and destinations",
  inputSchema: {
    type: "object",
    properties: {
      origins: {
        type: "array",
        items: { type: "string" },
        description: "Array of origin addresses or coordinates"
      },
      destinations: {
        type: "array",
        items: { type: "string" },
        description: "Array of destination addresses or coordinates"
      },
      mode: {
        type: "string",
        description: "Travel mode (driving, walking, bicycling, transit)",
        enum: ["driving", "walking", "bicycling", "transit"]
      }
    },
    required: ["origins", "destinations"]
  }
};

/**
 * @constant DIRECTIONS_TOOL
 * @description Tool definition for getting directions between two points.
 */
export const DIRECTIONS_TOOL: Tool = {
  name: "maps_directions",
  description: "Get directions between two points",
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
      }
    },
    required: ["origin", "destination"]
  }
};

/**
 * @constant ROUTES_TOOL
 * @description Tool definition for enhanced route planning with detailed navigation using Routes API.
 */
export const ROUTES_TOOL: Tool = {
  name: "maps_routes",
  description: "Get enhanced route planning with detailed navigation using Routes API",
  inputSchema: {
    type: "object",
    properties: {
      origin: {
        type: "object",
        properties: {
          latitude: { type: "number" },
          longitude: { type: "number" }
        },
        description: "Starting point coordinates",
        required: ["latitude", "longitude"]
      },
      destination: {
        type: "object",
        properties: {
          latitude: { type: "number" },
          longitude: { type: "number" }
        },
        description: "Ending point coordinates",
        required: ["latitude", "longitude"]
      },
      travel_mode: {
        type: "string",
        description: "Travel mode",
        enum: ["DRIVE", "WALK", "BICYCLE", "TRANSIT"],
        default: "DRIVE"
      },
      routing_preference: {
        type: "string",
        description: "Routing preference",
        enum: ["TRAFFIC_UNAWARE", "TRAFFIC_AWARE", "TRAFFIC_AWARE_OPTIMAL"],
        default: "TRAFFIC_UNAWARE"
      }
    },
    required: ["origin", "destination"]
  }
};
