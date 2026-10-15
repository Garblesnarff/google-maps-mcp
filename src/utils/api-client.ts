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

import fetch, { RequestInit, Response } from "node-fetch";
import { GOOGLE_MAPS_API_KEY } from "../config/environment.js";
import { ToolResponse } from "../types/common.js";

// ====================================
// API Client Utilities
// ====================================

/** Default request timeout: 30 seconds. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/** Default retries on retryable failures (network errors, 5xx, 429). */
export const DEFAULT_REQUEST_RETRIES = 1;

/** Base delay between retries (doubles each attempt). */
export const DEFAULT_RETRY_DELAY_MS = 500;

export interface RequestOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

/**
 * Redacts an API key query parameter so URLs are safe to log.
 */
export function redactUrl(url: string): string {
  return url.replace(/([?&]key=)[^&]*/i, "$1[REDACTED]");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Fetches with a timeout. Never includes the URL in thrown errors —
 * callers log the redacted form instead.
 */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Core request loop shared by fetchJson/postJson: timeout, one retry pass
 * with backoff on retryable failures, and key-safe logging.
 */
async function requestJson<T>(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string | undefined,
  options: RequestOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_REQUEST_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const safeUrl = redactUrl(url);

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, { method, headers, body }, timeoutMs);
      if (!response.ok) {
        const errorBody = await response.text();
        const err = new Error(`HTTP error! Status: ${response.status}, Body: ${errorBody}`);
        if (isRetryableStatus(response.status) && attempt < retries) {
          lastError = err;
          await sleep(retryDelayMs * 2 ** attempt);
          continue;
        }
        throw err;
      }
      return (await response.json()) as T;
    } catch (error) {
      const retryableNetwork =
        error instanceof Error &&
        /timed out|ECONNRESET|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|socket hang up/i.test(error.message);
      if (retryableNetwork && attempt < retries) {
        lastError = error;
        await sleep(retryDelayMs * 2 ** attempt);
        continue;
      }
      console.error(`Error ${method === "POST" ? "posting to" : "fetching from"} ${safeUrl}:`, error);
      throw error;
    }
  }
  console.error(`Error ${method === "POST" ? "posting to" : "fetching from"} ${safeUrl}:`, lastError);
  throw lastError;
}

/**
 * Fetches data from a given URL and parses it as JSON.
 * Requests time out, retry once on retryable failures, and never leak
 * API keys into logs.
 *
 * @param {string} url - The URL to fetch data from.
 * @param {Record<string, string>} [headers] - Optional additional headers for the request (e.g. authentication headers).
 * @param {RequestOptions} [options] - Timeout/retry overrides.
 * @returns {Promise<T>} A promise that resolves with the parsed JSON data.
 * @throws {Error} If the network request fails or the response status is not OK.
 */
export async function fetchJson<T>(
  url: string,
  headers: Record<string, string> = {},
  options: RequestOptions = {}
): Promise<T> {
  return requestJson<T>("GET", url, headers, undefined, options);
}

/**
 * Makes a POST request to a given URL with a JSON body and parses the response.
 * Same timeout/retry/log-safety behavior as fetchJson.
 *
 * @param {string} url - The URL to post data to.
 * @param {Object} body - The JSON body to send with the request.
 * @param {Record<string, string>} headers - Additional headers for the request.
 * @param {RequestOptions} [options] - Timeout/retry overrides.
 * @returns {Promise<T>} A promise that resolves with the parsed JSON data.
 * @throws {Error} If the network request fails or the response status is not OK.
 */
export async function postJson<T>(
  url: string,
  body: object,
  headers: Record<string, string>,
  options: RequestOptions = {}
): Promise<T> {
  return requestJson<T>(
    "POST",
    url,
    { "Content-Type": "application/json", ...headers },
    JSON.stringify(body),
    options
  );
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
