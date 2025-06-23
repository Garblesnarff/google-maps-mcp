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

import { PollenResponse } from "../../types/environmental.js";
import { fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Pollen API Handlers
// ====================================

/**
 * Handles the pollen data request.
 *
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @param {number} [forecast_days=3] - Number of forecast days (1-5).
 * @returns {Promise<ToolResponse>} A ToolResponse containing the pollen data or an error.
 */
export async function handlePollen(
  latitude: number,
  longitude: number,
  forecast_days: number = 3
): Promise<ToolResponse> {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("current", "european_alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen");
  url.searchParams.append("daily", "european_alder_pollen_max,birch_pollen_max,grass_pollen_max,mugwort_pollen_max,olive_pollen_max,ragweed_pollen_max");
  url.searchParams.append("forecast_days", forecast_days.toString());
  url.searchParams.append("timezone", "auto");

  try {
    const data = await fetchJson<PollenResponse>(url.toString());

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          location: { latitude, longitude },
          current: data.current,
          daily: data.daily
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Pollen request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
