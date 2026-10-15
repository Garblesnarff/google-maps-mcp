/**
 * elevation.ts - Elevation API handlers
 *
 * This file contains handler functions for Google Maps Elevation API.
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for ElevationResponse)
 * - ../../utils/api-client.js (for fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { ElevationResponse } from "../../types/google-maps.js";
import { fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { LruCache, cacheKey, getOrFetch } from "../../utils/lru-cache.js";
import { ToolResponse } from "../../types/common.js";

// Elevation data never changes: cache up to 200 responses for 24h.
const ELEVATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const elevationCache = new LruCache<string, ElevationResponse>(200, ELEVATION_CACHE_TTL_MS);

// ====================================
// Elevation API Handlers
// ====================================

/**
 * Handles the elevation request.
 *
 * @param {Array<{latitude: number; longitude: number}>} locations - Array of locations to get elevation for.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the elevation data or an error.
 */
export async function handleElevation(locations: Array<{ latitude: number; longitude: number }>): Promise<ToolResponse> {
  const url = new URL("https://maps.googleapis.com/maps/api/elevation/json");
  const locationString = locations
    .map((loc) => `${loc.latitude},${loc.longitude}`)
    .join("|");
  url.searchParams.append("locations", locationString);
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

  try {
    const data = await getOrFetch(elevationCache, cacheKey(url.toString()), () =>
      fetchJson<ElevationResponse>(url.toString())
    );

    if (data.status !== "OK") {
      return createErrorResponse(`Elevation request failed: ${data.error_message || data.status}`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          results: data.results.map((result) => ({
            elevation: result.elevation,
            location: result.location,
            resolution: result.resolution
          }))
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Elevation request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
