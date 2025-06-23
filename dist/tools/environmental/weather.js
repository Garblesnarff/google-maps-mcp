/**
 * weather.ts - Weather tools
 *
 * This file contains the tool definition for getting weather conditions and forecasts.
 *
 * Dependencies:
 * - @modelcontextprotocol/sdk/types.js (for Tool)
 *
 * @author Cline
 */
// ====================================
// Weather Tools
// ====================================
/**
 * @constant WEATHER_TOOL
 * @description Tool definition for getting current weather conditions and forecasts for camping trip planning.
 */
export const WEATHER_TOOL = {
    name: "maps_weather",
    description: "Get current weather conditions and forecasts for camping trip planning",
    inputSchema: {
        type: "object",
        properties: {
            latitude: {
                type: "number",
                description: "Latitude coordinate"
            },
            longitude: {
                type: "number",
                description: "Longitude coordinate"
            },
            forecast_days: {
                type: "number",
                description: "Number of forecast days (1-16, default: 3)",
                default: 3
            },
            include_hourly: {
                type: "boolean",
                description: "Include hourly forecast (default: false)",
                default: false
            }
        },
        required: ["latitude", "longitude"]
    }
};
//# sourceMappingURL=weather.js.map