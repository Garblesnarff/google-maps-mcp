/**
 * environment.ts - Environment variables & API keys
 *
 * This file handles the retrieval of environment variables, specifically the Google Maps API key.
 * It ensures that the necessary API key is present before the server starts.
 *
 * Dependencies: None
 *
 * @author Cline
 */
// ====================================
// Environment Configuration
// ====================================
/**
 * Retrieves the Google Maps API key from environment variables.
 * If the key is not set, it logs an error and exits the process.
 *
 * @returns {string} The Google Maps API key.
 */
function getApiKey() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("GOOGLE_MAPS_API_KEY environment variable is not set");
        process.exit(1);
    }
    return apiKey;
}
/**
 * The Google Maps API Key.
 */
export const GOOGLE_MAPS_API_KEY = getApiKey();
//# sourceMappingURL=environment.js.map