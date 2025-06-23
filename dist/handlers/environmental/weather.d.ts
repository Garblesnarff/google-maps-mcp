/**
 * weather.ts - Open-Meteo weather handler
 *
 * This file contains handler functions for fetching weather data from Open-Meteo API.
 *
 * Dependencies:
 * - ../../types/environmental.js (for WeatherResponse)
 * - ../../utils/api-client.js (for fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the weather data request.
 *
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @param {number} [forecast_days=3] - Number of forecast days (1-16).
 * @param {boolean} [include_hourly=false] - Include hourly forecast.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the weather data or an error.
 */
export declare function handleWeather(latitude: number, longitude: number, forecast_days?: number, include_hourly?: boolean): Promise<ToolResponse>;
//# sourceMappingURL=weather.d.ts.map