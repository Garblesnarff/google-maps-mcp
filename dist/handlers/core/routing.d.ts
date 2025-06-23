/**
 * routing.ts - Directions/Routes API handlers
 *
 * This file contains handler functions for Google Maps Directions and Routes API.
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for DistanceMatrixResponse, DirectionsResponse, RoutesResponse)
 * - ../../utils/api-client.js (for fetchJson, postJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the distance matrix request.
 *
 * @param {string[]} origins - Array of origin addresses or coordinates.
 * @param {string[]} destinations - Array of destination addresses or coordinates.
 * @param {"driving" | "walking" | "bicycling" | "transit"} [mode="driving"] - Travel mode.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the distance matrix results or an error.
 */
export declare function handleDistanceMatrix(origins: string[], destinations: string[], mode?: "driving" | "walking" | "bicycling" | "transit"): Promise<ToolResponse>;
/**
 * Handles the directions request.
 *
 * @param {string} origin - Starting point address or coordinates.
 * @param {string} destination - Ending point address or coordinates.
 * @param {"driving" | "walking" | "bicycling" | "transit"} [mode="driving"] - Travel mode.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the directions or an error.
 */
export declare function handleDirections(origin: string, destination: string, mode?: "driving" | "walking" | "bicycling" | "transit"): Promise<ToolResponse>;
/**
 * Handles the enhanced routes request using the Routes API.
 *
 * @param {{latitude: number; longitude: number}} origin - Starting point coordinates.
 * @param {{latitude: number; longitude: number}} destination - Ending point coordinates.
 * @param {"DRIVE" | "WALK" | "BICYCLE" | "TRANSIT"} [travel_mode="DRIVE"] - Travel mode.
 * @param {"TRAFFIC_UNAWARE" | "TRAFFIC_AWARE" | "TRAFFIC_AWARE_OPTIMAL"} [routing_preference="TRAFFIC_UNAWARE"] - Routing preference.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the route details or an error.
 */
export declare function handleRoutes(origin: {
    latitude: number;
    longitude: number;
}, destination: {
    latitude: number;
    longitude: number;
}, travel_mode?: "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT", routing_preference?: "TRAFFIC_UNAWARE" | "TRAFFIC_AWARE" | "TRAFFIC_AWARE_OPTIMAL"): Promise<ToolResponse>;
//# sourceMappingURL=routing.d.ts.map