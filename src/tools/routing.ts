/**
 * routing.ts - Google Routes API v2 tools
 *
 * Provides advanced route planning (maps_routes), turn-by-turn directions
 * (maps_directions), and travel time/distance matrices (maps_distance_matrix).
 * All three tools are backed by the Routes API v2 (computeRoutes /
 * computeRouteMatrix) rather than the legacy Directions/Distance Matrix APIs.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ok, err, safe } from "../utils/respond.js";
import { postJson } from "../utils/http.js";
import { getApiKey } from "../config.js";

const COMPUTE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";
const COMPUTE_ROUTE_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

const COORDINATE_RE = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

const TRAVEL_MODE_ENUM = z
  .enum(["driving", "walking", "bicycling", "transit"])
  .default("driving")
  .describe("Travel mode: driving, walking, bicycling, or transit");

const TRAVEL_MODE_MAP: Record<string, string> = {
  driving: "DRIVE",
  walking: "WALK",
  bicycling: "BICYCLE",
  transit: "TRANSIT",
};

// ====================================
// Shared helpers
// ====================================

/** A Routes API Waypoint: either an address string or lat/lng coordinates. */
type RoutesWaypoint =
  | { address: string }
  | { location: { latLng: { latitude: number; longitude: number } } };

/** Build a Routes API Waypoint from a string that is either an address or "lat,lng". */
function buildWaypoint(value: string): RoutesWaypoint {
  const trimmed = value.trim();
  if (COORDINATE_RE.test(trimmed)) {
    const [latStr, lngStr] = trimmed.split(",").map((s) => s.trim());
    return {
      location: {
        latLng: { latitude: Number(latStr), longitude: Number(lngStr) },
      },
    };
  }
  return { address: trimmed };
}

/** Parse a Routes API duration string like "1234s" into seconds. */
function parseDurationSeconds(duration: string | undefined): number | undefined {
  if (!duration) return undefined;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(duration.trim());
  if (!match) return undefined;
  return Number(match[1]);
}

/** Render a duration in seconds as a human-readable string, e.g. "1 hr 5 min". */
function humanizeDuration(seconds: number | undefined): string | undefined {
  if (seconds === undefined || Number.isNaN(seconds)) return undefined;
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

/** Render a duration string ("1234s") as a human-readable string. */
function humanizeDurationString(duration: string | undefined): string | undefined {
  return humanizeDuration(parseDurationSeconds(duration));
}

/** Render distance in meters as { meters, km, miles }. */
function humanizeDistance(meters: number | undefined) {
  if (meters === undefined) return undefined;
  return {
    meters,
    km: Math.round((meters / 1000) * 100) / 100,
    miles: Math.round((meters / 1609.344) * 100) / 100,
  };
}

/** Truncate a polyline string for display, noting truncation. */
function truncatePolyline(encoded: string | undefined): { encoded_polyline: string; truncated: boolean } | undefined {
  if (encoded === undefined) return undefined;
  if (encoded.length <= 200) {
    return { encoded_polyline: encoded, truncated: false };
  }
  return {
    encoded_polyline: encoded.slice(0, 200) + "... [truncated, full polyline omitted]",
    truncated: true,
  };
}

/** Turn an HTTP error (thrown by postJson) into an actionable message. */
function explainRoutesError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("403") ||
    message.includes("PERMISSION_DENIED") ||
    message.includes("PERMISSION DENIED")
  ) {
    return (
      `${message}. This usually means the "Routes API" is not enabled for this project. ` +
      `Enable it at https://console.cloud.google.com/apis/library/routes.googleapis.com`
    );
  }
  return message;
}

// ====================================
// Response type shapes (partial - only fields we request via field mask)
// ====================================

interface RoutesApiStep {
  distanceMeters?: number;
  staticDuration?: string;
  navigationInstruction?: { instructions?: string; maneuver?: string };
}

interface RoutesApiLeg {
  duration?: string;
  distanceMeters?: number;
  steps?: RoutesApiStep[];
}

