/**
 * geocoding.ts - Geocoding API handlers
 *
 * This file contains handler functions for Google Maps Geocoding API.
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for GeocodeResponse)
 * - ../../utils/api-client.js (for fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { GeocodeResponse } from "../../types/google-maps.js";
import { fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Geocoding API Handlers
// ====================================

/**
 * Handles the geocoding request, converting an address to geographic coordinates.
 *
 * @param {string} address - The address to geocode.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the geocoded location or an error.
 */
export async function handleGeocode(address: string): Promise<ToolResponse> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.append("address", address);
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

  try {
    const data = await fetchJson<GeocodeResponse>(url.toString());

    if (data.status !== "OK") {
      return createErrorResponse(`Geocoding failed: ${data.error_message || data.status}`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          location: data.results[0].geometry.location,
          formatted_address: data.results[0].formatted_address,
          place_id: data.results[0].place_id
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Geocoding request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handles the reverse geocoding request, converting coordinates to an address.
 *
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the reverse geocoded address or an error.
 */
export async function handleReverseGeocode(latitude: number, longitude: number): Promise<ToolResponse> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.append("latlng", `${latitude},${longitude}`);
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

  try {
    const data = await fetchJson<GeocodeResponse>(url.toString());

    if (data.status !== "OK") {
      return createErrorResponse(`Reverse geocoding failed: ${data.error_message || data.status}`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          formatted_address: data.results[0].formatted_address,
          place_id: data.results[0].place_id,
          address_components: data.results[0].address_components
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Reverse geocoding request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
