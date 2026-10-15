/**
 * roads.ts - Roads API tool definitions (snap to roads + speed limits)
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Wonky
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * @constant SNAP_TO_ROADS_TOOL
 * @description Tool definition for snapping GPS points to roads.
 */
export const SNAP_TO_ROADS_TOOL: Tool = {
  name: "maps_snap_to_roads",
  description:
    "Snap GPS points to the most likely roads using the Google Roads API. " +
    "Takes up to 100 lat/lng points (e.g. a noisy GPS track) and returns " +
    "them snapped to road geometry with place IDs.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "array",
        items: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" }
          },
          required: ["latitude", "longitude"]
        },
        description: "GPS points to snap (2-100 points, ideally close together)"
      },
      interpolate: {
        type: "boolean",
        description: "Interpolate the full road geometry between points (default false)"
      }
    },
    required: ["path"]
  }
};

/**
 * @constant SPEED_LIMITS_TOOL
 * @description Tool definition for looking up speed limits.
 */
export const SPEED_LIMITS_TOOL: Tool = {
  name: "maps_speed_limits",
  description:
    "Get posted speed limits for road segments using the Google Roads API. " +
    "Give it GPS points (snapped first with maps_snap_to_roads for best results).",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "array",
        items: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" }
          },
          required: ["latitude", "longitude"]
        },
        description: "Points to look up speed limits for (up to 100)"
      }
    },
    required: ["path"]
  }
};
