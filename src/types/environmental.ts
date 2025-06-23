/**
 * environmental.ts - Environmental data interfaces
 *
 * This file contains interfaces for environmental data APIs like weather, air quality, solar, and pollen.
 *
 * Dependencies: None
 *
 * @author Cline
 */

// ====================================
// Environmental Interfaces
// ====================================

/**
 * @interface WeatherResponse
 * @description Interface for weather API responses (e.g., Open-Meteo).
 */
export interface WeatherResponse {
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

/**
 * @interface AirQualityResponse
 * @description Interface for air quality API responses (e.g., Open-Meteo Air Quality).
 */
export interface AirQualityResponse {
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

/**
 * @interface SolarResponse
 * @description Interface for solar API responses (e.g., Open-Meteo Solar).
 */
export interface SolarResponse {
  current?: {
    time: string;
    global_tilted_irradiance: number;
    direct_normal_irradiance: number;
    diffuse_horizontal_irradiance: number;
    global_horizontal_irradiance: number;
  };
  hourly?: {
    time: string[];
    global_tilted_irradiance: number[];
    direct_normal_irradiance: number[];
    diffuse_horizontal_irradiance: number[];
    global_horizontal_irradiance: number[];
  };
}

/**
 * @interface PollenResponse
 * @description Interface for pollen API responses (e.g., Open-Meteo Air Quality).
 */
export interface PollenResponse {
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
