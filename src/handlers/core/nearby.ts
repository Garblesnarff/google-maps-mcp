/**
 * nearby.ts - Places Nearby Search (New) handler
 *
 * Searches via POST https://places.googleapis.com/v1/places:searchNearby
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for NearbySearchResponse)
 * - ../../utils/api-client.js (for postJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../../types/common.js (for ToolResponse)
 *
 * @author Wonky
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { NearbySearchResponse } from "../../types/google-maps.js";
import { postJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Nearby Search Handler
// ====================================

const NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby";
const NEARBY_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types";

/**
 * Searches for places near a location.
 *
 * @param {number} latitude - Center latitude (-90 to 90).
 * @param {number} longitude - Center longitude (-180 to 180).
 * @param {number} radius - Search radius in meters (max 50000).
 * @param {string[]} [included_types] - Optional place types, e.g. ["restaurant"].
 * @param {number} [max_results=10] - Max results (1-20).
 * @returns {Promise<ToolResponse>} Matching places.
 */
export async function handleNearbySearch(
  latitude: number,
  longitude: number,
  radius: number,
  included_types?: string[],
  max_results: number = 10
): Promise<ToolResponse> {
  if (typeof latitude !== "number" || latitude < -90 || latitude > 90) {
    return createErrorResponse("Latitude must be a number between -90 and 90");
  }
  if (typeof longitude !== "number" || longitude < -180 || longitude > 180) {
    return createErrorResponse("Longitude must be a number between -180 and 180");
  }
  if (typeof radius !== "number" || radius <= 0 || radius > 50000) {
    return createErrorResponse("Radius must be between 1 and 50000 meters");
  }
  const maxResultCount = Math.min(20, Math.max(1, Math.floor(max_results || 10)));

  const body: Record<string, unknown> = {
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius,
      },
    },
    maxResultCount,
  };
  if (included_types && included_types.length > 0) {
    body.includedTypes = included_types;
  }

  try {
    const data = await postJson<NearbySearchResponse>(NEARBY_SEARCH_URL, body, {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": NEARBY_FIELD_MASK,
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          places: (data.places || []).map((place) => ({
            name: place.displayName?.text,
            formatted_address: place.formattedAddress,
            location: place.location,
            place_id: place.id,
            rating: place.rating,
            types: place.types,
          })),
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Nearby search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
