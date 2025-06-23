/**
 * google-maps.ts - Google Maps API interfaces
 *
 * This file contains interfaces specific to the Google Maps API responses.
 *
 * Dependencies:
 * - common.ts (for GoogleMapsResponse)
 *
 * @author Cline
 */
import { GoogleMapsResponse } from "./common.js";
/**
 * @interface GeocodeResponse
 * @description Interface for Geocoding API responses.
 * @extends GoogleMapsResponse
 * @property {Array<Object>} results - Array of geocoding results.
 */
export interface GeocodeResponse extends GoogleMapsResponse {
    results: Array<{
        place_id: string;
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        address_components: Array<{
            long_name: string;
            short_name: string;
            types: string[];
        }>;
    }>;
}
/**
 * @interface PlacesSearchResponse
 * @description Interface for Places Search API responses.
 * @extends GoogleMapsResponse
 * @property {Array<Object>} results - Array of place search results.
 */
export interface PlacesSearchResponse extends GoogleMapsResponse {
    results: Array<{
        name: string;
        place_id: string;
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        rating?: number;
        types: string[];
    }>;
}
/**
 * @interface PlaceDetailsResponse
 * @description Interface for Place Details API responses.
 * @extends GoogleMapsResponse
 * @property {Object} result - Detailed information about a place.
 */
export interface PlaceDetailsResponse extends GoogleMapsResponse {
    result: {
        name: string;
        place_id: string;
        formatted_address: string;
        formatted_phone_number?: string;
        website?: string;
        rating?: number;
        reviews?: Array<{
            author_name: string;
            rating: number;
            text: string;
            time: number;
        }>;
        opening_hours?: {
            weekday_text: string[];
            open_now: boolean;
        };
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
    };
}
/**
 * @interface DistanceMatrixResponse
 * @description Interface for Distance Matrix API responses.
 * @extends GoogleMapsResponse
 * @property {string[]} origin_addresses - Array of origin addresses.
 * @property {string[]} destination_addresses - Array of destination addresses.
 * @property {Array<Object>} rows - Array of distance matrix rows.
 */
export interface DistanceMatrixResponse extends GoogleMapsResponse {
    origin_addresses: string[];
    destination_addresses: string[];
    rows: Array<{
        elements: Array<{
            status: string;
            duration: {
                text: string;
                value: number;
            };
            distance: {
                text: string;
                value: number;
            };
        }>;
    }>;
}
/**
 * @interface ElevationResponse
 * @description Interface for Elevation API responses.
 * @extends GoogleMapsResponse
 * @property {Array<Object>} results - Array of elevation results.
 */
export interface ElevationResponse extends GoogleMapsResponse {
    results: Array<{
        elevation: number;
        location: {
            lat: number;
            lng: number;
        };
        resolution: number;
    }>;
}
/**
 * @interface DirectionsResponse
 * @description Interface for Directions API responses.
 * @extends GoogleMapsResponse
 * @property {Array<Object>} routes - Array of route results.
 */
export interface DirectionsResponse extends GoogleMapsResponse {
    routes: Array<{
        summary: string;
        legs: Array<{
            distance: {
                text: string;
                value: number;
            };
            duration: {
                text: string;
                value: number;
            };
            steps: Array<{
                html_instructions: string;
                distance: {
                    text: string;
                    value: number;
                };
                duration: {
                    text: string;
                    value: number;
                };
                travel_mode: string;
            }>;
        }>;
    }>;
}
/**
 * @interface RoutesResponse
 * @description Interface for Routes API responses (new version).
 * @property {Array<Object>} routes - Array of route results.
 */
export interface RoutesResponse {
    routes: Array<{
        distanceMeters: number;
        duration: string;
        polyline: {
            encodedPolyline: string;
        };
        legs: Array<{
            distanceMeters: number;
            duration: string;
            steps: Array<{
                distanceMeters: number;
                staticDuration: string;
                polyline: {
                    encodedPolyline: string;
                };
                startLocation: {
                    latLng: {
                        latitude: number;
                        longitude: number;
                    };
                };
                endLocation: {
                    latLng: {
                        latitude: number;
                        longitude: number;
                    };
                };
                navigationInstruction: {
                    maneuver: string;
                    instructions: string;
                };
            }>;
        }>;
    }>;
}
//# sourceMappingURL=google-maps.d.ts.map