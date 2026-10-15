/**
 * routing.ts - Directions/Routes API handlers
 *
 * This file contains handler functions for Google Maps Directions and Routes API.
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/google-maps.js (for DistanceMatrixResponse, DirectionsResponse, RoutesResponse)
 * - ../../utils/api-client.js (for postJson)
 * - ../../utils/error-handling.js (for createErrorResponse)
 *
 * @author Cline
 */

import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { DistanceMatrixResponse, DirectionsResponse, RoutesResponse } from "../../types/google-maps.js";
import { postJson } from "../../utils/api-client.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { ToolResponse } from "../../types/common.js";

// ====================================
// Routing API Handlers
// ====================================

/**
 * Handles the distance matrix request using the Routes API
 * (distanceMatrix/v2:computeRouteMatrix).
 *
 * @param {string[]} origins - Array of origin addresses or coordinates.
 * @param {string[]} destinations - Array of destination addresses or coordinates.
 * @param {"driving" | "walking" | "bicycling" | "transit"} [mode="driving"] - Travel mode.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the distance matrix results or an error.
 */
export async function handleDistanceMatrix(
  origins: string[],
  destinations: string[],
  mode: "driving" | "walking" | "bicycling" | "transit" = "driving"
): Promise<ToolResponse> {
  const url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

  const travelModes: Record<string, string> = {
    driving: "DRIVE",
    walking: "WALK",
    bicycling: "BICYCLE",
    transit: "TRANSIT"
  };

  const requestBody = {
    origins: origins.map((origin) => ({ waypoint: { address: origin } })),
    destinations: destinations.map((destination) => ({ waypoint: { address: destination } })),
    travelMode: travelModes[mode] || "DRIVE"
  };

  try {
    const elements = await postJson<DistanceMatrixResponse>(url, requestBody, {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,status,condition"
    });

    const rows = origins.map((_, originIndex) => ({
      elements: elements
        .filter((element) => element.originIndex === originIndex)
        .sort((a, b) => a.destinationIndex - b.destinationIndex)
        .map((element) => ({
          status: element.status === "OK" ? "OK" : element.status,
          duration: element.duration
            ? { text: element.duration, value: parseInt(element.duration, 10) }
            : undefined,
          distance: element.distanceMeters !== undefined
            ? {
                text: `${(element.distanceMeters / 1609.34).toFixed(1)} mi`,
                value: element.distanceMeters
              }
            : undefined
        }))
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          origin_addresses: origins,
          destination_addresses: destinations,
          results: rows
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Distance matrix request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handles the directions request using the Routes API
 * (directions/v2:computeRoutes).
 *
 * @param {string} origin - Starting point address or coordinates.
 * @param {string} destination - Ending point address or coordinates.
 * @param {"driving" | "walking" | "bicycling" | "transit"} [mode="driving"] - Travel mode.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the directions or an error.
 */
export async function handleDirections(
  origin: string,
  destination: string,
  mode: "driving" | "walking" | "bicycling" | "transit" = "driving"
): Promise<ToolResponse> {
  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

  const travelModes: Record<string, string> = {
    driving: "DRIVE",
    walking: "WALK",
    bicycling: "BICYCLE",
    transit: "TRANSIT"
  };

  const toDistance = (distanceMeters?: number) =>
    distanceMeters !== undefined
      ? { text: `${(distanceMeters / 1609.34).toFixed(1)} mi`, value: distanceMeters }
      : undefined;

  const toDuration = (duration?: string) =>
    duration !== undefined
      ? { text: duration, value: parseInt(duration, 10) }
      : undefined;

  const requestBody = {
    origin: { address: origin },
    destination: { address: destination },
    travelMode: travelModes[mode] || "DRIVE",
    languageCode: "en-US",
    units: "IMPERIAL"
  };

  try {
    const data = await postJson<DirectionsResponse>(url, requestBody, {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "routes.description,routes.distanceMeters,routes.duration,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration"
    });

    if (!data.routes || data.routes.length === 0) {
      return createErrorResponse("No routes found.");
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          routes: data.routes.map((route) => ({
            summary: route.description,
            distance: toDistance(route.distanceMeters),
            duration: toDuration(route.duration),
            steps: (route.legs?.[0]?.steps ?? []).map((step) => ({
              instructions: step.navigationInstruction?.instructions,
              distance: toDistance(step.distanceMeters),
              duration: toDuration(step.staticDuration),
              travel_mode: mode
            }))
          }))
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Directions request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handles the enhanced routes request using the Routes API.
 *
 * @param {{latitude: number; longitude: number}} origin - Starting point coordinates.
 * @param {{latitude: number; longitude: number}} destination - Ending point coordinates.
 * @param {"DRIVE" | "WALK" | "BICYCLE" | "TRANSIT"} [travel_mode="DRIVE"] - Travel mode.
 * @param {"TRAFFIC_UNAWARE" | "TRAFFIC_AWARE" | "TRAFFIC_AWARE_OPTIMAL"} [routing_preference="TRAFFIC_UNAWARE"] - Routing preference.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the route details or an error.
 */
export async function handleRoutes(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  travel_mode: "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT" = "DRIVE",
  routing_preference: "TRAFFIC_UNAWARE" | "TRAFFIC_AWARE" | "TRAFFIC_AWARE_OPTIMAL" = "TRAFFIC_UNAWARE"
): Promise<ToolResponse> {
  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: origin.latitude,
          longitude: origin.longitude
        }
      }
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude
        }
      }
    },
    travelMode: travel_mode,
    routingPreference: routing_preference,
    computeAlternativeRoutes: false,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false
    },
    languageCode: "en-US",
    units: "IMPERIAL"
  };

  try {
    const data = await postJson<RoutesResponse>(url, requestBody, {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction"
    });

    if (!data.routes || data.routes.length === 0) {
      return createErrorResponse("No routes found.");
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          route: data.routes[0] ? {
            distance_meters: data.routes[0].distanceMeters,
            duration: data.routes[0].duration,
            polyline: data.routes[0].polyline.encodedPolyline,
            navigation_steps: data.routes[0].legs[0]?.steps.map(step => ({
              distance_meters: step.distanceMeters,
              duration: step.staticDuration,
              instruction: step.navigationInstruction?.instructions,
              maneuver: step.navigationInstruction?.maneuver
            }))
          } : null
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return createErrorResponse(`Routes request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
