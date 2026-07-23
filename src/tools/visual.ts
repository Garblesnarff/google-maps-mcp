/**
 * visual.ts - Google Maps Static API + Street View Static API tools
 *
 * Fetches map/street-view images as bytes and returns them inline as MCP
 * image content (instead of returning a bare URL, as the legacy server did).
 * Optionally also saves a copy to disk when GOOGLE_MAPS_IMAGE_DIR is set.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { err, image, safe } from "../utils/respond.js";
import { getJson, getBytes, sanitizeUrl } from "../utils/http.js";
import { getApiKey, getImageDir } from "../config.js";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const STATIC_MAP_URL = "https://maps.googleapis.com/maps/api/staticmap";
const STREET_VIEW_URL = "https://maps.googleapis.com/maps/api/streetview";
const STREET_VIEW_METADATA_URL =
  "https://maps.googleapis.com/maps/api/streetview/metadata";

const MAX_DIMENSION = 1024;
const VALID_MARKER_COLORS = [
  "red",
  "blue",
  "green",
  "purple",
  "yellow",
  "gray",
  "orange",
  "white",
] as const;

const MarkerSchema = z.object({
  location: z.string().min(1, "Marker location cannot be empty"),
  color: z.enum(VALID_MARKER_COLORS).optional(),
  label: z
    .string()
    .regex(/^[A-Za-z0-9]$/, "Marker label must be a single alphanumeric character")
    .optional(),
});

type Marker = z.infer<typeof MarkerSchema>;

/** Parse and validate a "WxH" size string, capping each dimension at MAX_DIMENSION. */
function parseSize(size: string): { width: number; height: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(size.trim());
  if (!match) return null;
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return null;
  }
  return { width, height };
}

/** Sanitize a string for embedding in a filename. */
function sanitizeForFilename(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase()
    .slice(0, 50);
}

function timestampSlug(): string {
  return new Date().toISOString().slice(0, 19).replace(/:/g, "-");
}

/** Save image bytes to GOOGLE_MAPS_IMAGE_DIR (if configured) and return the saved path, if any. */
async function maybeSaveImage(
  data: Buffer,
  fileName: string
): Promise<string | undefined> {
  const dir = getImageDir();
  if (!dir) return undefined;
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, fileName);
  await writeFile(filePath, data);
  return filePath;
}

// ====================================
// Static Map
// ====================================

export interface StaticMapArgs {
  center: string;
  zoom?: number;
  size?: string;
  maptype?: "roadmap" | "satellite" | "terrain" | "hybrid";
  markers?: Marker[];
  save?: boolean;
}

export async function handleStaticMap(
  args: StaticMapArgs
): Promise<CallToolResult> {
  const {
    center,
    zoom = 13,
    size = "600x400",
    maptype = "roadmap",
    markers,
    save = false,
  } = args;

  if (!center || center.trim() === "") {
    return err("Center parameter is required and cannot be empty");
  }

  const parsedSize = parseSize(size);
  if (!parsedSize) {
    return err(
      `Size must be in format 'WIDTHxHEIGHT' with each dimension between 1 and ${MAX_DIMENSION} (e.g., '600x400')`
    );
  }

  if (zoom < 1 || zoom > 20) {
    return err("Zoom level must be between 1 and 20");
  }

  const apiKey = getApiKey();
  const url = new URL(STATIC_MAP_URL);
  url.searchParams.set("center", center);
  url.searchParams.set("zoom", String(zoom));
  url.searchParams.set("size", size);
  url.searchParams.set("maptype", maptype);

  if (markers && markers.length > 0) {
    for (const marker of markers) {
      let markerStr = "";
      if (marker.color) markerStr += `color:${marker.color}|`;
      if (marker.label) markerStr += `label:${marker.label}|`;
      markerStr += marker.location;
      url.searchParams.append("markers", markerStr);
    }
  }

  url.searchParams.set("key", apiKey);

  const { data, contentType } = await getBytes(url.toString());
  const mimeType = contentType.startsWith("image/") ? contentType : "image/png";

  const metadata: Record<string, unknown> = {
    center,
    parameters: { zoom, size, maptype, markers },
    image_url: sanitizeUrl(url.toString()),
    description: `Static map centered on ${center} at zoom ${zoom} (${maptype}).`,
  };

  if (save) {
    const fileName = `staticmap_${maptype}_${sanitizeForFilename(center)}_z${zoom}_${timestampSlug()}.png`;
    const savedPath = await maybeSaveImage(data, fileName);
    if (savedPath) {
      metadata.saved_path = savedPath;
    } else {
      metadata.saved_path = null;
      metadata.save_note =
        "save=true was requested but GOOGLE_MAPS_IMAGE_DIR is not set, so the image was not saved to disk.";
    }
  }

  return image(data.toString("base64"), mimeType, metadata);
}

