/**
 * roads.ts - Roads API handlers (snap to roads + speed limits)
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for RoadsSnapResponse, SpeedLimitsResponse)
 * - ../../utils/api-client.js (for fetchJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../../types/common.js (for ToolResponse)
 *
 * @author Wonky
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { RoadsSnapResponse, SpeedLimitsResponse } from "../../types/google-maps.js";
import { fetchJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Roads API Handlers
// ====================================

interface LatLng {
  latitude: number;
  longitude: number;
}

function validatePath(path: LatLng[]): string | null {
  if (!Array.isArray(path) || path.length < 2 || path.length > 100) {
    return "Path must be an array of 2 to 100 points";
  }
  for (const point of path) {
    if (
      typeof point?.latitude !== "number" || point.latitude < -90 || point.latitude > 90 ||
      typeof point?.longitude !== "number" || point.longitude < -180 || point.longitude > 180
    ) {
      return "Every point needs a latitude (-90 to 90) and longitude (-180 to 180)";
    }
  }
  return null;
}

function pathParam(path: LatLng[]): string {
  return path.map((p) => `${p.latitude},${p.longitude}`).join("|");
}

/**
 * Snaps GPS points to the most likely roads.
 *
 * @param {LatLng[]} path - 2-100 GPS points.
 * @param {boolean} [interpolate=false] - Interpolate full road geometry.
 * @returns {Promise<ToolResponse>} Snapped points with place IDs.
 */
export async function handleSnapToRoads(
  path: LatLng[],
  interpolate: boolean = false
): Promise<ToolResponse> {
  const validationError = validatePath(path);
  if (validationError) {
    return createErrorResponse(validationError);
  }

  const url = new URL("https://roads.googleapis.com/v1/snapToRoads");
  url.searchParams.append("path", pathParam(path));
  url.searchParams.append("interpolate", String(!!interpolate));
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

  try {
    const data = await fetchJson<RoadsSnapResponse>(url.toString());

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          snapped_points: (data.snappedPoints || []).map((p) => ({
            location: p.location,
            original_index: p.originalIndex,
            place_id: p.placeId,
          })),
          warning: data.warningMessage,
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Snap to roads failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Looks up posted speed limits for road segments.
 *
 * @param {LatLng[]} path - Up to 100 points (snap them first for best results).
 * @returns {Promise<ToolResponse>} Speed limits per road segment.
 */
export async function handleSpeedLimits(path: LatLng[]): Promise<ToolResponse> {
  const validationError = validatePath(path);
  if (validationError) {
    return createErrorResponse(validationError);
  }

  const url = new URL("https://roads.googleapis.com/v1/speedLimits");
  url.searchParams.append("path", pathParam(path));
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

  try {
    const data = await fetchJson<SpeedLimitsResponse>(url.toString());

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          speed_limits: (data.speedLimits || []).map((s) => ({
            place_id: s.placeId,
            speed_limit_kph: s.speedLimit,
          })),
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Speed limits lookup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
