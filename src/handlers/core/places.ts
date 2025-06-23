/**
 * places.ts - Places API handlers
 *
 * This file contains handler functions for Google Maps Places API.
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for PlacesSearchResponse, PlaceDetailsResponse)
 * - ../../utils/api-client.js (for fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { PlacesSearchResponse, PlaceDetailsResponse } from "../../types/google-maps.js";
import { fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Places API Handlers
// ====================================

/**
 * Handles the place search request.
 *
 * @param {string} query - Search query.
 * @param {{latitude: number; longitude: number}} [location] - Optional center point for the search.
 * @param {number} [radius] - Search radius in meters (max 50000).
 * @returns {Promise<ToolResponse>} A ToolResponse containing the search results or an error.
 */
export async function handlePlaceSearch(
  query: string,
  location?: { latitude: number; longitude: number },
  radius?: number
): Promise<ToolResponse> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.append("query", query);
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

  if (location) {
    url.searchParams.append("location", `${location.latitude},${location.longitude}`);
  }
  if (radius) {
    url.searchParams.append("radius", radius.toString());
  }

  try {
    const data = await fetchJson<PlacesSearchResponse>(url.toString());

    if (data.status !== "OK") {
      return createErrorResponse(`Place search failed: ${data.error_message || data.status}`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          places: data.results.map((place) => ({
            name: place.name,
            formatted_address: place.formatted_address,
            location: place.geometry.location,
            place_id: place.place_id,
            rating: place.rating,
            types: place.types
          }))
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Place search request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handles the place details request.
 *
 * @param {string} place_id - The place ID to get details for.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the place details or an error.
 */
export async function handlePlaceDetails(place_id: string): Promise<ToolResponse> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.append("place_id", place_id);
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

  try {
    const data = await fetchJson<PlaceDetailsResponse>(url.toString());

    if (data.status !== "OK") {
      return createErrorResponse(`Place details request failed: ${data.error_message || data.status}`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          name: data.result.name,
          formatted_address: data.result.formatted_address,
          location: data.result.geometry.location,
          formatted_phone_number: data.result.formatted_phone_number,
          website: data.result.website,
          rating: data.result.rating,
          reviews: data.result.reviews,
          opening_hours: data.result.opening_hours
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Place details request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
