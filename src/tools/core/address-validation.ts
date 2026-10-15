/**
 * address-validation.ts - Address Validation tool definition
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Wonky
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * @constant VALIDATE_ADDRESS_TOOL
 * @description Tool definition for validating a postal address.
 */
export const VALIDATE_ADDRESS_TOOL: Tool = {
  name: "maps_validate_address",
  description:
    "Validate a postal address using the Google Address Validation API. " +
    "Returns a verdict (is it complete/valid?), the formatted address, " +
    "component-level confirmation, and a geocode.",
  inputSchema: {
    type: "object",
    properties: {
      address_lines: {
        type: "array",
        items: { type: "string" },
        description: "Unstructured address lines, e.g. [\"1600 Amphitheatre Pkwy\", \"Mountain View, CA 94043\"]"
      },
      region_code: {
        type: "string",
        description: "CLDR region code, e.g. \"US\". Inferred from the address if omitted."
      },
      session_token: {
        type: "string",
        description: "Optional Autocomplete (New) session token to tie this validation to a billing session"
      }
    },
    required: ["address_lines"]
  }
};
