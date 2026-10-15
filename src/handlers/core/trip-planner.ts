/**
 * trip-planner.ts - Composite trip planning handler
 *
 * Fans out to the directions, place search, geocoding, and weather
 * handlers internally and assembles a single trip plan. This is a
 * composite tool: one call, one coherent answer.
 *
 * Dependencies:
 * - ./routing.js (for handleDirections)
 * - ./places.js (for handlePlaceSearch)
 * - ./geocoding.js (for handleGeocode)
 * - ../environmental/weather.js (for handleWeather)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../types/common.js (for ToolResponse)
 *
 * @author Wonky
 */

import { handleDirections } from "./routing.js";
import { handlePlaceSearch } from "./places.js";
import { handleGeocode } from "./geocoding.js";
import { handleWeather } from "../environmental/weather.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Trip Planner (composite tool)
// ====================================

type TravelMode = "driving" | "walking" | "bicycling" | "transit";

const VALID_MODES: TravelMode[] = ["driving", "walking", "bicycling", "transit"];

/**
 * Extracts parsed JSON from a sub-handler's text response.
 * Returns null when the sub-call errored or didn't return JSON.
 */
function parseSubResponse(res: ToolResponse): any | null {
  if (res.isError || res.content.length === 0) {
    return null;
  }
  const block = res.content[0];
  if (block.type !== "text") {
    return null;
  }
  try {
    return JSON.parse(block.text);
  } catch {
    return null;
  }
}

/**
 * Plans a trip: route + interesting stops + destination weather, in one call.
 *
 * @param {string} origin - Starting point address or coordinates.
 * @param {string} destination - Ending point address or coordinates.
 * @param {TravelMode} [mode="driving"] - Travel mode.
 * @param {string[]} [stops] - Optional place queries to look up (top result each).
 * @param {boolean} [include_weather=true] - Whether to include destination weather.
 * @returns {Promise<ToolResponse>} A ToolResponse with the assembled trip plan.
 */
export async function handlePlanTrip(
  origin: string,
  destination: string,
  mode: TravelMode = "driving",
  stops?: string[],
  include_weather: boolean = true
): Promise<ToolResponse> {
  if (!origin || origin.trim() === "") {
    return createErrorResponse("Origin is required and cannot be empty");
  }
  if (!destination || destination.trim() === "") {
    return createErrorResponse("Destination is required and cannot be empty");
  }
  if (!VALID_MODES.includes(mode)) {
    return createErrorResponse(`Mode must be one of: ${VALID_MODES.join(", ")}`);
  }

  // 1. Route (required — without it there is no trip).
  const directionsRes = await handleDirections(origin, destination, mode);
  if (directionsRes.isError) {
    return directionsRes;
  }
  const directions = parseSubResponse(directionsRes);
  const firstRoute = directions?.routes?.[0];
  if (!firstRoute) {
    return createErrorResponse("Could not compute a route for this trip");
  }

  const route = {
    summary: firstRoute.summary,
    distance: firstRoute.distance,
    duration: firstRoute.duration,
    step_count: Array.isArray(firstRoute.steps) ? firstRoute.steps.length : 0,
    first_steps: Array.isArray(firstRoute.steps)
      ? firstRoute.steps.slice(0, 5).map((s: any) => s.instructions).filter(Boolean)
      : [],
  };

  // 2. Stops (best effort — a failed lookup becomes a note, not a failure).
  const plannedStops: Array<Record<string, unknown>> = [];
  for (const query of stops ?? []) {
    if (!query || query.trim() === "") {
      continue;
    }
    const searchRes = await handlePlaceSearch(query);
    const search = parseSubResponse(searchRes);
    const top = search?.places?.[0];
    if (top) {
      plannedStops.push({
        query,
        name: top.name,
        formatted_address: top.formatted_address,
        rating: top.rating,
        place_id: top.place_id,
      });
    } else {
      plannedStops.push({ query, note: "No matching place found" });
    }
  }

  // 3. Destination weather (best effort — needs a geocode first).
  let weather: Record<string, unknown> | null = null;
  if (include_weather) {
    const geoRes = await handleGeocode(destination);
    const geo = parseSubResponse(geoRes);
    const loc = geo?.location;
    if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
      const weatherRes = await handleWeather(loc.lat, loc.lng, 3, false);
      const w = parseSubResponse(weatherRes);
      if (w) {
        weather = { current: w.current, daily: w.daily };
      } else {
        weather = { note: "Weather unavailable for destination" };
      }
    } else {
      weather = { note: "Could not geocode destination for weather lookup" };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            origin,
            destination,
            mode,
            route,
            stops: plannedStops,
            destination_weather: weather,
          },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}
