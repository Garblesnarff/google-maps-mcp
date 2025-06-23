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
/**
 * Creates a standardized error response for MCP tools.
 *
 * @param {string} message - The error message.
 * @returns {ToolResponse} A ToolResponse object indicating an error.
 */
export declare function createErrorResponse(message: string): ToolResponse;
/**
 * Wraps an asynchronous function with error handling,
 * returning a standardized ToolResponse.
 *
 * @param {Function} fn - The asynchronous function to wrap.
 * @returns {Function} A new function that returns a ToolResponse.
 */
export declare function withErrorHandling<T extends any[], R>(fn: (...args: T) => Promise<R | ToolResponse>): (...args: T) => Promise<ToolResponse>;
//# sourceMappingURL=error-handling.d.ts.map