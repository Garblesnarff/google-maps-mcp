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

import { AirQualityResponse } from "../../types/environmental.js";
import { fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Air Quality API Handlers
// ====================================

/**
 * Handles the air quality data request.
 *
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @param {number} [forecast_days=1] - Number of forecast days (1-5).
 * @returns {Promise<ToolResponse>} A ToolResponse containing the air quality data or an error.
 */
export async function handleAirQuality(
  latitude: number,
  longitude: number,
  forecast_days: number = 1
): Promise<ToolResponse> {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("current", "us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone");
  url.searchParams.append("hourly", "us_aqi,pm10,pm2_5");
  url.searchParams.append("forecast_days", forecast_days.toString());
  url.searchParams.append("timezone", "auto");

  try {
    const data = await fetchJson<AirQualityResponse>(url.toString());

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          location: { latitude, longitude },
          current: data.current,
          hourly: data.hourly
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Air quality request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
