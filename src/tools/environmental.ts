/**
 * environmental.ts - Open-Meteo environmental data tools
 *
 * Provides weather, air quality, solar irradiance, and pollen data via the
 * free Open-Meteo APIs. No API key is required for any of these endpoints.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ok, err, safe } from "../utils/respond.js";
import { getJson } from "../utils/http.js";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

const LATITUDE_DESC =
  "Latitude coordinate (-90 to 90). Use maps_geocode to get coordinates for an address or place name.";
const LONGITUDE_DESC =
  "Longitude coordinate (-180 to 180). Use maps_geocode to get coordinates for an address or place name.";

// ====================================
// WMO Weather Code Translation
// ====================================

/** Translate a WMO weather_code (used by Open-Meteo) into a human-readable description. */
function describeWeatherCode(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return descriptions[code] ?? `Unknown weather code (${code})`;
}

// ====================================
// Weather
// ====================================

interface WeatherApiResponse {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

export interface WeatherArgs {
  latitude: number;
  longitude: number;
  forecast_days?: number;
  include_hourly?: boolean;
}

export async function handleWeather(args: WeatherArgs): Promise<CallToolResult> {
  const { latitude, longitude, forecast_days = 3, include_hourly = false } = args;

  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m"
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code"
  );
  url.searchParams.set("forecast_days", forecast_days.toString());
  url.searchParams.set("timezone", "auto");

  if (include_hourly) {
    url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code");
  }

