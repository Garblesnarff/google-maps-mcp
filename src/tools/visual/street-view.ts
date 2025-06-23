/**
 * street-view.ts - Street View Static API tool
 *
 * This file contains the tool definition for Google Street View Static API,
 * which allows retrieving Street View images for any location.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Claude
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ====================================
// Street View Tool
// ====================================

/**
 * @constant STREET_VIEW_TOOL
 * @description Tool definition for retrieving Street View images from Google Street View Static API.
 * Allows users to get panoramic street-level imagery of any location.
 */
export const STREET_VIEW_TOOL: Tool = {
  name: "maps_street_view",
  description: "Get Street View images for any location with customizable viewing angle and field of view",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "Address or lat,lng coordinates (e.g., 'Times Square, NYC' or '40.758,-73.985')"
      },
      size: {
        type: "string",
        description: "Image size in pixels (e.g., '640x640', max 640x640)",
        default: "640x640"
      },
      heading: {
        type: "number",
        description: "Compass heading in degrees (0-360, 0=North, 90=East, 180=South, 270=West)",
        default: 0
      },
      pitch: {
        type: "number",
        description: "Up/down viewing angle in degrees (-90 to 90, 0=horizontal, positive=up, negative=down)",
        default: 0
      },
      fov: {
        type: "number",
        description: "Field of view in degrees (10-120, determines zoom level, lower=more zoomed)",
        default: 90
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
    required: ["location"]
  }
};
