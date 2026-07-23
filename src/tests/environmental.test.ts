process.env.GOOGLE_MAPS_API_KEY = "test-key-123";

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  installFetchMock,
  restoreFetchMock,
  resetFetchMock,
  mockRoute,
  jsonResponse,
} from "./fetch-mock.js";

import {
  handleWeather,
  handleAirQuality,
  handleSolar,
  handlePollen,
} from "../tools/environmental.js";

beforeEach(() => {
  installFetchMock();
});

afterEach(() => {
  resetFetchMock();
  restoreFetchMock();
});

describe("handleWeather", () => {
  test("happy path: derives human-readable conditions from weather_code", async () => {
    mockRoute("api.open-meteo.com/v1/forecast", () =>
      jsonResponse({
        current: {
          time: "2026-07-23T12:00",
          temperature_2m: 22.5,
          relative_humidity_2m: 40,
          apparent_temperature: 21,
          precipitation: 0,
          weather_code: 1,
          wind_speed_10m: 8,
          wind_direction_10m: 270,
        },
        daily: {
          time: ["2026-07-23", "2026-07-24"],
          temperature_2m_max: [25, 26],
          temperature_2m_min: [12, 13],
          precipitation_sum: [0, 0.2],
          weather_code: [1, 61],
        },
      })
    );

    const result = await handleWeather({ latitude: 44.05, longitude: -121.31 });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.current.conditions, "Mainly clear");
    assert.deepEqual(parsed.daily.conditions, ["Mainly clear", "Slight rain"]);
  });
});

describe("handleAirQuality", () => {
  test("happy path: returns current AQI/pollutant fields", async () => {
    mockRoute("air-quality-api.open-meteo.com/v1/air-quality", () =>
      jsonResponse({
        current: {
          time: "2026-07-23T12:00",
          us_aqi: 42,
          pm10: 12.3,
          pm2_5: 5.1,
          carbon_monoxide: 200,
          nitrogen_dioxide: 10,
          sulphur_dioxide: 2,
          ozone: 60,
        },
        hourly: {
          time: ["2026-07-23T12:00"],
          us_aqi: [42],
          pm10: [12.3],
          pm2_5: [5.1],
        },
      })
    );

    const result = await handleAirQuality({ latitude: 44.05, longitude: -121.31 });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.current.us_aqi, 42);
    assert.equal(parsed.hourly.pm2_5[0], 5.1);
  });
});

describe("handleSolar", () => {
  test("happy path: echoes panel_config and returns irradiance fields", async () => {
    mockRoute("api.open-meteo.com/v1/forecast", () =>
      jsonResponse({
        current: {
          time: "2026-07-23T12:00",
          global_tilted_irradiance: 650,
          direct_normal_irradiance: 800,
          diffuse_horizontal_irradiance: 120,
        },
        hourly: {
          time: ["2026-07-23T12:00"],
          global_tilted_irradiance: [650],
          direct_normal_irradiance: [800],
          diffuse_horizontal_irradiance: [120],
          global_horizontal_irradiance: [700],
        },
      })
    );

    const result = await handleSolar({ latitude: 44.05, longitude: -121.31, tilt: 30, azimuth: 200 });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.deepEqual(parsed.panel_config, { tilt: 30, azimuth: 200 });
    assert.equal(parsed.current.global_tilted_irradiance, 650);
  });
});

describe("handlePollen", () => {
  test("happy path: returns current and daily pollen concentrations", async () => {
    mockRoute("air-quality-api.open-meteo.com/v1/air-quality", () =>
      jsonResponse({
        current: {
          time: "2026-07-23T12:00",
          european_alder_pollen: 0,
          birch_pollen: 5,
          grass_pollen: 20,
          mugwort_pollen: 0,
          olive_pollen: 0,
          ragweed_pollen: 1,
        },
        daily: {
          time: ["2026-07-23"],
          european_alder_pollen_max: [0],
          birch_pollen_max: [6],
          grass_pollen_max: [25],
          mugwort_pollen_max: [0],
          olive_pollen_max: [0],
          ragweed_pollen_max: [2],
        },
      })
    );

    const result = await handlePollen({ latitude: 44.05, longitude: -121.31 });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.current.grass_pollen, 20);
    assert.equal(parsed.daily.grass_pollen_max[0], 25);
  });
});