  let data: WeatherApiResponse;
  try {
    data = await getJson<WeatherApiResponse>(url.toString());
  } catch (error) {
    return err(
      `Weather request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const current = data.current
    ? { ...data.current, conditions: describeWeatherCode(data.current.weather_code) }
    : undefined;

  const daily = data.daily
    ? {
        ...data.daily,
        conditions: data.daily.weather_code.map(describeWeatherCode),
      }
    : undefined;

  return ok({
    location: { latitude, longitude },
    current,
    daily,
    ...(include_hourly && data.hourly ? { hourly: data.hourly } : {}),
  });
}

// ====================================
// Air Quality
// ====================================

interface AirQualityApiResponse {
  current?: {
    time: string;
    us_aqi: number;
    pm10: number;
    pm2_5: number;
    carbon_monoxide: number;
    nitrogen_dioxide: number;
    sulphur_dioxide: number;
    ozone: number;
  };
  hourly?: {
    time: string[];
    us_aqi: number[];
    pm10: number[];
    pm2_5: number[];
  };
}

export interface AirQualityArgs {
  latitude: number;
  longitude: number;
  forecast_days?: number;
}

export async function handleAirQuality(
  args: AirQualityArgs
): Promise<CallToolResult> {
  const { latitude, longitude, forecast_days = 1 } = args;

  const url = new URL(AIR_QUALITY_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set(
    "current",
    "us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
  );
  url.searchParams.set("hourly", "us_aqi,pm10,pm2_5");
  url.searchParams.set("forecast_days", forecast_days.toString());
  url.searchParams.set("timezone", "auto");

  let data: AirQualityApiResponse;
  try {
    data = await getJson<AirQualityApiResponse>(url.toString());
  } catch (error) {
    return err(
      `Air quality request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return ok({
    location: { latitude, longitude },
    current: data.current,
    hourly: data.hourly,
  });
}

// ====================================
// Solar
// ====================================

interface SolarApiResponse {
  current?: {
    time: string;
    global_tilted_irradiance: number;
    direct_normal_irradiance: number;
    diffuse_horizontal_irradiance: number;
  };
  hourly?: {
    time: string[];
    global_tilted_irradiance: number[];
    direct_normal_irradiance: number[];
    diffuse_horizontal_irradiance: number[];
    global_horizontal_irradiance: number[];
  };
}

export interface SolarArgs {
  latitude: number;
  longitude: number;
  tilt?: number;
  azimuth?: number;
  forecast_days?: number;
}

export async function handleSolar(args: SolarArgs): Promise<CallToolResult> {
  const { latitude, longitude, tilt = 0, azimuth = 180, forecast_days = 1 } = args;

  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set(
    "current",
    "global_tilted_irradiance,direct_normal_irradiance,diffuse_horizontal_irradiance"
  );
  url.searchParams.set(
    "hourly",
    "global_tilted_irradiance,direct_normal_irradiance,diffuse_horizontal_irradiance,global_horizontal_irradiance"
  );
  url.searchParams.set("forecast_days", forecast_days.toString());
  url.searchParams.set("tilt", tilt.toString());
  url.searchParams.set("azimuth", azimuth.toString());
  url.searchParams.set("timezone", "auto");

  let data: SolarApiResponse;
  try {
    data = await getJson<SolarApiResponse>(url.toString());
  } catch (error) {
    return err(
      `Solar request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return ok({
    location: { latitude, longitude },
    panel_config: { tilt, azimuth },
    current: data.current,
    hourly: data.hourly,
  });
}

// ====================================
// Pollen
// ====================================

interface PollenApiResponse {
  current?: {
    time: string;
    european_alder_pollen: number;
    birch_pollen: number;
    grass_pollen: number;
    mugwort_pollen: number;
    olive_pollen: number;
    ragweed_pollen: number;
  };
  daily?: {
    time: string[];
    european_alder_pollen_max: number[];
    birch_pollen_max: number[];
    grass_pollen_max: number[];
    mugwort_pollen_max: number[];
    olive_pollen_max: number[];
    ragweed_pollen_max: number[];
  };
}

export interface PollenArgs {
  latitude: number;
  longitude: number;
  forecast_days?: number;
}

export async function handlePollen(args: PollenArgs): Promise<CallToolResult> {
  const { latitude, longitude, forecast_days = 3 } = args;

  const url = new URL(AIR_QUALITY_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set(
    "current",
    "european_alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen"
  );
  url.searchParams.set(
    "daily",
    "european_alder_pollen_max,birch_pollen_max,grass_pollen_max,mugwort_pollen_max,olive_pollen_max,ragweed_pollen_max"
  );
  url.searchParams.set("forecast_days", forecast_days.toString());
  url.searchParams.set("timezone", "auto");

  let data: PollenApiResponse;
  try {
    data = await getJson<PollenApiResponse>(url.toString());
  } catch (error) {
    return err(
      `Pollen request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!data.current && !data.daily) {
    return err(
      "No pollen data returned for this location. Open-Meteo pollen data only covers Europe and " +
        "North America; this location may be outside that coverage area."
    );
  }

  return ok({
    location: { latitude, longitude },
    current: data.current,
    daily: data.daily,
  });
}

// ====================================
// Registration
// ====================================

export function registerEnvironmentalTools(server: McpServer): void {
  server.registerTool(
    "maps_weather",
    {
      title: "Get Weather Forecast",
      description:
        "Get current weather conditions and a multi-day forecast for a location, useful for trip " +
        "and camping planning. Data source: Open-Meteo (free, no API key required).\n\n" +
        "Args:\n" +
        `  latitude: ${LATITUDE_DESC}\n` +
        `  longitude: ${LONGITUDE_DESC}\n` +
        "  forecast_days: Number of forecast days, 1-16 (default: 3).\n" +
        "  include_hourly: Include hourly temperature/precipitation-probability/weather-code forecast (default: false).\n\n" +
        "Returns:\n" +
        "  location, current conditions (temperature, humidity, apparent temperature, precipitation, " +
        "wind, weather_code, and a human-readable 'conditions' description), daily forecast (highs/lows, " +
        "precipitation sum, weather_code + 'conditions' array), and hourly data if requested.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe(LATITUDE_DESC),
        longitude: z.number().min(-180).max(180).describe(LONGITUDE_DESC),
        forecast_days: z
          .number()
          .int()
          .min(1)
          .max(16)
          .optional()
          .describe("Number of forecast days (1-16, default: 3)"),
        include_hourly: z
          .boolean()
          .optional()
          .describe("Include hourly forecast (default: false)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleWeather)
  );

  server.registerTool(
    "maps_air_quality",
    {
      title: "Get Air Quality",
      description:
        "Get current air quality (US AQI and pollutant concentrations) and an hourly forecast for a " +
        "location, useful for evaluating conditions in wilderness areas or cities. Data source: " +
        "Open-Meteo Air Quality API (free, no API key required).\n\n" +
        "Args:\n" +
        `  latitude: ${LATITUDE_DESC}\n` +
        `  longitude: ${LONGITUDE_DESC}\n` +
        "  forecast_days: Number of forecast days, 1-5 (default: 1).\n\n" +
        "Returns:\n" +
        "  location, current conditions (us_aqi, pm10, pm2_5, carbon_monoxide, nitrogen_dioxide, " +
        "sulphur_dioxide, ozone), and hourly us_aqi/pm10/pm2_5 series.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe(LATITUDE_DESC),
        longitude: z.number().min(-180).max(180).describe(LONGITUDE_DESC),
        forecast_days: z
          .number()
          .int()
          .min(1)
          .max(5)
          .optional()
          .describe("Number of forecast days (1-5, default: 1)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleAirQuality)
  );

  server.registerTool(
    "maps_solar",
    {
      title: "Get Solar Irradiance",
      description:
        "Get current and hourly solar irradiance data for a location and panel configuration, useful " +
        "for solar power planning (e.g. at campsites or off-grid installations). Data source: " +
        "Open-Meteo (free, no API key required).\n\n" +
        "Args:\n" +
        `  latitude: ${LATITUDE_DESC}\n` +
        `  longitude: ${LONGITUDE_DESC}\n` +
        "  tilt: Solar panel tilt angle in degrees, 0-90 (default: 0).\n" +
        "  azimuth: Solar panel azimuth angle in degrees, 0=north, 180=south (default: 180).\n" +
        "  forecast_days: Number of forecast days, 1-5 (default: 1).\n\n" +
        "Returns:\n" +
        "  location, panel_config (tilt, azimuth), current irradiance (global_tilted_irradiance, " +
        "direct_normal_irradiance, diffuse_horizontal_irradiance), and hourly irradiance series " +
        "(including global_horizontal_irradiance).",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe(LATITUDE_DESC),
        longitude: z.number().min(-180).max(180).describe(LONGITUDE_DESC),
        tilt: z
          .number()
          .min(0)
          .max(90)
          .optional()
          .describe("Solar panel tilt angle in degrees (0-90, default: 0)"),
        azimuth: z
          .number()
          .optional()
          .describe("Solar panel azimuth angle in degrees (default: 180 for south-facing)"),
        forecast_days: z
          .number()
          .int()
          .min(1)
          .max(5)
          .optional()
          .describe("Number of forecast days (1-5, default: 1)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleSolar)
  );

  server.registerTool(
    "maps_pollen",
    {
      title: "Get Pollen Levels",
      description:
        "Get current and daily-max pollen levels (alder, birch, grass, mugwort, olive, ragweed) for a " +
        "location, useful for planning outdoor activities around allergy risk. Data source: Open-Meteo " +
        "Air Quality API (free, no API key required). Note: Open-Meteo pollen data only covers Europe " +
        "and North America; requests for other regions may return empty data.\n\n" +
        "Args:\n" +
        `  latitude: ${LATITUDE_DESC}\n` +
        `  longitude: ${LONGITUDE_DESC}\n` +
        "  forecast_days: Number of forecast days, 1-5 (default: 3).\n\n" +
        "Returns:\n" +
        "  location, current pollen concentrations by species, and daily max pollen concentrations by species.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe(LATITUDE_DESC),
        longitude: z.number().min(-180).max(180).describe(LONGITUDE_DESC),
        forecast_days: z
          .number()
          .int()
          .min(1)
          .max(5)
          .optional()
          .describe("Number of forecast days (1-5, default: 3)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handlePollen)
  );
}
