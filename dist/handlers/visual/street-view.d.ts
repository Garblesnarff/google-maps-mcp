/**
 * street-view.ts - Street View Static API handler
 *
 * This file contains handler functions for Google Street View Static API.
 * Generates URLs for Street View images based on location and viewing parameters.
 *
 * Dependencies:
 * - ../../config/environment.js (for GOOGLE_MAPS_API_KEY)
 * - ../../types/visual.js (for StreetViewMetadata)
 * - ../../utils/error-handling.js (for createErrorResponse)
 * - ../../types/common.js (for ToolResponse)
 *
 * @author Claude
 */
import { ToolResponse } from "../../types/common.js";
/**
 * Handles the Street View image request, generating a URL for a Street View image.
 *
 * @param {string} location - The location for the Street View (address or coordinates).
 * @param {string} [size="640x640"] - Image size in pixels.
 * @param {number} [heading=0] - Compass heading in degrees (0-360).
 * @param {number} [pitch=0] - Up/down viewing angle in degrees (-90 to 90).
 * @param {number} [fov=90] - Field of view in degrees (10-120).
 * @returns {Promise<ToolResponse>} A ToolResponse containing the Street View image URL and metadata.
 */
export declare function handleStreetView(location: string, size?: string, heading?: number, pitch?: number, fov?: number): Promise<ToolResponse>;
//# sourceMappingURL=street-view.d.ts.map