// ====================================
// Street View
// ====================================

interface StreetViewMetadataApiResponse {
  status: string;
  date?: string;
  copyright?: string;
  location?: { lat: number; lng: number };
  pano_id?: string;
}

export interface StreetViewArgs {
  location: string;
  size?: string;
  heading?: number;
  pitch?: number;
  fov?: number;
  save?: boolean;
}

export async function handleStreetView(
  args: StreetViewArgs
): Promise<CallToolResult> {
  const { location, size = "600x400", heading, pitch = 0, fov = 90, save = false } = args;

  if (!location || location.trim() === "") {
    return err("Location parameter is required and cannot be empty");
  }

  const parsedSize = parseSize(size);
  if (!parsedSize) {
    return err(
      `Size must be in format 'WIDTHxHEIGHT' with each dimension between 1 and ${MAX_DIMENSION} (e.g., '600x400')`
    );
  }

  if (heading !== undefined && (heading < 0 || heading > 360)) {
    return err("Heading must be between 0 and 360 degrees");
  }
  if (pitch < -90 || pitch > 90) {
    return err("Pitch must be between -90 and 90 degrees");
  }
  if (fov < 10 || fov > 120) {
    return err("Field of view must be between 10 and 120 degrees");
  }

  const apiKey = getApiKey();

  const commonParams = (u: URL) => {
    u.searchParams.set("location", location);
    if (heading !== undefined) u.searchParams.set("heading", String(heading));
    u.searchParams.set("pitch", String(pitch));
    u.searchParams.set("fov", String(fov));
    u.searchParams.set("key", apiKey);
  };

  const metadataUrl = new URL(STREET_VIEW_METADATA_URL);
  commonParams(metadataUrl);

  const metadataResponse = await getJson<StreetViewMetadataApiResponse>(
    metadataUrl.toString()
  );

  if (metadataResponse.status !== "OK") {
    return err(
      `No Street View imagery is available for "${location}" (status: ${metadataResponse.status}). ` +
        `Request: ${sanitizeUrl(metadataUrl.toString())}`
    );
  }

  const imageUrl = new URL(STREET_VIEW_URL);
  commonParams(imageUrl);
  imageUrl.searchParams.set("size", size);

  const { data, contentType } = await getBytes(imageUrl.toString());
  const mimeType = contentType.startsWith("image/") ? contentType : "image/jpeg";

  const metadata: Record<string, unknown> = {
    location,
    parameters: { size, heading, pitch, fov },
    image_url: sanitizeUrl(imageUrl.toString()),
    pano_id: metadataResponse.pano_id,
    pano_date: metadataResponse.date,
    copyright: metadataResponse.copyright,
    description: `Street View image for ${location}${
      heading !== undefined ? ` facing heading ${heading}°` : ""
    }, pitch ${pitch}°, fov ${fov}°.`,
  };

  if (save) {
    const fileName = `streetview_${sanitizeForFilename(location)}_h${
      heading ?? "auto"
    }_p${pitch}_${timestampSlug()}.jpg`;
    const savedPath = await maybeSaveImage(data, fileName);
    if (savedPath) {
      metadata.saved_path = savedPath;
    } else {
      metadata.saved_path = null;
      metadata.save_note =
        "save=true was requested but GOOGLE_MAPS_IMAGE_DIR is not set, so the image was not saved to disk.";
    }
  }

  return image(data.toString("base64"), mimeType, metadata);
}

// ====================================
// Registration
// ====================================

