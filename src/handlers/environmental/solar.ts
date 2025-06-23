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

import { SolarResponse } from "../../types/environmental.js";
import { fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Solar API Handlers
// ====================================

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
export async function handleSolar(
  latitude: number,
  longitude: number,
  tilt: number = 0,
  azimuth: number = 180,
  forecast_days: number = 1
): Promise<ToolResponse> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("current", "global_tilted_irradiance,direct_normal_irradiance,diffuse_horizontal_irradiance");
  url.searchParams.append("hourly", "global_tilted_irradiance,direct_normal_irradiance,diffuse_horizontal_irradiance,global_horizontal_irradiance");
  url.searchParams.append("forecast_days", forecast_days.toString());
  url.searchParams.append("tilt", tilt.toString());
  url.searchParams.append("azimuth", azimuth.toString());
  url.searchParams.append("timezone", "auto");

  try {
    const data = await fetchJson<SolarResponse>(url.toString());

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          location: { latitude, longitude },
          panel_config: { tilt, azimuth },
          current: data.current,
          hourly: data.hourly
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Solar request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