interface RoutesApiRoute {
  duration?: string;
  staticDuration?: string;
  distanceMeters?: number;
  description?: string;
  warnings?: string[];
  legs?: RoutesApiLeg[];
  polyline?: { encodedPolyline?: string };
}

interface ComputeRoutesResponse {
  routes?: RoutesApiRoute[];
}

interface RouteMatrixElement {
  originIndex?: number;
  destinationIndex?: number;
  duration?: string;
  distanceMeters?: number;
  status?: { code?: number; message?: string } | Record<string, never>;
  condition?: string;
}

// ====================================
// maps_routes - advanced route planning
// ====================================

const routesInputSchema = {
  origin: z.string().describe('Origin address (e.g. "Yosemite Valley, CA") or "lat,lng" coordinates'),
  destination: z.string().describe('Destination address or "lat,lng" coordinates'),
  intermediates: z
    .array(z.string())
    .max(8)
    .optional()
    .describe("Optional list of up to 8 intermediate waypoints (addresses or \"lat,lng\")"),
  travel_mode: TRAVEL_MODE_ENUM,
  routing_preference: z
    .enum(["traffic_unaware", "traffic_aware", "traffic_aware_optimal"])
    .default("traffic_aware")
    .describe(
      "Routing preference (only applies to driving; ignored for other travel modes): " +
        "traffic_unaware, traffic_aware, or traffic_aware_optimal"
    ),
  compute_alternative_routes: z
    .boolean()
    .default(false)
    .describe("Whether to return alternative routes in addition to the best one"),
  avoid_tolls: z.boolean().default(false).describe("Avoid toll roads"),
  avoid_highways: z.boolean().default(false).describe("Avoid highways"),
  avoid_ferries: z.boolean().default(false).describe("Avoid ferries"),
};

type RoutesArgs = {
  origin: string;
  destination: string;
  intermediates?: string[];
  travel_mode: "driving" | "walking" | "bicycling" | "transit";
  routing_preference: "traffic_unaware" | "traffic_aware" | "traffic_aware_optimal";
  compute_alternative_routes: boolean;
  avoid_tolls: boolean;
  avoid_highways: boolean;
  avoid_ferries: boolean;
};

export async function handleRoutes(args: RoutesArgs): Promise<CallToolResult> {
  const apiKey = getApiKey();
  const travelMode = TRAVEL_MODE_MAP[args.travel_mode];

  const body: Record<string, unknown> = {
    origin: buildWaypoint(args.origin),
    destination: buildWaypoint(args.destination),
    travelMode,
    computeAlternativeRoutes: args.compute_alternative_routes,
    routeModifiers: {
      avoidTolls: args.avoid_tolls,
      avoidHighways: args.avoid_highways,
      avoidFerries: args.avoid_ferries,
    },
    languageCode: "en-US",
    units: "IMPERIAL",
  };

  if (args.intermediates && args.intermediates.length > 0) {
    body.intermediates = args.intermediates.map(buildWaypoint);
  }

  // routingPreference is only valid for DRIVE; omit it otherwise.
  if (travelMode === "DRIVE") {
    body.routingPreference = args.routing_preference.toUpperCase();
  }

  let data: ComputeRoutesResponse;
  try {
    data = await postJson<ComputeRoutesResponse>(COMPUTE_ROUTES_URL, body, {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "routes.duration,routes.staticDuration,routes.distanceMeters,routes.description,routes.warnings,routes.legs.duration,routes.legs.distanceMeters,routes.polyline.encodedPolyline",
    });
  } catch (error) {
    return err(`Routes request failed: ${explainRoutesError(error)}`);
  }

  if (!data.routes || data.routes.length === 0) {
    return err("No routes found between the given origin and destination.");
  }

  const routes = data.routes.map((route) => ({
    summary: route.description,
    distance: humanizeDistance(route.distanceMeters),
    duration: humanizeDurationString(route.duration),
    static_duration: humanizeDurationString(route.staticDuration),
    warnings: route.warnings ?? [],
    legs: (route.legs ?? []).map((leg) => ({
      distance: humanizeDistance(leg.distanceMeters),
      duration: humanizeDurationString(leg.duration),
    })),
    polyline: truncatePolyline(route.polyline?.encodedPolyline),
  }));

  return ok({ route_count: routes.length, routes });
}

