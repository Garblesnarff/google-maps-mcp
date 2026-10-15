/**
 * places.ts - Places API (New) handlers
 *
 * This file contains handler functions for the Google Places API (New).
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for PlacesSearchResponse, PlaceDetailsResponse)
 * - ../../utils/api-client.js (for postJson, fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { PlacesSearchResponse, PlaceDetailsResponse } from "../../types/google-maps.js";
import { postJson, fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { LruCache, cacheKey, getOrFetch } from "../../utils/lru-cache.js";
import { ToolResponse } from "../../types/common.js";

// Place details are stable: cache up to 200 responses for 24h.
// The requested field mask is part of the key (different masks, different payloads).
const PLACE_DETAILS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const placeDetailsCache = new LruCache<string, PlaceDetailsResponse>(200, PLACE_DETAILS_CACHE_TTL_MS);

// ====================================
// Places API (New) Handlers
// ====================================

/**
 * Base URL for the Places API (New) search endpoint.
 */
const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

/**
 * Base URL for the Places API (New) details endpoint.
 */
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";

/**
 * Default X-Goog-FieldMask used for place searches when no fields are requested.
 */
const DEFAULT_SEARCH_FIELD_MASK = "places.displayName,places.formattedAddress,places.location,places.id,places.rating,places.types";

/**
 * Default X-Goog-FieldMask used for place details when no fields are requested.
 */
const DEFAULT_DETAILS_FIELD_MASK = "displayName,formattedAddress,location,nationalPhoneNumber,websiteUri,rating,reviews,currentOpeningHours";

/**
 * Handles the place search request using the Places API (New).
 *
 * @param {string} query - Search query.
 * @param {{latitude: number; longitude: number}} [location] - Optional center point for the search.
 * @param {number} [radius] - Search radius in meters (max 50000).
 * @param {string} [fields] - Optional comma-separated field mask for the search results.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the search results or an error.
 */
export async function handlePlaceSearch(
  query: string,
  location?: { latitude: number; longitude: number },
  radius?: number,
  fields?: string
): Promise<ToolResponse> {
  const requestBody: {
    textQuery: string;
    locationBias?: {
      circle: {
        center: { latitude: number; longitude: number };
        radius: number;
      };
    };
  } = {
    textQuery: query
  };

  if (location && radius) {
    requestBody.locationBias = {
      circle: {
        center: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        radius
      }
    };
  }

  try {
    const data = await postJson<PlacesSearchResponse>(PLACES_SEARCH_URL, requestBody, {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": fields || DEFAULT_SEARCH_FIELD_MASK
    });

    if (!data.places || data.places.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No places found matching your search. Try a different query or widen the search area."
        }],
        isError: false
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          places: data.places.map((place) => ({
            name: place.displayName?.text,
            formatted_address: place.formattedAddress,
            location: place.location,
            place_id: place.id,
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
 * Handles the place details request using the Places API (New).
 *
 * @param {string} place_id - The place ID to get details for.
 * @param {string} [fields] - Optional comma-separated field mask for the place details.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the place details or an error.
 */
export async function handlePlaceDetails(
  place_id: string,
  fields?: string
): Promise<ToolResponse> {
  const url = `${PLACES_DETAILS_URL}/${encodeURIComponent(place_id)}`;

  try {
    const fieldMask = fields || DEFAULT_DETAILS_FIELD_MASK;
    const data = await getOrFetch(
      placeDetailsCache,
      cacheKey(`${url}|fields=${fieldMask}`),
      () => fetchJson<PlaceDetailsResponse>(url, {
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": fieldMask
      })
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          name: data.displayName?.text,
          formatted_address: data.formattedAddress,
          location: data.location,
          formatted_phone_number: data.nationalPhoneNumber,
          website: data.websiteUri,
          rating: data.rating,
          reviews: data.reviews?.map((review) => ({
            author_name: review.authorAttribution?.displayName,
            rating: review.rating,
            text: review.text?.text,
            time: review.publishTime
          })),
          opening_hours: data.currentOpeningHours
            ? {
                weekday_text: data.currentOpeningHours.weekdayDescriptions,
                open_now: data.currentOpeningHours.openNow
              }
            : undefined
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Place details request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
