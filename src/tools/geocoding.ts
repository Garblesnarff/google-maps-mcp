/**
 * geocoding.ts - Google Geocoding API tools
 *
 * Provides forward geocoding (address -> coordinates) and reverse
 * geocoding (coordinates -> address) via the Google Maps Geocoding API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ok, err, safe } from "../utils/respond.js";
import { getJson, sanitizeUrl } from "../utils/http.js";
import { getApiKey } from "../config.js";

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

interface GeocodeApiResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  place_id: string;
  types: string[];
}

interface GeocodeApiResponse {
  status: string;
  error_message?: string;
  results: GeocodeApiResult[];
}

function trimResults(results: GeocodeApiResult[]) {
  return results.map((r) => ({
    formatted_address: r.formatted_address,
    location: r.geometry.location,
    place_id: r.place_id,
    types: r.types,
  }));
}

export async function handleGeocode(args: {
  address: string;
}): Promise<CallToolResult> {
  const apiKey = getApiKey();
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("address", args.address);
  url.searchParams.set("key", apiKey);

  const data = await getJson<GeocodeApiResponse>(url.toString());

  if (data.status !== "OK") {
    return err(
      `Geocoding failed (${data.status}): ${
        data.error_message ?? "no results for this address"
      }. Request: ${sanitizeUrl(url.toString())}`
    );
  }

  return ok({
    result_count: data.results.length,
    results: trimResults(data.results),
  });
}

export async function handleReverseGeocode(args: {
  latitude: number;
  longitude: number;
}): Promise<CallToolResult> {
  const apiKey = getApiKey();
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("latlng", `${args.latitude},${args.longitude}`);
  url.searchParams.set("key", apiKey);

  const data = await getJson<GeocodeApiResponse>(url.toString());

  if (data.status !== "OK") {
    return err(
      `Reverse geocoding failed (${data.status}): ${
        data.error_message ?? "no results for these coordinates"
      }. Request: ${sanitizeUrl(url.toString())}`
    );
  }

  return ok({
    result_count: data.results.length,
    results: trimResults(data.results),
  });
}

export function registerGeocodingTools(server: McpServer): void {
  server.registerTool(
    "maps_geocode",
    {
      title: "Geocode Address",
      description:
        "Convert a free-form address into geographic coordinates using the Google Geocoding API. " +
        "Returns every candidate match (not just the first), since ambiguous addresses can resolve " +
        "to multiple places.\n\n" +
        "Args:\n" +
        "  address: The address or place description to geocode.\n\n" +
        "Returns:\n" +
        "  result_count and a results array of { formatted_address, location: {lat,lng}, place_id, types }.",
      inputSchema: {
        address: z.string().describe("The address to geocode"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleGeocode)
  );

  server.registerTool(
    "maps_reverse_geocode",
    {
      title: "Reverse Geocode Coordinates",
      description:
        "Convert geographic coordinates into a human-readable address using the Google Geocoding API. " +
        "Returns every candidate match, from the most specific (e.g. a street address) to broader " +
        "containing regions.\n\n" +
        "Args:\n" +
        "  latitude: Latitude coordinate (-90 to 90).\n" +
        "  longitude: Longitude coordinate (-180 to 180).\n\n" +
        "Returns:\n" +
        "  result_count and a results array of { formatted_address, location: {lat,lng}, place_id, types }.",
      inputSchema: {
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Latitude coordinate"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Longitude coordinate"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleReverseGeocode)
  );
}