// ====================================
// maps_directions - turn-by-turn directions
// ====================================

const directionsInputSchema = {
  origin: z.string().describe('Starting point address (e.g. "Yosemite Valley, CA") or "lat,lng" coordinates'),
  destination: z.string().describe('Ending point address or "lat,lng" coordinates'),
  mode: TRAVEL_MODE_ENUM,
};

type DirectionsArgs = {
  origin: string;
  destination: string;
  mode: "driving" | "walking" | "bicycling" | "transit";
};

export async function handleDirections(args: DirectionsArgs): Promise<CallToolResult> {
  const apiKey = getApiKey();
  const travelMode = TRAVEL_MODE_MAP[args.mode];

  const body: Record<string, unknown> = {
    origin: buildWaypoint(args.origin),
    destination: buildWaypoint(args.destination),
    travelMode,
    languageCode: "en-US",
    units: "IMPERIAL",
  };

  if (travelMode === "DRIVE") {
    body.routingPreference = "TRAFFIC_AWARE";
  }

  let data: ComputeRoutesResponse;
  try {
    data = await postJson<ComputeRoutesResponse>(COMPUTE_ROUTES_URL, body, {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "routes.duration,routes.staticDuration,routes.distanceMeters,routes.description,routes.warnings,routes.legs.duration,routes.legs.distanceMeters,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration",
    });
  } catch (error) {
    return err(`Directions request failed: ${explainRoutesError(error)}`);
  }

  if (!data.routes || data.routes.length === 0) {
    return err("No directions found between the given origin and destination.");
  }

  const route = data.routes[0];
  const steps = (route.legs ?? [])
    .flatMap((leg) => leg.steps ?? [])
    .slice(0, 100)
    .map((step) => ({
      instruction: step.navigationInstruction?.instructions,
      distance: humanizeDistance(step.distanceMeters),
      duration: humanizeDurationString(step.staticDuration),
    }));

  return ok({
    summary: route.description,
    distance: humanizeDistance(route.distanceMeters),
    duration: humanizeDurationString(route.duration),
    step_count: steps.length,
    steps,
  });
}

// ====================================
// maps_distance_matrix - travel time/distance between multiple points
// ====================================

const distanceMatrixInputSchema = {
  origins: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe('Origin addresses or "lat,lng" coordinates (1-10)'),
  destinations: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe('Destination addresses or "lat,lng" coordinates (1-10)'),
  mode: TRAVEL_MODE_ENUM,
};

type DistanceMatrixArgs = {
  origins: string[];
  destinations: string[];
  mode: "driving" | "walking" | "bicycling" | "transit";
};

