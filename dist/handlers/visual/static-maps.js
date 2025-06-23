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
import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { createErrorResponse } from "../../utils/error-handling.js";
// ====================================
// Static Maps API Handlers
// ====================================
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
export async function handleStaticMap(center, zoom = 13, size = "640x640", maptype = "roadmap", markers) {
    try {
        // Validate input parameters
        if (!center || center.trim() === "") {
            return createErrorResponse("Center parameter is required and cannot be empty");
        }
        // Validate size format (should be WIDTHxHEIGHT)
        const sizeRegex = /^\d+x\d+$/;
        if (!sizeRegex.test(size)) {
            return createErrorResponse("Size must be in format 'WIDTHxHEIGHT' (e.g., '640x640')");
        }
        // Validate zoom level
        if (zoom < 1 || zoom > 20) {
            return createErrorResponse("Zoom level must be between 1 and 20");
        }
        // Validate map type
        const validMapTypes = ["roadmap", "satellite", "terrain", "hybrid"];
        if (!validMapTypes.includes(maptype)) {
            return createErrorResponse(`Map type must be one of: ${validMapTypes.join(", ")}`);
        }
        // Build the Maps Static API URL
        const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
        url.searchParams.append("center", center);
        url.searchParams.append("zoom", zoom.toString());
        url.searchParams.append("size", size);
        url.searchParams.append("maptype", maptype);
        url.searchParams.append("key", GOOGLE_MAPS_API_KEY);
        // Add markers if provided
        if (markers && markers.length > 0) {
            for (const marker of markers) {
                if (!marker.location || marker.location.trim() === "") {
                    return createErrorResponse("Marker location cannot be empty");
                }
                let markerStr = "";
                // Add color if specified
                if (marker.color) {
                    const validColors = ["red", "blue", "green", "purple", "yellow", "gray", "orange", "white"];
                    if (!validColors.includes(marker.color)) {
                        return createErrorResponse(`Marker color must be one of: ${validColors.join(", ")}`);
                    }
                    markerStr += `color:${marker.color}|`;
                }
                // Add label if specified
                if (marker.label) {
                    const labelRegex = /^[A-Za-z0-9]$/;
                    if (!labelRegex.test(marker.label)) {
                        return createErrorResponse("Marker label must be a single alphanumeric character (A-Z, 0-9)");
                    }
                    markerStr += `label:${marker.label}|`;
                }
                // Add location
                markerStr += marker.location;
                url.searchParams.append("markers", markerStr);
            }
        }
        // Create metadata object
        const metadata = {
            image_url: url.toString(),
            center: center,
            parameters: {
                zoom,
                size,
                maptype,
                markers
            },
            description: `${getMapTypeDescription(maptype)} map image URL centered on ${center} at zoom level ${zoom}. ${markers && markers.length > 0 ? `Includes ${markers.length} marker(s).` : ''} You can display this image or save it locally.`
        };
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(metadata, null, 2)
                }],
            isError: false
        };
    }
    catch (error) {
        return createErrorResponse(`Static map request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
// ====================================
// Helper Functions
// ====================================
/**
 * Gets a human-readable description for a map type.
 *
 * @param {string} maptype - The map type.
 * @returns {string} Human-readable description of the map type.
 */
function getMapTypeDescription(maptype) {
    switch (maptype) {
        case "roadmap":
            return "Standard roadmap";
        case "satellite":
            return "Satellite imagery";
        case "terrain":
            return "Terrain with topographical features";
        case "hybrid":
            return "Satellite imagery with road overlays";
        default:
            return "Map";
    }
}
//# sourceMappingURL=static-maps.js.map