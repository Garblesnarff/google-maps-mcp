/**
 * autocomplete.ts - Place Autocomplete (New) handler
 *
 * Requests via POST https://places.googleapis.com/v1/places:autocomplete
 *
 * Dependencies:
 * - node:crypto (for randomUUID session tokens)
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for AutocompleteResponse)
 * - ../../utils/api-client.js (for postJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../../types/common.js (for ToolResponse)
 *
 * @author Wonky
 */

import { randomUUID } from "node:crypto";
import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { AutocompleteResponse } from "../../types/google-maps.js";
import { postJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Autocomplete Handler
// ====================================

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const AUTOCOMPLETE_FIELD_MASK =
  "suggestions.placePrediction.place,suggestions.placePrediction.placeId,suggestions.placePrediction.text";

/**
 * Returns place autocomplete predictions for partial input.
 *
 * @param {string} input - Partial text to autocomplete.
 * @param {string} [session_token] - Session token; one is generated when omitted.
 *   Reuse the same token across a typing session (and the follow-up place
 *   details / address validation call) for session billing.
 * @param {number} [latitude] - Optional bias center latitude.
 * @param {number} [longitude] - Optional bias center longitude.
 * @returns {Promise<ToolResponse>} Predictions plus the session token used.
 */
export async function handleAutocomplete(
  input: string,
  session_token?: string,
  latitude?: number,
  longitude?: number
): Promise<ToolResponse> {
  if (!input || input.trim() === "") {
    return createErrorResponse("Input is required and cannot be empty");
  }
  if (
    (latitude !== undefined && (typeof latitude !== "number" || latitude < -90 || latitude > 90)) ||
    (longitude !== undefined && (typeof longitude !== "number" || longitude < -180 || longitude > 180))
  ) {
    return createErrorResponse("Bias latitude must be -90 to 90 and longitude -180 to 180");
  }
  if (latitude !== undefined && longitude === undefined) {
    return createErrorResponse("Provide both latitude and longitude for location bias, or neither");
  }

  const token = session_token && session_token.trim() !== "" ? session_token : randomUUID();

  const body: Record<string, unknown> = {
    input,
    sessionToken: token,
  };
  if (latitude !== undefined && longitude !== undefined) {
    body.locationBias = {
      circle: { center: { latitude, longitude }, radius: 50000.0 },
    };
  }

  try {
    const data = await postJson<AutocompleteResponse>(AUTOCOMPLETE_URL, body, {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": AUTOCOMPLETE_FIELD_MASK,
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          session_token: token,
          suggestions: (data.suggestions || []).map((s) => ({
            text: s.placePrediction?.text?.text,
            place_id: s.placePrediction?.placeId,
            place: s.placePrediction?.place,
          })),
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Autocomplete failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
