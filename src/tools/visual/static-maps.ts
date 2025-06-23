/**
 * static-maps.ts - Maps Static API tool
 *
 * This file contains the tool definition for Google Maps Static API,
 * which allows retrieving static map images in various formats and styles.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Claude
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Static Maps Tool
// ====================================

/**
 * @constant STATIC_MAP_TOOL
 * @description Tool definition for retrieving static map images from Google Maps Static API.
 * Supports multiple map types (roadmap, satellite, terrain, hybrid) with optional markers.
 */
export const STATIC_MAP_TOOL: Tool = {
  name: "maps_static_map",
  description: "Get static map images in various styles (satellite, roadmap, terrain, hybrid) with optional markers",
  inputSchema: {
    type: "object",
    properties: {
      center: {
        type: "string",
        description: "Center point of the map (address or lat,lng coordinates)"
      },
      zoom: {
        type: "number",
        description: "Zoom level (1-20, where 1=world view, 20=building level)",
        default: 13
      },
      size: {
        type: "string",
        description: "Image size in pixels (e.g., '640x640', max 640x640)",
        default: "640x640"
      },
      maptype: {
        type: "string",
        description: "Type of map to display",
        enum: ["roadmap", "satellite", "terrain", "hybrid"],
        default: "roadmap"
      },
      markers: {
        type: "array",
        description: "Optional markers to add to the map",
        items: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "Location of the marker (address or lat,lng)"
            },
            color: {
              type: "string",
              description: "Color of the marker (red, blue, green, purple, yellow, gray, orange, white)"
            },
            label: {
              type: "string",
              description: "Single alphanumeric character to label the marker (A-Z, 0-9)"
            }
          },
          required: ["location"]
        }
      },
      download: {
        type: "boolean",
        description: "Whether to download the image locally (default: false)",
        default: false
      },
      downloadDir: {
        type: "string",
        description: "Custom directory to save downloaded image (optional, defaults to 'downloads/maps')"
      }
    },
    required: ["center"]
  }
};
