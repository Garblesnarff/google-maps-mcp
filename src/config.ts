/**
 * config.ts - Environment configuration
 *
 * API key is read lazily so the module can be imported in tests
 * without the environment variable being set.
 */

export function getApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY environment variable is not set. " +
        "Get a key at https://console.cloud.google.com and set it in your MCP client config."
    );
  }
  return apiKey;
}

/**
 * Optional directory for saving generated map/street-view images.
 * When unset, images are returned inline only (as MCP image content).
 */
export function getImageDir(): string | undefined {
  return process.env.GOOGLE_MAPS_IMAGE_DIR || undefined;
}
