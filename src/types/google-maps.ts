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
 * @interface RouteMatrixElement
 * @description Interface for a single element of a Routes API
 * distanceMatrix/v2:computeRouteMatrix response. The response is a flat array of
 * these elements, each addressed by its originIndex/destinationIndex pair, and
 * does not echo back resolved addresses.
 * @property {number} originIndex - Index of the origin in the request origins array.
 * @property {number} destinationIndex - Index of the destination in the request destinations array.
 * @property {string} status - Status of the route computation for this element (e.g. "OK").
 * @property {string} [duration] - Travel duration as a string in seconds (e.g. "3600s").
 * @property {number} [distanceMeters] - Travel distance in meters.
 * @property {string} [condition] - Route condition for this element (e.g. "ROUTE_EXISTS").
 */
export interface RouteMatrixElement {
  originIndex: number;
  destinationIndex: number;
  status: string;
  duration?: string;
  distanceMeters?: number;
  condition?: string;
}

/**
 * @interface DistanceMatrixResponse
 * @description Interface for Routes API distanceMatrix/v2:computeRouteMatrix responses.
 * The response is a flat array of {@link RouteMatrixElement} objects which must be
 * grouped by originIndex (and ordered by destinationIndex) to be consumed as a matrix.
 */
export type DistanceMatrixResponse = RouteMatrixElement[];

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
 * @interface DirectionsRoute
 * @description Interface for a single route of a Routes API
 * directions/v2:computeRoutes response. Field presence depends on the
 * requested X-Goog-FieldMask.
 * @property {string} [description] - Route description, equivalent to the legacy route summary.
 * @property {number} [distanceMeters] - Route distance in meters.
 * @property {string} [duration] - Route duration as a string in seconds (e.g. "3600s").
 * @property {Array<Object>} [legs] - Route legs (one leg when no intermediate waypoints are given).
 * @property {Array<Object>} [legs[].steps] - Steps of the leg.
 * @property {Object} [legs[].steps[].navigationInstruction] - Human-readable navigation instruction.
 * @property {string} [legs[].steps[].navigationInstruction.maneuver] - Maneuver for the step.
 * @property {string} [legs[].steps[].navigationInstruction.instructions] - Instruction text for the step.
 * @property {number} [legs[].steps[].distanceMeters] - Step distance in meters.
 * @property {string} [legs[].steps[].staticDuration] - Step duration as a string in seconds.
 */
export interface DirectionsRoute {
  description?: string;
  distanceMeters?: number;
  duration?: string;
  legs?: Array<{
    steps?: Array<{
      navigationInstruction?: {
        maneuver?: string;
        instructions?: string;
      };
      distanceMeters?: number;
      staticDuration?: string;
    }>;
  }>;
}

/**
 * @interface DirectionsResponse
 * @description Interface for Routes API directions/v2:computeRoutes responses.
 * @property {Array<DirectionsRoute>} routes - Array of computed routes.
 */
export interface DirectionsResponse {
  routes: DirectionsRoute[];
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
