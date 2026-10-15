/**
 * timezone.ts - Time Zone API handler
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for TimeZoneResponse)
 * - ../../utils/api-client.js (for fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../../types/common.js (for ToolResponse)
 *
 * @author Wonky
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { TimeZoneResponse } from "../../types/google-maps.js";
import { fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Time Zone API Handler
// ====================================

/**
 * Looks up the time zone for a pair of coordinates.
 *
 * @param {number} latitude - Latitude (-90 to 90).
 * @param {number} longitude - Longitude (-180 to 180).
 * @param {number} [timestamp] - Unix timestamp for DST; defaults to now.
 * @returns {Promise<ToolResponse>} Time zone ID, name, and UTC offsets.
 */
export async function handleTimezone(
  latitude: number,
  longitude: number,
  timestamp?: number
): Promise<ToolResponse> {
  if (typeof latitude !== "number" || latitude < -90 || latitude > 90) {
    return createErrorResponse("Latitude must be a number between -90 and 90");
  }
  if (typeof longitude !== "number" || longitude < -180 || longitude > 180) {
    return createErrorResponse("Longitude must be a number between -180 and 180");
  }
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || ts < 0) {
    return createErrorResponse("Timestamp must be a non-negative Unix timestamp");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/timezone/json");
  url.searchParams.append("location", `${latitude},${longitude}`);
  url.searchParams.append("timestamp", Math.floor(ts).toString());
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

  try {
    const data = await fetchJson<TimeZoneResponse>(url.toString());

    if (data.status !== "OK") {
      return createErrorResponse(`Time zone lookup failed: ${data.error_message || data.status}`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          time_zone_id: data.timeZoneId,
          time_zone_name: data.timeZoneName,
          dst_offset_seconds: data.dstOffset,
          raw_offset_seconds: data.rawOffset,
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Time zone request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
