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

// ====================================
// Google Maps Interfaces
// ====================================

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
      }
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
}

/**
 * @interface PlacesNewPlace
 * @description Interface for a place object returned by the Places API (New)
 * (https://places.googleapis.com/v1). Field presence depends on the requested
 * X-Goog-FieldMask.
 * @property {string} [id] - The place ID.
 * @property {Object} [displayName] - The place name (localized).
 * @property {string} [formattedAddress] - The human-readable address.
 * @property {Object} [location] - The geographic coordinates.
 * @property {number} [rating] - The aggregate rating (0.0 - 5.0).
 * @property {string[]} [types] - The place types.
 * @property {string} [nationalPhoneNumber] - The phone number in national format.
 * @property {string} [websiteUri] - The website URI.
 * @property {Array<Object>} [reviews] - Place reviews.
 * @property {Object} [currentOpeningHours] - The current opening hours.
 */
export interface PlacesNewPlace {
  id?: string;
  displayName?: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  types?: string[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  reviews?: Array<{
    name?: string;
    rating?: number;
    text?: {
      text: string;
      languageCode: string;
    };
    originalText?: {
      text: string;
      languageCode: string;
    };
    authorAttribution?: {
      displayName: string;
      uri?: string;
      photoUri?: string;
    };
    relativePublishTimeDescription?: string;
    publishTime?: string;
  }>;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
    periods?: Array<{
      open?: {
        day: number;
        hour: number;
        minute: number;
      };
      close?: {
        day: number;
        hour: number;
        minute: number;
      };
    }>;
  };
}

/**
 * @interface PlacesSearchResponse
 * @description Interface for Places API (New) searchText responses
 * (https://places.googleapis.com/v1/places:searchText).
 * @property {Array<PlacesNewPlace>} [places] - Array of matching places.
 */
export interface PlacesSearchResponse {
  places?: PlacesNewPlace[];
}

/**
 * @interface PlaceDetailsResponse
 * @description Interface for Places API (New) place details responses
 * (https://places.googleapis.com/v1/places/{place_id}).
 */
export interface PlaceDetailsResponse extends PlacesNewPlace {}

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
