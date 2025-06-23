/**
 * air-quality.ts - Open-Meteo air quality handler
 *
 * This file contains handler functions for fetching air quality data from Open-Meteo Air Quality API.
 *
 * Dependencies:
 * - ../../types/environmental.js (for AirQualityResponse)
 * - ../../utils/api-client.js (for fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the air quality data request.
 *
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @param {number} [forecast_days=1] - Number of forecast days (1-5).
 * @returns {Promise<ToolResponse>} A ToolResponse containing the air quality data or an error.
 */
export declare function handleAirQuality(latitude: number, longitude: number, forecast_days?: number): Promise<ToolResponse>;
//# sourceMappingURL=air-quality.d.ts.map