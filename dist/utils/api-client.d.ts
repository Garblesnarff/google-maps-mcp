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
/**
 * Fetches data from a given URL and parses it as JSON.
 * Handles network errors and non-OK HTTP statuses.
 *
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<T>} A promise that resolves with the parsed JSON data.
 * @throws {Error} If the network request fails or the response status is not OK.
 */
export declare function fetchJson<T>(url: string): Promise<T>;
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
export declare function postJson<T>(url: string, body: object, headers: Record<string, string>): Promise<T>;
//# sourceMappingURL=api-client.d.ts.map