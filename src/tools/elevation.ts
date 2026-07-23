/**
 * elevation.ts - Google Elevation API tools
 *
 * Supports two modes:
 *  - point elevations for an arbitrary set of locations
 *  - an elevation profile sampled along a path (useful for hike/route planning)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ok, err, safe } from "../utils/respond.js";
import { getJson, sanitizeUrl } from "../utils/http.js";
import { getApiKey } from "../config.js";

const ELEVATION_URL = "https://maps.googleapis.com/maps/api/elevation/json";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface ElevationApiResult {
  elevation: number;
  location: { lat: number; lng: number };
  resolution: number;
}

interface ElevationApiResponse {
  status: string;
  error_message?: string;
  results: ElevationApiResult[];
}

function toLocationString(points: LatLng[]): string {
  return points.map((p) => `${p.latitude},${p.longitude}`).join("|");
}

function trimResults(results: ElevationApiResult[]) {
  return results.map((r) => ({
    elevation: Math.round(r.elevation * 10) / 10,
    location: r.location,
  }));
}

export interface ElevationArgs {
  locations?: LatLng[];
  path?: LatLng[];
  samples?: number;
}

export async function handleElevation(
  args: ElevationArgs
): Promise<CallToolResult> {
  const { locations, path, samples } = args;

  const hasLocations = Array.isArray(locations) && locations.length > 0;
  const hasPath = Array.isArray(path) && path.length > 0;

  if (hasLocations && hasPath) {
    return err(
      "Provide either 'locations' (point elevations) or 'path' (elevation profile), not both."
    );
  }
  if (!hasLocations && !hasPath) {
    return err(
      "Provide either 'locations' (an array of {latitude,longitude} points) or " +
        "'path' (an array of {latitude,longitude} route points) plus 'samples'."
    );
  }
  if (hasPath && samples === undefined) {
    return err(
      "'samples' (an integer 2-512) is required when using 'path' mode, to specify how many " +
        "equidistant points along the path to sample."
    );
  }
  if (hasLocations && samples !== undefined) {
    return err(
      "'samples' is only used with 'path' mode. Remove it when using 'locations'."
    );
  }

  const apiKey = getApiKey();
  const url = new URL(ELEVATION_URL);

  if (hasPath) {
    url.searchParams.set("path", toLocationString(path!));
    url.searchParams.set("samples", String(samples));
  } else {
    url.searchParams.set("locations", toLocationString(locations!));
  }
  url.searchParams.set("key", apiKey);

  const data = await getJson<ElevationApiResponse>(url.toString());

  if (data.status !== "OK") {
    return err(
      `Elevation request failed (${data.status}): ${
        data.error_message ?? "unable to retrieve elevation data"
      }. Request: ${sanitizeUrl(url.toString())}`
    );
  }

  const results = trimResults(data.results);

  if (!hasPath) {
    return ok({ result_count: results.length, results });
  }

  // Path/profile mode: compute ascent/descent/min/max summary.
  const elevations = results.map((r) => r.elevation);
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - elevations[i - 1];
    if (delta > 0) gain += delta;
    else loss += -delta;
  }

  return ok({
    result_count: results.length,
    profile: results,
    summary: {
      min_elevation: Math.round(Math.min(...elevations) * 10) / 10,
      max_elevation: Math.round(Math.max(...elevations) * 10) / 10,
      total_ascent: Math.round(gain * 10) / 10,
      total_descent: Math.round(loss * 10) / 10,
    },
  });
}

export function registerElevationTools(server: McpServer): void {
  server.registerTool(
    "maps_elevation",
    {
      title: "Get Elevation Data",
      description:
        "Get elevation data from the Google Elevation API. Supports two mutually exclusive modes: " +
        "point elevations for a list of locations, or an elevation profile sampled at evenly spaced " +
        "points along a path (useful for hike/route planning, computing total ascent/descent).\n\n" +
        "Args:\n" +
        "  locations: Array of {latitude, longitude} points to get elevation for (point mode).\n" +
        "  path: Array of {latitude, longitude} points defining a route to sample along (profile mode).\n" +
        "  samples: Integer 2-512, number of equidistant points to sample along 'path'. Required with 'path'.\n" +
        "  Exactly one of 'locations' or 'path' must be provided.\n\n" +
        "Returns:\n" +
        "  Point mode: result_count and results [{elevation, location}].\n" +
        "  Path mode: result_count, profile [{elevation, location}], and summary " +
        "{min_elevation, max_elevation, total_ascent, total_descent}.",
      inputSchema: {
        locations: z
          .array(
            z.object({
              latitude: z.number().min(-90).max(90),
              longitude: z.number().min(-180).max(180),
            })
          )
          .optional()
          .describe(
            "Array of locations to get point elevations for (use instead of 'path')"
          ),
        path: z
          .array(
            z.object({
              latitude: z.number().min(-90).max(90),
              longitude: z.number().min(-180).max(180),
            })
          )
          .optional()
          .describe(
            "Array of points defining a route to sample an elevation profile along (use instead of 'locations'; requires 'samples')"
          ),
        samples: z
          .number()
          .int()
          .min(2)
          .max(512)
          .optional()
          .describe(
            "Number of equidistant sample points along 'path' (2-512). Required when 'path' is used."
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleElevation)
  );
}
