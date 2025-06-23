/**
 * tool-registry.ts - Central tool registration
 *
 * This file centralizes the registration of all tools provided by the Google Maps MCP server.
 * It imports tool definitions from their respective modules and exports them as a single array.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 * - All tool definition files (e.g., geocoding.ts, places.ts, etc.)
 *
 * @author Cline
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
/**
 * @constant ALL_TOOLS
 * @description An array containing all tool definitions exposed by this MCP server.
 */
export declare const ALL_TOOLS: readonly Tool[];
//# sourceMappingURL=tool-registry.d.ts.map