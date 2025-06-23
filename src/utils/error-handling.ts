/**
 * error-handling.ts - Error handling utilities
 *
 * This file provides utility functions for consistent error handling
 * and response formatting for MCP server tools.
 *
 * Dependencies: None
 *
 * @author Cline
 */

import { ToolResponse } from "../types/common.js";

// ====================================
// Error Handling Utilities
// ====================================

/**
 * Creates a standardized error response for MCP tools.
 *
 * @param {string} message - The error message.
 * @returns {ToolResponse} A ToolResponse object indicating an error.
 */
export function createErrorResponse(message: string): ToolResponse {
  return {
    content: [{
      type: "text",
      text: `Error: ${message}`
    }],
    isError: true
  };
}

/**
 * Wraps an asynchronous function with error handling,
 * returning a standardized ToolResponse.
 *
 * @param {Function} fn - The asynchronous function to wrap.
 * @returns {Function} A new function that returns a ToolResponse.
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R | ToolResponse>
): (...args: T) => Promise<ToolResponse> {
  return async (...args: T): Promise<ToolResponse> => {
    try {
      const result = await fn(...args);
      // If the function already returns a ToolResponse (e.g., an error response), return it directly
      if (typeof result === 'object' && result !== null && 'isError' in result) {
        return result as ToolResponse;
      }
      // Otherwise, wrap the successful result in a ToolResponse
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }],
        isError: false
      };
    } catch (error) {
      return createErrorResponse(error instanceof Error ? error.message : String(error));
    }
  };
}
