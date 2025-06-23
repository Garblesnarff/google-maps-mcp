/**
 * static-maps.ts - Maps Static API handler
 *
 * This file contains handler functions for Google Maps Static API.
 * Generates URLs for static map images with various map types and optional markers.
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/visual.js (for StaticMapMetadata, MarkerDefinition)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../../types/common.js (for ToolResponse)
 *
 * @author Claude
 */
import { MarkerDefinition } from "../../types/visual.js";
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the static map image request, generating a URL for a static map image.
 *
 * @param {string} center - Center point of the map (address or coordinates).
 * @param {number} [zoom=13] - Zoom level (1-20).
 * @param {string} [size="640x640"] - Image size in pixels.
 * @param {string} [maptype="roadmap"] - Type of map (roadmap, satellite, terrain, hybrid).
 * @param {MarkerDefinition[]} [markers] - Optional markers to add to the map.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the static map image URL and metadata.
 */
export declare function handleStaticMap(center: string, zoom?: number, size?: string, maptype?: string, markers?: MarkerDefinition[]): Promise<ToolResponse>;
//# sourceMappingURL=static-maps.d.ts.map