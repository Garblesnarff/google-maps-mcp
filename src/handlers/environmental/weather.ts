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

import { WeatherResponse } from "../../types/environmental.js";
import { fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Weather API Handlers
// ====================================

/**
 * Handles the weather data request.
 *
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @param {number} [forecast_days=3] - Number of forecast days (1-16).
 * @param {boolean} [include_hourly=false] - Include hourly forecast.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the weather data or an error.
 */
export async function handleWeather(
  latitude: number,
  longitude: number,
  forecast_days: number = 3,
  include_hourly: boolean = false
): Promise<ToolResponse> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m");
  url.searchParams.append("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code");
  url.searchParams.append("forecast_days", forecast_days.toString());
  url.searchParams.append("timezone", "auto");

  if (include_hourly) {
    url.searchParams.append("hourly", "temperature_2m,precipitation_probability,weather_code");
  }

  try {
    const data = await fetchJson<WeatherResponse>(url.toString());

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          location: { latitude, longitude },
          current: data.current,
          daily: data.daily,
          ...(include_hourly && { hourly: data.hourly })
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Weather request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
