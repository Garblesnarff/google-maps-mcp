/**
 * handler-registry.ts - Route request tools to their handlers
 *
 * This file registers handler functions for each registered tool,
 * enabling dynamic request routing based on the tool's name.
 *
 * Dependencies:
 * - Imported handler functions from core, environmental, and visual
 *
 * @author Cline
 */

import { handleGeocode, handleReverseGeocode } from "./core/geocoding.js";
import { handlePlaceSearch, handlePlaceDetails } from "./core/places.js";
import { handleDistanceMatrix, handleDirections, handleRoutes } from "./core/routing.js";
import { handleElevation } from "./core/elevation.js";
import { handleWeather } from "./environmental/weather.js";
import { handleAirQuality } from "./environmental/air-quality.js";
import { handleSolar } from "./environmental/solar.js";
import { handlePollen } from "./environmental/pollen.js";
import { handleStreetView } from "./visual/street-view.js";
import { handleStaticMap } from "./visual/static-maps.js";

// ====================================
// Handler Definition Registry
// ====================================

export type HandlerFunction = (...args: any[]) => Promise<any>;

/**
 * Maps tool names to their respective handler functions
 */
export const HANDLER_MAP: Record<string, HandlerFunction> = {
  // Core Google Maps tools
  "maps_geocode": handleGeocode,
  "maps_reverse_geocode": handleReverseGeocode,
  "maps_search_places": handlePlaceSearch,
  "maps_place_details": handlePlaceDetails,
  "maps_distance_matrix": handleDistanceMatrix,
  "maps_directions": handleDirections,
  "maps_routes": handleRoutes,
  "maps_elevation": handleElevation,
  // Environmental data tools
  "maps_weather": handleWeather,
  "maps_air_quality": handleAirQuality,
  "maps_solar": handleSolar,
  "maps_pollen": handlePollen,
  // Visual tools
  "maps_street_view": handleStreetView,
  "maps_static_map": handleStaticMap,
};