export function registerVisualTools(server: McpServer): void {
  server.registerTool(
    "maps_static_map",
    {
      title: "Get Static Map Image",
      description:
        "Get a static map image (roadmap, satellite, terrain, or hybrid) centered on a location, " +
        "with optional markers. Returns the image inline.\n\n" +
        "Args:\n" +
        "  center: Address or 'lat,lng' coordinates to center the map on.\n" +
        "  zoom: Zoom level 1-20 (1=world view, 20=building level). Default 13.\n" +
        "  size: Image size as 'WIDTHxHEIGHT' in pixels, max 1024x1024. Default '600x400'.\n" +
        "  maptype: One of roadmap, satellite, terrain, hybrid. Default roadmap.\n" +
        "  markers: Optional array of { location, color?, label? } to plot on the map. " +
        `color must be one of: ${VALID_MARKER_COLORS.join(", ")}. label must be a single alphanumeric character.\n` +
        "  save: If true and GOOGLE_MAPS_IMAGE_DIR is set, also save the image to disk. Default false.\n\n" +
        "Returns:\n" +
        "  Inline PNG image plus metadata (request parameters and sanitized image URL; saved_path if saved).",
      inputSchema: {
        center: z
          .string()
          .min(1)
          .describe("Center point of the map (address or 'lat,lng' coordinates)"),
        zoom: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Zoom level 1-20 (default 13)"),
        size: z
          .string()
          .optional()
          .describe("Image size 'WIDTHxHEIGHT' in pixels, max 1024x1024 (default '600x400')"),
        maptype: z
          .enum(["roadmap", "satellite", "terrain", "hybrid"])
          .optional()
          .describe("Map type (default roadmap)"),
        markers: z
          .array(MarkerSchema)
          .optional()
          .describe("Optional markers to plot on the map"),
        save: z
          .boolean()
          .optional()
          .describe("Also save the image to GOOGLE_MAPS_IMAGE_DIR if set (default false)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleStaticMap)
  );

  server.registerTool(
    "maps_street_view",
    {
      title: "Get Street View Image",
      description:
        "Get a Street View image for a location with customizable heading, pitch, and field of view. " +
        "First checks Street View metadata to confirm imagery exists at the location before fetching " +
        "the image. Returns the image inline.\n\n" +
        "Args:\n" +
        "  location: Address or 'lat,lng' coordinates (e.g., 'Times Square, NYC' or '40.758,-73.985').\n" +
        "  size: Image size as 'WIDTHxHEIGHT' in pixels, max 1024x1024. Default '600x400'.\n" +
        "  heading: Compass heading in degrees 0-360 (0=North, 90=East, 180=South, 270=West). Optional; if omitted, Google picks a default heading toward the nearest road.\n" +
        "  pitch: Up/down viewing angle in degrees -90 to 90. Default 0.\n" +
        "  fov: Field of view in degrees 10-120 (lower = more zoomed in). Default 90.\n" +
        "  save: If true and GOOGLE_MAPS_IMAGE_DIR is set, also save the image to disk. Default false.\n\n" +
        "Returns:\n" +
        "  Inline JPEG image plus metadata (request parameters, pano date/copyright if available, " +
        "sanitized image URL; saved_path if saved). If no imagery is available, returns an error " +
        "with the metadata status.",
      inputSchema: {
        location: z
          .string()
          .min(1)
          .describe("Address or 'lat,lng' coordinates for the Street View"),
        size: z
          .string()
          .optional()
          .describe("Image size 'WIDTHxHEIGHT' in pixels, max 1024x1024 (default '600x400')"),
        heading: z
          .number()
          .min(0)
          .max(360)
          .optional()
          .describe("Compass heading in degrees 0-360"),
        pitch: z
          .number()
          .min(-90)
          .max(90)
          .optional()
          .describe("Up/down viewing angle in degrees -90 to 90 (default 0)"),
        fov: z
          .number()
          .min(10)
          .max(120)
          .optional()
          .describe("Field of view in degrees 10-120 (default 90)"),
        save: z
          .boolean()
          .optional()
          .describe("Also save the image to GOOGLE_MAPS_IMAGE_DIR if set (default false)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleStreetView)
  );
}
