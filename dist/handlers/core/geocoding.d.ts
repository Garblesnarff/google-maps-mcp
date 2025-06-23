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
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the geocoding request, converting an address to geographic coordinates.
 *
 * @param {string} address - The address to geocode.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the geocoded location or an error.
 */
export declare function handleGeocode(address: string): Promise<ToolResponse>;
/**
 * Handles the reverse geocoding request, converting coordinates to an address.
 *
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the reverse geocoded address or an error.
 */
export declare function handleReverseGeocode(latitude: number, longitude: number): Promise<ToolResponse>;
//# sourceMappingURL=geocoding.d.ts.map