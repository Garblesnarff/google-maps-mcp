/**
 * address-validation.ts - Address Validation API handler
 *
 * Validates postal addresses via
 * POST https://addressvalidation.googleapis.com/v1:validateAddress
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for AddressValidationResponse)
 * - ../../utils/api-client.js (for postJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../../types/common.js (for ToolResponse)
 *
 * @author Wonky
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { AddressValidationResponse } from "../../types/google-maps.js";
import { postJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Address Validation API Handler
// ====================================

const VALIDATE_ADDRESS_URL = "https://addressvalidation.googleapis.com/v1:validateAddress";

/**
 * Validates a postal address.
 *
 * @param {string[]} address_lines - Unstructured address lines.
 * @param {string} [region_code] - CLDR region code, e.g. "US".
 * @param {string} [session_token] - Optional Autocomplete (New) session token.
 * @returns {Promise<ToolResponse>} Validation verdict, formatted address, and geocode.
 */
export async function handleValidateAddress(
  address_lines: string[],
  region_code?: string,
  session_token?: string
): Promise<ToolResponse> {
  if (!Array.isArray(address_lines) || address_lines.length === 0) {
    return createErrorResponse("address_lines must be a non-empty array of strings");
  }
  if (address_lines.some((line) => typeof line !== "string" || line.trim() === "")) {
    return createErrorResponse("Every address line must be a non-empty string");
  }

  const body: Record<string, unknown> = {
    address: {
      addressLines: address_lines,
      ...(region_code ? { regionCode: region_code } : {}),
    },
    ...(session_token ? { sessionToken: session_token } : {}),
  };

  try {
    const data = await postJson<AddressValidationResponse>(VALIDATE_ADDRESS_URL, body, {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
    });

    if (data.error) {
      return createErrorResponse(`Address validation failed: ${data.error.message || "unknown error"}`);
    }
    if (!data.result) {
      return createErrorResponse("Address validation returned no result");
    }

    const result = data.result;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          verdict: result.verdict,
          formatted_address: result.address?.formattedAddress,
          address_components: result.address?.addressComponents,
          unconfirmed_component_types: result.address?.unconfirmedComponentTypes,
          geocode: result.geocode,
          response_id: data.responseId,
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Address validation request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
