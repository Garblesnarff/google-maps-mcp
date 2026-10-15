/**
 * search-along-route.ts - Search Along Route handler (Places API New)
 *
 * Searches via POST https://places.googleapis.com/v1/places:searchText
 * with searchAlongRouteParameters.
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for PlacesSearchResponse)
 * - ../../utils/api-client.js (for postJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../../types/common.js (for ToolResponse)
 *
 * @author Wonky
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { PlacesSearchResponse } from "../../types/google-maps.js";
import { postJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Search Along Route Handler
// ====================================

const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const SEARCH_FIELD_MASK = "places.displayName,places.formattedAddress,places.location,places.id,places.rating,places.types";

/**
 * Searches for places along a route polyline.
 *
 * @param {string} query - What to search for, e.g. "gas station".
 * @param {string} encoded_polyline - Encoded polyline of the route.
 * @param {number} [max_results=10] - Max results (1-20).
 * @returns {Promise<ToolResponse>} Places along the route.
 */
export async function handleSearchAlongRoute(
  query: string,
  encoded_polyline: string,
  max_results: number = 10
): Promise<ToolResponse> {
  if (!query || query.trim() === "") {
    return createErrorResponse("Query is required and cannot be empty");
  }
  if (!encoded_polyline || encoded_polyline.trim() === "") {
    return createErrorResponse("Encoded polyline is required and cannot be empty");
  }
  const maxResultCount = Math.min(20, Math.max(1, Math.floor(max_results || 10)));

  const body = {
    textQuery: query,
    searchAlongRouteParameters: {
      polyline: { encodedPolyline: encoded_polyline },
    },
    maxResultCount,
  };

  try {
    const data = await postJson<PlacesSearchResponse>(SEARCH_TEXT_URL, body, {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
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
    return createErrorResponse(`Search along route failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
