/**
 * api-client.ts - Generic API client utilities
 *
 * This file provides utility functions for making API requests,
 * including error handling and response parsing.
 *
 * Dependencies:
 * - node-fetch
 *
 * @author Cline
 */

import fetch from "node-fetch";
import { GOOGLE_MAPS_API_KEY } from "../config/environment.js";
import { ToolResponse } from "../types/common.js";

// ====================================
// API Client Utilities
// ====================================

/**
 * Fetches data from a given URL and parses it as JSON.
 * Handles network errors and non-OK HTTP statuses.
 *
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<T>} A promise that resolves with the parsed JSON data.
 * @throws {Error} If the network request fails or the response status is not OK.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorBody}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}

/**
 * Makes a POST request to a given URL with a JSON body and parses the response.
 *
 * @param {string} url - The URL to post data to.
 * @param {Object} body - The JSON body to send with the request.
 * @param {Record<string, string>} headers - Additional headers for the request.
 * @returns {Promise<T>} A promise that resolves with the parsed JSON data.
 * @throws {Error} If the network request fails or the response status is not OK.
 */
export async function postJson<T>(url: string, body: object, headers: Record<string, string>): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorBody}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Error posting to ${url}:`, error);
    throw error;
  }
}

/**
 * Fetches data from a Google Maps API endpoint, handles API key injection, response status checks,
 * and returns a standardized ToolResponse object.
 *
 * @param {string} endpoint - The Google Maps API endpoint path (e.g., "maps/api/geocode/json").
 * @param {Record<string, string | number>} [queryParams={}] - Additional query parameters to append to the request.
 * @returns {Promise<ToolResponse>} A ToolResponse containing the API response data or an error message.
 */
export async function googleApiRequest(
  endpoint: string,
  queryParams: Record<string, string | number> = {}
): Promise<ToolResponse> {
  try {
    // Construct the full URL
    const url = new URL(`https://maps.googleapis.com/${endpoint}`);
    
    // Automatically append API key
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    // Add user-provided query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key.toString(), value.toString());
    });

    // Fetch data from the API
    const response: any = await fetchJson(url.toString());

    // Check if the API request was successful
    if (response.status && response.status.toUpperCase() !== "OK") {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${response.error_message || `Google Maps API returned status: ${response.status}`}`
          }
        ],
        isError: true
      };
    }

    // Compile useful response content
    const responseContent = JSON.stringify(response.results && response.results.length > 0
      ? response.results[0]
      : response, null, 2);

    // Format successful response
    return {
      content: [
        {
          type: "text",
          text: responseContent
        }
      ],
      isError: false
    };
  } catch (error) {
    // Catch & format network/logic errors
    return {
      content: [
        {
          type: "text",
          text: `Error fetching Google Maps data: ${(error as Error).message}`
        }
      ],
      isError: true
    };
  }
}