export async function handleDistanceMatrix(args: DistanceMatrixArgs): Promise<CallToolResult> {
  const apiKey = getApiKey();
  const travelMode = TRAVEL_MODE_MAP[args.mode];

  const body: Record<string, unknown> = {
    origins: args.origins.map((o) => ({ waypoint: buildWaypoint(o) })),
    destinations: args.destinations.map((d) => ({ waypoint: buildWaypoint(d) })),
    travelMode,
    languageCode: "en-US",
    units: "IMPERIAL",
  };

  if (travelMode === "DRIVE") {
    body.routingPreference = "TRAFFIC_AWARE";
  }

  let data: RouteMatrixElement[];
  try {
    data = await postJson<RouteMatrixElement[]>(COMPUTE_ROUTE_MATRIX_URL, body, {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,status,condition",
    });
  } catch (error) {
    return err(`Distance matrix request failed: ${explainRoutesError(error)}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    return err("No distance matrix results returned.");
  }

  const matrix: Record<number, Array<{
    destination_index: number;
    distance: ReturnType<typeof humanizeDistance>;
    duration: string | undefined;
    condition: string | undefined;
  }>> = {};

  for (const element of data) {
    const originIndex = element.originIndex ?? 0;
    if (!matrix[originIndex]) matrix[originIndex] = [];
    matrix[originIndex].push({
      destination_index: element.destinationIndex ?? 0,
      distance: humanizeDistance(element.distanceMeters),
      duration: humanizeDurationString(element.duration),
      condition: element.condition,
    });
  }

  // Sort each origin's destinations by index for readability.
  for (const originIndex of Object.keys(matrix)) {
    matrix[Number(originIndex)].sort((a, b) => a.destination_index - b.destination_index);
  }

  const results = Object.keys(matrix)
    .map(Number)
    .sort((a, b) => a - b)
    .map((originIndex) => ({
      origin_index: originIndex,
      origin: args.origins[originIndex],
      destinations: matrix[originIndex],
    }));

  return ok({
    origins: args.origins,
    destinations: args.destinations,
    results,
  });
}

// ====================================
// Registration
// ====================================

export function registerRoutingTools(server: McpServer): void {
  server.registerTool(
    "maps_routes",
    {
      title: "Compute Route",
      description:
        "Advanced route planning between an origin and destination using the Google Routes API v2. " +
        "Supports intermediate waypoints, alternative routes, and avoidance of tolls/highways/ferries. " +
        "Origin, destination, and intermediates may each be given as an address or as \"lat,lng\" coordinates.\n\n" +
        "Args:\n" +
        "  origin: Origin address or \"lat,lng\".\n" +
        "  destination: Destination address or \"lat,lng\".\n" +
        "  intermediates: Optional list of up to 8 waypoints (addresses or \"lat,lng\").\n" +
        "  travel_mode: driving | walking | bicycling | transit (default driving).\n" +
        "  routing_preference: traffic_unaware | traffic_aware | traffic_aware_optimal " +
        "(only applies when travel_mode is driving; default traffic_aware).\n" +
        "  compute_alternative_routes: Return alternative routes in addition to the best one (default false).\n" +
        "  avoid_tolls / avoid_highways / avoid_ferries: Route avoidance flags (default false).\n\n" +
        "Returns:\n" +
        "  route_count and a routes array of { summary, distance: {meters,km,miles}, duration, " +
        "static_duration, warnings, legs, polyline (truncated to 200 chars) }.",
      inputSchema: routesInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleRoutes)
  );

  server.registerTool(
    "maps_directions",
    {
      title: "Get Directions",
      description:
        "Turn-by-turn directions between two points. Now backed by the Google Routes API v2 " +
        "(computeRoutes) rather than the legacy Directions API. Origin and destination may be " +
        "given as an address or as \"lat,lng\" coordinates.\n\n" +
        "Args:\n" +
        "  origin: Starting point address or \"lat,lng\".\n" +
        "  destination: Ending point address or \"lat,lng\".\n" +
        "  mode: driving | walking | bicycling | transit (default driving).\n\n" +
        "Returns:\n" +
        "  summary, distance: {meters,km,miles}, duration, step_count, and a steps array " +
        "(capped at 100) of { instruction, distance, duration }.",
      inputSchema: directionsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleDirections)
  );

  server.registerTool(
    "maps_distance_matrix",
    {
      title: "Distance Matrix",
      description:
        "Travel time and distance between multiple origins and destinations. Now backed by the " +
        "Google Routes API v2 (computeRouteMatrix) rather than the legacy Distance Matrix API. " +
        "Origins and destinations may each be given as an address or as \"lat,lng\" coordinates.\n\n" +
        "Args:\n" +
        "  origins: 1-10 origin addresses or \"lat,lng\" coordinates.\n" +
        "  destinations: 1-10 destination addresses or \"lat,lng\" coordinates.\n" +
        "  mode: driving | walking | bicycling | transit (default driving).\n\n" +
        "Returns:\n" +
        "  origins, destinations (echoed for reference), and results: for each origin index, " +
        "origin and a destinations array of { destination_index, distance: {meters,km,miles}, " +
        "duration, condition }.",
      inputSchema: distanceMatrixInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleDistanceMatrix)
  );
}
