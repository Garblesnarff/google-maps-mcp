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

import fetch from 'node-fetch';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

// ====================================
// Image Download Configuration
// ====================================

/**
 * Default download directory relative to the project root
 */
const DEFAULT_DOWNLOAD_DIR = 'downloads/maps';

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

// ====================================
// Image Download Functions
// ====================================

/**
 * Downloads an image from a URL and saves it locally.
 *
 * @param {string} imageUrl - The URL of the image to download.
 * @param {string} [customDir] - Custom directory to save the image (optional).
 * @param {string} [customFilename] - Custom filename (optional, will generate if not provided).
 * @returns {Promise<DownloadResult>} Result of the download operation.
 */
export async function downloadImage(
  imageUrl: string,
  customDir?: string,
  customFilename?: string
): Promise<DownloadResult> {
  try {
    // Determine download directory
    const downloadDir = customDir || DEFAULT_DOWNLOAD_DIR;
    
    // Create directory if it doesn't exist
    if (!existsSync(downloadDir)) {
      await mkdir(downloadDir, { recursive: true });
    }

    // Generate filename if not provided
    const fileName = customFilename || generateFileName();
    const filePath = join(downloadDir, fileName);

    // Download the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    // Get the image buffer
    const buffer = await response.buffer();
    
    // Save the file
    await writeFile(filePath, buffer);

    return {
      success: true,
      filePath,
      fileName,
      fileSize: buffer.length
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

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
export async function downloadStreetViewImage(
  imageUrl: string,
  location: string,
  heading: number,
  pitch: number,
  customDir?: string
): Promise<DownloadResult> {
  const sanitizedLocation = sanitizeForFilename(location);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const fileName = `streetview_${sanitizedLocation}_h${heading}_p${pitch}_${timestamp}.jpg`;
  
  return downloadImage(imageUrl, customDir, fileName);
}

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
export async function downloadStaticMapImage(
  imageUrl: string,
  center: string,
  maptype: string,
  zoom: number,
  customDir?: string
): Promise<DownloadResult> {
  const sanitizedCenter = sanitizeForFilename(center);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const fileName = `staticmap_${maptype}_${sanitizedCenter}_z${zoom}_${timestamp}.jpg`;
  
  return downloadImage(imageUrl, customDir, fileName);
}

// ====================================
// Helper Functions
// ====================================

/**
 * Generates a unique filename with timestamp.
 *
 * @returns {string} Generated filename.
 */
function generateFileName(): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `maps_image_${timestamp}.jpg`;
}

/**
 * Sanitizes a string to be safe for use in filenames.
 *
 * @param {string} input - Input string to sanitize.
 * @returns {string} Sanitized string safe for filenames.
 */
function sanitizeForFilename(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase() // Convert to lowercase
    .slice(0, 50); // Limit length
}
