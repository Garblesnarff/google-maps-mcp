/**
 * places.ts - Places API (New) v1 tools
 *
 * Implements maps_search_places (Text Search) and maps_place_details
 * (Place Details) against the Places API (New) v1 endpoints. This is a
 * distinct Google Cloud API/toggle from the legacy Places API used by
 * maps.googleapis.com/maps/api/place/*.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ok, err, safe } from "../utils/respond.js";
import { getJson, postJson } from "../utils/http.js";
import { getApiKey } from "../config.js";

const PLACES_BASE_URL = "https://places.googleapis.com/v1/places";

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.types",
  "places.businessStatus",
  "places.currentOpeningHours.openNow",
  "places.websiteUri",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "types",
  "businessStatus",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "googleMapsUri",
  "regularOpeningHours",
  "editorialSummary",
  "accessibilityOptions",
  "evChargeOptions",
  "fuelOptions",
  "goodForChildren",
  "allowsDogs",
  "reviews",
].join(",");

/** Wraps API errors with an actionable note about enabling Places API (New). */
function explainError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("PERMISSION_DENIED")) {
    return (
      `${message} — Make sure "Places API (New)" is enabled in Google Cloud Console ` +
      `(it is a separate toggle from the legacy Places API) and that your API key is allowed to use it.`
    );
  }
  return message;
}

interface PlaceLocation {
  latitude: number;
  longitude: number;
}

interface DisplayName {
  text?: string;
  languageCode?: string;
}

interface PlaceSearchResult {
  id?: string;
  displayName?: DisplayName;
  formattedAddress?: string;
  location?: PlaceLocation;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  types?: string[];
  businessStatus?: string;
  currentOpeningHours?: { openNow?: boolean };
  websiteUri?: string;
}

interface SearchTextResponse {
  places?: PlaceSearchResult[];
  error?: { code?: number; message?: string; status?: string };
}

interface Review {
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
}

interface PlaceDetailsResult {
  id?: string;
  displayName?: DisplayName;
  formattedAddress?: string;
  location?: PlaceLocation;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  types?: string[];
  businessStatus?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  editorialSummary?: { text?: string };
  accessibilityOptions?: Record<string, unknown>;
  evChargeOptions?: Record<string, unknown>;
  fuelOptions?: Record<string, unknown>;
  goodForChildren?: boolean;
  allowsDogs?: boolean;
  reviews?: Review[];
  error?: { code?: number; message?: string; status?: string };
}

export async function handleSearchPlaces(args: {
  query: string;
  location?: { latitude: number; longitude: number };
  radius?: number;
  max_results?: number;
}): Promise<CallToolResult> {
  const { query, location, radius, max_results = 10 } = args;

  const body: Record<string, unknown> = {
    textQuery: query,
    pageSize: max_results,
  };
  if (location && radius) {
    body.locationBias = {
      circle: {
        center: { latitude: location.latitude, longitude: location.longitude },
        radius,
      },
    };
  }

  let data: SearchTextResponse;
  try {
    data = await postJson<SearchTextResponse>(
      `${PLACES_BASE_URL}:searchText`,
      body,
      {
        "X-Goog-Api-Key": getApiKey(),
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      }
    );
  } catch (error) {
    return err(explainError(error));
  }

  const places = data.places ?? [];
  const results = places.map((place) => ({
    place_id: place.id,
    name: place.displayName?.text,
    address: place.formattedAddress,
    location: place.location,
    rating: place.rating,
    user_rating_count: place.userRatingCount,
    price_level: place.priceLevel,
    types: place.types?.slice(0, 5),
    open_now: place.currentOpeningHours?.openNow,
    website: place.websiteUri,
  }));

  return ok({ result_count: results.length, results });
}

export async function handlePlaceDetails(args: {
  place_id: string;
}): Promise<CallToolResult> {
  const { place_id } = args;

  let data: PlaceDetailsResult;
  try {
    data = await getJson<PlaceDetailsResult>(
      `${PLACES_BASE_URL}/${encodeURIComponent(place_id)}`,
      {
        "X-Goog-Api-Key": getApiKey(),
        "X-Goog-FieldMask": DETAILS_FIELD_MASK,
      }
    );
  } catch (error) {
    return err(explainError(error));
  }

  const reviews = (data.reviews ?? []).slice(0, 3).map((review) => ({
    rating: review.rating,
    text: review.text?.text?.slice(0, 300),
    relative_time: review.relativePublishTimeDescription,
  }));

  const details: Record<string, unknown> = {
    place_id: data.id,
    name: data.displayName?.text,
    address: data.formattedAddress,
    location: data.location,
    rating: data.rating,
    user_rating_count: data.userRatingCount,
    price_level: data.priceLevel,
    types: data.types,
    business_status: data.businessStatus,
    phone_number: data.nationalPhoneNumber,
    international_phone_number: data.internationalPhoneNumber,
    website: data.websiteUri,
    google_maps_uri: data.googleMapsUri,
    opening_hours: data.regularOpeningHours?.weekdayDescriptions,
    summary: data.editorialSummary?.text,
    good_for_children: data.goodForChildren,
    allows_dogs: data.allowsDogs,
    reviews: reviews.length > 0 ? reviews : undefined,
  };

  if (data.accessibilityOptions) {
    details.accessibility_options = data.accessibilityOptions;
  }
  if (data.evChargeOptions) {
    details.ev_charge_options = data.evChargeOptions;
  }
  if (data.fuelOptions) {
    details.fuel_options = data.fuelOptions;
  }

  return ok(details);
}

export function registerPlacesTools(server: McpServer): void {
  server.registerTool(
    "maps_search_places",
    {
      title: "Search Places",
      description:
        "Search for places (businesses, landmarks, addresses) using Google Places API (New) Text Search. " +
        "Optionally bias results toward a location and radius.\n" +
        "Args:\n" +
        "  query (string): Free-text search query, e.g. 'coffee shops in Seattle'.\n" +
        "  location (object, optional): { latitude, longitude } center point to bias results toward.\n" +
        "  radius (number, optional): Bias radius in meters (max 50000). Used together with location.\n" +
        "  max_results (integer, optional): Number of results to return, 1-20 (default 10).\n" +
        "Returns:\n" +
        "  JSON with result_count and an array of results, each with place_id, name, address, location, " +
        "rating, user_rating_count, price_level, types (top 5), open_now, and website.",
      inputSchema: {
        query: z.string().describe("Search query, e.g. 'coffee shops in Seattle'"),
        location: z
          .object({
            latitude: z.number().describe("Latitude of the bias center point"),
            longitude: z.number().describe("Longitude of the bias center point"),
          })
          .optional()
          .describe("Optional center point to bias search results toward"),
        radius: z
          .number()
          .max(50000)
          .optional()
          .describe("Bias radius in meters (max 50000), used with location"),
        max_results: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(10)
          .describe("Number of results to return, 1-20 (default 10)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleSearchPlaces)
  );

  server.registerTool(
    "maps_place_details",
    {
      title: "Place Details",
      description:
        "Get detailed information about a specific place using Google Places API (New) Place Details, " +
        "including contact info, opening hours, ratings, and up to 3 recent reviews.\n" +
        "Args:\n" +
        "  place_id (string): The place ID to look up (from maps_search_places or maps_geocode).\n" +
        "Returns:\n" +
        "  JSON object with name, address, location, rating, contact and website info, opening_hours, " +
        "summary, and up to 3 trimmed reviews. Accessibility, EV charging, and fuel option fields are " +
        "included only when present for the place.",
      inputSchema: {
        place_id: z.string().describe("The place ID to get details for"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handlePlaceDetails)
  );
}
