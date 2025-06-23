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
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the place search request.
 *
 * @param {string} query - Search query.
 * @param {{latitude: number; longitude: number}} [location] - Optional center point for the search.
 * @param {number} [radius] - Search radius in meters (max 50000).
 * @returns {Promise<ToolResponse>} A ToolResponse containing the search results or an error.
 */
export declare function handlePlaceSearch(query: string, location?: {
    latitude: number;
    longitude: number;
}, radius?: number): Promise<ToolResponse>;
/**
 * Handles the place details request.
 *
 * @param {string} place_id - The place ID to get details for.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the place details or an error.
 */
export declare function handlePlaceDetails(place_id: string): Promise<ToolResponse>;
//# sourceMappingURL=places.d.ts.map