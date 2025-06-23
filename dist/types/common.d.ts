/**
 * common.ts - Common/shared interfaces
 *
 * This file contains interfaces that are common across different modules
 * within the Google Maps MCP server.
 *
 * Dependencies: None
 *
 * @author Cline
 */
/**
 * @interface GoogleMapsResponse
 * @description Base interface for Google Maps API responses.
 * @property {string} status - The status of the API request (e.g., "OK", "ZERO_RESULTS").
 * @property {string} [error_message] - An optional error message if the status is not "OK".
 */
export interface GoogleMapsResponse {
    status: string;
    error_message?: string;
}
/**
 * @interface ToolResponse
 * @description Standardized response format for MCP tools.
 * @property {Array<Object>} content - Array of content blocks, typically text.
 * @property {boolean} isError - Indicates if the response signifies an error.
 */
export interface ToolResponse {
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError: boolean;
}
//# sourceMappingURL=common.d.ts.map