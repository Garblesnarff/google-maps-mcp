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
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the elevation request.
 *
 * @param {Array<{latitude: number; longitude: number}>} locations - Array of locations to get elevation for.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the elevation data or an error.
 */
export declare function handleElevation(locations: Array<{
    latitude: number;
    longitude: number;
}>): Promise<ToolResponse>;
//# sourceMappingURL=elevation.d.ts.map