/**
 * street-view.ts - Street View Static API handler
 *
 * This file contains handler functions for Google Street View Static API.
 * Generates URLs for Street View images based on location and viewing parameters.
 * Optionally downloads images locally.
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/visual.js (for StreetViewMetadata)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../../utils/image-downloader.js (for downloadStreetViewImage)
 * - ../../types/common.js (for ToolResponse)
 *
 * @author Claude
 */
import { GOOGLE_MAPS_API_KEY } from "../../config/environment.js";
import { createErrorResponse } from "../../utils/error-handling.js";
import { downloadStreetViewImage } from "../../utils/image-downloader.js";
// ====================================
// Street View API Handlers
// ====================================
/**
 * Handles the Street View image request, generating a URL for a Street View image.
 * Optionally downloads the image locally.
 *
 * @param {string} location - The location for the Street View (address or coordinates).
 * @param {string} [size="640x640"] - Image size in pixels.
 * @param {number} [heading=0] - Compass heading in degrees (0-360).
 * @param {number} [pitch=0] - Up/down viewing angle in degrees (-90 to 90).
 * @param {number} [fov=90] - Field of view in degrees (10-120).
 * @param {boolean} [download=false] - Whether to download the image locally.
 * @param {string} [downloadDir] - Custom directory to save downloaded image.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the Street View image URL and metadata.
 */
export async function handleStreetView(location, size = "640x640", heading = 0, pitch = 0, fov = 90, download = false, downloadDir) {
    try {
        // Validate input parameters
        if (!location || location.trim() === "") {
            return createErrorResponse("Location parameter is required and cannot be empty");
        }
        // Validate size format (should be WIDTHxHEIGHT)
        const sizeRegex = /^\d+x\d+$/;
        if (!sizeRegex.test(size)) {
            return createErrorResponse("Size must be in format 'WIDTHxHEIGHT' (e.g., '640x640')");
        }
        // Validate numeric ranges
        if (heading < 0 || heading > 360) {
            return createErrorResponse("Heading must be between 0 and 360 degrees");
        }
        if (pitch < -90 || pitch > 90) {
            return createErrorResponse("Pitch must be between -90 and 90 degrees");
        }
        if (fov < 10 || fov > 120) {
            return createErrorResponse("Field of view must be between 10 and 120 degrees");
        }
        // Build the Street View Static API URL
        const url = new URL("https://maps.googleapis.com/maps/api/streetview");
        url.searchParams.append("location", location);
        url.searchParams.append("size", size);
        url.searchParams.append("heading", heading.toString());
        url.searchParams.append("pitch", pitch.toString());
        url.searchParams.append("fov", fov.toString());
        url.searchParams.append("key", GOOGLE_MAPS_API_KEY);
        // Create base metadata object
        const metadata = {
            image_url: url.toString(),
            location: location,
            parameters: {
                size,
                heading,
                pitch,
                fov
            },
            description: `Street View image URL for ${location}. You can display this image or save it locally. The image shows a ${fov}° field of view, facing ${heading}° (${getDirectionName(heading)}) with a ${pitch}° ${pitch >= 0 ? 'upward' : 'downward'} angle.`
        };
        // Download image if requested
        if (download) {
            try {
                const downloadResult = await downloadStreetViewImage(url.toString(), location, heading, pitch, downloadDir);
                metadata.download = downloadResult;
                if (downloadResult.success) {
                    metadata.description += ` Image downloaded to: ${downloadResult.filePath}`;
                }
                else {
                    metadata.description += ` Note: Download failed - ${downloadResult.error}`;
                }
            }
            catch (downloadError) {
                metadata.download = {
                    success: false,
                    error: downloadError instanceof Error ? downloadError.message : String(downloadError)
                };
                metadata.description += ` Note: Download failed - ${metadata.download.error}`;
            }
        }
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(metadata, null, 2)
                }],
            isError: false
        };
    }
    catch (error) {
        return createErrorResponse(`Street View request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
// ====================================
// Helper Functions
// ====================================
/**
 * Converts a compass heading to a human-readable direction name.
 *
 * @param {number} heading - Compass heading in degrees (0-360).
 * @returns {string} Human-readable direction (e.g., "North", "Northeast").
 */
function getDirectionName(heading) {
    const directions = [
        "North", "Northeast", "East", "Southeast",
        "South", "Southwest", "West", "Northwest"
    ];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
}
//# sourceMappingURL=street-view.js.map