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

import { handleGeocode } from "./core/geocoding.js";
import { handleRoutes } from "./core/routing.js";
import { handleWeather } from "./environmental/weather.js";
import { handleStaticMap } from "./visual/static-maps.js";

// ====================================
// Handler Definition Registry
// ====================================

export type HandlerFunction = (...args: any[]) => Promise<any>;

/**
 * Maps tool names to their respective handler functions
 */
export const HANDLER_MAP: Record<string, HandlerFunction> = {
  "maps_geocode": handleGeocode,
  "maps_routes": handleRoutes,
  "maps_weather": handleWeather,
  "maps_static_map": handleStaticMap, 
  // Continue adding all other tool-handler mappings here
};
