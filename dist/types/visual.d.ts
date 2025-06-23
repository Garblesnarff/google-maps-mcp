/**
 * visual.ts - Visual Google Maps API interfaces
 *
 * This file contains interfaces specific to the visual Google Maps APIs
 * like Street View Static API and Maps Static API.
 *
 * Dependencies: None
 *
 * @author Claude
 */
/**
 * @interface DownloadInfo
 * @description Information about a downloaded image file.
 */
export interface DownloadInfo {
    success: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    error?: string;
}
/**
 * @interface StreetViewMetadata
 * @description Interface for Street View image metadata.
 * @property {string} image_url - The URL of the Street View image.
 * @property {string} location - The location used for the Street View request.
 * @property {Object} parameters - The parameters used to generate the image.
 * @property {string} description - Description of the image type and usage.
 * @property {DownloadInfo} [download] - Information about downloaded file (if downloaded).
 */
export interface StreetViewMetadata {
    image_url: string;
    location: string;
    parameters: {
        size: string;
        heading: number;
        pitch: number;
        fov: number;
    };
    description: string;
    download?: DownloadInfo;
}
/**
 * @interface StaticMapMetadata
 * @description Interface for Static Map image metadata.
 * @property {string} image_url - The URL of the static map image.
 * @property {string} center - The center location of the map.
 * @property {Object} parameters - The parameters used to generate the map.
 * @property {string} description - Description of the map type and usage.
 * @property {DownloadInfo} [download] - Information about downloaded file (if downloaded).
 */
export interface StaticMapMetadata {
    image_url: string;
    center: string;
    parameters: {
        zoom: number;
        size: string;
        maptype: string;
        markers?: Array<{
            location: string;
            color?: string;
            label?: string;
        }>;
    };
    description: string;
    download?: DownloadInfo;
}
/**
 * @interface MarkerDefinition
 * @description Interface for defining markers on static maps.
 * @property {string} location - The location of the marker (address or coordinates).
 * @property {string} [color] - Optional color of the marker.
 * @property {string} [label] - Optional label for the marker.
 */
export interface MarkerDefinition {
    location: string;
    color?: string;
    label?: string;
}
//# sourceMappingURL=visual.d.ts.map