/**
 * pollen.ts - Open-Meteo pollen handler
 *
 * This file contains handler functions for fetching pollen data from Open-Meteo Air Quality API.
 *
 * Dependencies:
 * - ../../types/environmental.js (for PollenResponse)
 * - ../../utils/api-client.js (for fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the pollen data request.
 *
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @param {number} [forecast_days=3] - Number of forecast days (1-5).
 * @returns {Promise<ToolResponse>} A ToolResponse containing the pollen data or an error.
 */
export declare function handlePollen(latitude: number, longitude: number, forecast_days?: number): Promise<ToolResponse>;
//# sourceMappingURL=pollen.d.ts.map