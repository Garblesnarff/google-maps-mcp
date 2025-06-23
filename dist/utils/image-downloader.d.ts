/**
 * image-downloader.ts - Image downloading utility for visual Google Maps APIs
 *
 * This file contains utility functions for downloading images from Google Maps APIs
 * and saving them locally with descriptive filenames.
 *
 * Dependencies:
 * - node-fetch (for HTTP requests)
 * - fs/promises (for file operations)
 * - path (for path manipulation)
 *
 * @author Claude
 */
/**
 * @interface DownloadResult
 * @description Result of an image download operation.
 */
export interface DownloadResult {
    success: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    error?: string;
}
/**
 * Downloads an image from a URL and saves it locally.
 *
 * @param {string} imageUrl - The URL of the image to download.
 * @param {string} [customDir] - Custom directory to save the image (optional).
 * @param {string} [customFilename] - Custom filename (optional, will generate if not provided).
 * @returns {Promise<DownloadResult>} Result of the download operation.
 */
export declare function downloadImage(imageUrl: string, customDir?: string, customFilename?: string): Promise<DownloadResult>;
/**
 * Downloads a Street View image with descriptive naming.
 *
 * @param {string} imageUrl - The Street View image URL.
 * @param {string} location - Location description for filename.
 * @param {number} heading - Heading for filename.
 * @param {number} pitch - Pitch for filename.
 * @param {string} [customDir] - Custom directory (optional).
 * @returns {Promise<DownloadResult>} Result of the download operation.
 */
export declare function downloadStreetViewImage(imageUrl: string, location: string, heading: number, pitch: number, customDir?: string): Promise<DownloadResult>;
/**
 * Downloads a static map image with descriptive naming.
 *
 * @param {string} imageUrl - The static map image URL.
 * @param {string} center - Center location description for filename.
 * @param {string} maptype - Map type for filename.
 * @param {number} zoom - Zoom level for filename.
 * @param {string} [customDir] - Custom directory (optional).
 * @returns {Promise<DownloadResult>} Result of the download operation.
 */
export declare function downloadStaticMapImage(imageUrl: string, center: string, maptype: string, zoom: number, customDir?: string): Promise<DownloadResult>;
//# sourceMappingURL=image-downloader.d.ts.map