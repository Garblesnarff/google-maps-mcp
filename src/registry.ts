/**
 * registry.ts - name -> handler map for the REST layer.
 *
 * NOTE: These handlers are called directly by the REST layer (src/http-server.ts),
 * bypassing the zod input validation that normally happens inside
 * `server.registerTool(...)` in each tools/*.ts module (see registerTool calls,
 * where zod schemas validate args before a handler ever runs). Handlers must
 * therefore be defensive about malformed/missing args when invoked this way —
 * they're still expected to fail gracefully (thrown errors are caught by the
 * REST layer and turned into a 500 response) rather than crash the process.
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { handleGeocode, handleReverseGeocode } from "./tools/geocoding.js";
import { handleElevation } from "./tools/elevation.js";
import { handleSearchPlaces, handlePlaceDetails } from "./tools/places.js";
import {
  handleRoutes,
  handleDirections,
  handleDistanceMatrix,
} from "./tools/routing.js";
import {
  handleWeather,
  handleAirQuality,
  handleSolar,
  handlePollen,
} from "./tools/environmental.js";
import { handleStaticMap, handleStreetView } from "./tools/visual.js";
import {
  handleGardenClimate,
  handleFrostDates,
  handleGrowingDegreeDays,
  handleSoilConditions,
  handleDayLength,
} from "./tools/garden.js";

export const HANDLERS: Record<string, (args: any) => Promise<CallToolResult>> = {
  maps_geocode: handleGeocode,
  maps_reverse_geocode: handleReverseGeocode,
  maps_elevation: handleElevation,
  maps_search_places: handleSearchPlaces,
  maps_place_details: handlePlaceDetails,
  maps_routes: handleRoutes,
  maps_directions: handleDirections,
  maps_distance_matrix: handleDistanceMatrix,
  maps_weather: handleWeather,
  maps_air_quality: handleAirQuality,
  maps_solar: handleSolar,
  maps_pollen: handlePollen,
  maps_static_map: handleStaticMap,
  maps_street_view: handleStreetView,
  maps_garden_climate: handleGardenClimate,
  maps_frost_dates: handleFrostDates,
  maps_growing_degree_days: handleGrowingDegreeDays,
  maps_soil_conditions: handleSoilConditions,
  maps_day_length: handleDayLength,
};
