/**
 * timezone.ts - Time Zone tool definition
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Wonky
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * @constant TIMEZONE_TOOL
 * @description Tool definition for looking up the time zone at coordinates.
 */
export const TIMEZONE_TOOL: Tool = {
  name: "maps_timezone",
  description:
    "Get the time zone for a latitude/longitude using the Google Time Zone API. " +
    "Returns the IANA time zone ID, display name, and UTC offsets.",
  inputSchema: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude (-90 to 90)"
      },
      longitude: {
        type: "number",
        description: "Longitude (-180 to 180)"
      },
      timestamp: {
        type: "number",
        description: "Unix timestamp for DST calculation. Defaults to now."
      }
    },
    required: ["latitude", "longitude"]
  }
};
