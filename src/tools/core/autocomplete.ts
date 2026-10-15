/**
 * autocomplete.ts - Place Autocomplete (New) tool definition
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Wonky
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * @constant AUTOCOMPLETE_TOOL
 * @description Tool definition for place autocomplete predictions.
 */
export const AUTOCOMPLETE_TOOL: Tool = {
  name: "maps_autocomplete",
  description:
    "Get place autocomplete predictions as the user types, using the Places API (New). " +
    "Pass the same session_token across keystrokes and then to place details / address " +
    "validation so the whole flow bills as one session.",
  inputSchema: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "The partial text to autocomplete, e.g. \"1600 Amphithe\""
      },
      session_token: {
        type: "string",
        description: "Optional session token (UUID). One is generated if omitted — reuse it across a typing session."
      },
      latitude: {
        type: "number",
        description: "Optional bias center latitude"
      },
      longitude: {
        type: "number",
        description: "Optional bias center longitude"
      }
    },
    required: ["input"]
  }
};
