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
export async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorBody}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        throw error;
    }
}
/**
 * Makes a POST request to a given URL with a JSON body and parses the response.
 * Handles network errors and non-OK HTTP statuses.
 *
 * @param {string} url - The URL to post data to.
 * @param {Object} body - The JSON body to send with the request.
 * @param {Record<string, string>} headers - Additional headers for the request.
 * @returns {Promise<T>} A promise that resolves with the parsed JSON data.
 * @throws {Error} If the network request fails or the response status is not OK.
 */
export async function postJson(url, body, headers) {
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
        return await response.json();
    }
    catch (error) {
        console.error(`Error posting to ${url}:`, error);
        throw error;
    }
}
//# sourceMappingURL=api-client.js.map