/**
 * solar.ts - Open-Meteo solar handler
 *
 * This file contains handler functions for fetching solar data from Open-Meteo Solar API.
 *
 * Dependencies:
 * - ../../types/environmental.js (for SolarResponse)
 * - ../../utils/api-client.js (for fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the solar data request.
 *
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @param {number} [tilt=0] - Solar panel tilt angle in degrees (0-90).
 * @param {number} [azimuth=180] - Solar panel azimuth angle in degrees.
 * @param {number} [forecast_days=1] - Number of forecast days (1-5).
 * @returns {Promise<ToolResponse>} A ToolResponse containing the solar data or an error.
 */
export declare function handleSolar(latitude: number, longitude: number, tilt?: number, azimuth?: number, forecast_days?: number): Promise<ToolResponse>;
//# sourceMappingURL=solar.d.ts.map