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
  handleFrostDates,
  handleGrowingDegreeDays,
  handleSoilConditions,
  handleDayLength,
  handleGardenClimate,
} from "../tools/garden.js";

beforeEach(() => {
  installFetchMock();
});

afterEach(() => {
  resetFetchMock();
  restoreFetchMock();
});

// ====================================
// Synthetic archive data helpers
// ====================================

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Build daily time/tmin/tmax arrays spanning every calendar day in [startYear, endYear]. */
function buildArchiveYears(
  startYear: number,
  endYear: number,
  tminFor: (dateStr: string) => number,
  tmaxFor: (dateStr: string) => number = () => 20
): { time: string[]; temperature_2m_min: number[]; temperature_2m_max: number[] } {
  const time: string[] = [];
  const temperature_2m_min: number[] = [];
  const temperature_2m_max: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const days = m === 2 && isLeap(y) ? 29 : MONTH_DAYS[m - 1];
      for (let d = 1; d <= days; d++) {
        const dateStr = `${y}-${pad2(m)}-${pad2(d)}`;
        time.push(dateStr);
        temperature_2m_min.push(tminFor(dateStr));
        temperature_2m_max.push(tmaxFor(dateStr));
      }
    }
  }
  return { time, temperature_2m_min, temperature_2m_max };
}

function parseJson(result: { content: Array<{ type: string; text?: string }> }): any {
  return JSON.parse((result.content[0] as { type: "text"; text: string }).text);
}

// ====================================
// handleFrostDates
// ====================================

describe("handleFrostDates", () => {
  test("exact per-year and average frost dates from a synthetic single year", async () => {
    // Only 2025-04-15 and 2025-10-10 dip to -2C; every other day is 5C.
    const archive = buildArchiveYears(2025, 2025, (d) => {
      if (d === "2025-04-15" || d === "2025-10-10") return -2;
      return 5;
    });
    mockRoute("/v1/archive", () =>
      jsonResponse({
        daily: {
          time: archive.time,
          temperature_2m_min: archive.temperature_2m_min,
          temperature_2m_max: archive.temperature_2m_max,
        },
      })
    );

    const result = await handleFrostDates({
      latitude: 45,
      longitude: -100,
      years: 1,
      frost_threshold_c: 0,
    });
    assert.equal(result.isError, false);

    const parsed = parseJson(result);
    assert.equal(parsed.years_analyzed, 1);
    assert.equal(parsed.frost_free_climate, false);
    assert.equal(parsed.hemisphere, "northern");

    assert.equal(parsed.per_year.length, 1);
    assert.deepEqual(parsed.per_year[0], {
      frost_year: "2025",
      last_spring_frost: "2025-04-15",
      first_fall_frost: "2025-10-10",
      frost_free_days: 178,
    });

    assert.equal(parsed.last_spring_frost.average, "Apr 15");
    assert.equal(parsed.last_spring_frost.earliest, "Apr 15");
    assert.equal(parsed.last_spring_frost.latest, "Apr 15");
    assert.equal(parsed.first_fall_frost.average, "Oct 10");
    assert.equal(parsed.first_fall_frost.earliest, "Oct 10");
    assert.equal(parsed.first_fall_frost.latest, "Oct 10");
    assert.equal(parsed.average_frost_free_season_days, 178);
  });

  test("frost-free climate: tmin never drops to the threshold", async () => {
    const archive = buildArchiveYears(2025, 2025, () => 10);
    mockRoute("/v1/archive", () =>
      jsonResponse({
        daily: {
          time: archive.time,
          temperature_2m_min: archive.temperature_2m_min,
          temperature_2m_max: archive.temperature_2m_max,
        },
      })
    );

    const result = await handleFrostDates({
      latitude: 20,
      longitude: -80,
      years: 1,
      frost_threshold_c: 0,
    });
    assert.equal(result.isError, false);

    const parsed = parseJson(result);
    assert.equal(parsed.frost_free_climate, true);
    assert.equal(parsed.last_spring_frost.average, null);
    assert.equal(parsed.first_fall_frost.average, null);
    assert.equal(parsed.average_frost_free_season_days, null);
    assert.deepEqual(parsed.per_year[0], {
      frost_year: "2025",
      last_spring_frost: null,
      first_fall_frost: null,
      frost_free_days: null,
    });
  });
});

// ====================================
// handleGrowingDegreeDays
// ====================================

describe("handleGrowingDegreeDays", () => {
  test("annual GDD for a constant tmax=25/tmin=15 year equals 10/day * days", async () => {
    const archive = buildArchiveYears(
      2025,
      2025,
      () => 15,
      () => 25
    );
    mockRoute("/v1/archive", () =>
      jsonResponse({
        daily: {
          time: archive.time,
          temperature_2m_min: archive.temperature_2m_min,
          temperature_2m_max: archive.temperature_2m_max,
        },
      })
    );

    const result = await handleGrowingDegreeDays({
      latitude: 45,
      longitude: -100,
      years: 1,
      base_temp_c: 10,
      upper_cap_c: 30,
    });
    assert.equal(result.isError, false);

    const parsed = parseJson(result);
    assert.equal(parsed.years_analyzed, 1);
    assert.equal(parsed.per_year.length, 1);
    assert.equal(parsed.per_year[0].year, 2025);
    assert.equal(parsed.per_year[0].days_with_data, 365);
    // (25 + 15) / 2 - 10 = 10 GDD/day * 365 days = 3650
    assert.equal(parsed.per_year[0].total_gdd, 3650);
    assert.equal(parsed.average_annual_gdd, 3650);
    assert.equal(parsed.min_year.total_gdd, 3650);
    assert.equal(parsed.max_year.total_gdd, 3650);
  });
});

// ====================================
// handleSoilConditions
// ====================================

describe("handleSoilConditions", () => {
  test("happy path: current reading + daily min/max/mean summary", async () => {
    mockRoute("/v1/forecast", () =>
      jsonResponse({
        hourly: {
          time: ["2020-01-01T00:00", "2020-01-01T12:00", "2020-01-02T00:00", "2020-01-02T12:00"],
          soil_temperature_0cm: [4, 5, 6, 7],
          soil_temperature_6cm: [11, 15, 9, 13],
          soil_temperature_18cm: [16, 17, 18, 19],
          soil_moisture_0_to_1cm: [0.2, 0.4, 0.1, 0.3],
          soil_moisture_3_to_9cm: [0.25, 0.35, 0.15, 0.28],
          soil_moisture_9_to_27cm: [0.3, 0.32, 0.2, 0.31],
        },
      })
    );

    const result = await handleSoilConditions({ latitude: 45, longitude: -100, forecast_days: 2 });
    assert.equal(result.isError, false);

    const parsed = parseJson(result);
    // All mocked timestamps are in the past, so "current" falls back to the last entry.
    assert.equal(parsed.current.time, "2020-01-02T12:00");
    assert.equal(parsed.current.soil_temperature_6cm_c, 13);

    assert.equal(parsed.daily.length, 2);
    assert.equal(parsed.daily[0].date, "2020-01-01");
    assert.equal(parsed.daily[0].soil_temp_6cm_min_c, 11);
    assert.equal(parsed.daily[0].soil_temp_6cm_max_c, 15);
    assert.ok(Math.abs(parsed.daily[0].soil_moisture_0_to_1cm_mean - 0.3) < 1e-9);
    assert.equal(parsed.daily[1].date, "2020-01-02");
    assert.equal(parsed.daily[1].soil_temp_6cm_min_c, 9);
    assert.equal(parsed.daily[1].soil_temp_6cm_max_c, 13);
    assert.ok(Math.abs(parsed.daily[1].soil_moisture_0_to_1cm_mean - 0.2) < 1e-9);

    assert.ok(parsed.planting_guidance);
  });
});

// ====================================
// handleDayLength
// ====================================

describe("handleDayLength", () => {
  test("happy path: per-day sunrise/sunset/daylight and a losing trend", async () => {
    mockRoute("/v1/forecast", () =>
      jsonResponse({
        daily: {
          time: ["2026-07-23", "2026-07-24"],
          sunrise: ["2026-07-23T05:58", "2026-07-24T05:59"],
          sunset: ["2026-07-23T20:32", "2026-07-24T20:31"],
          daylight_duration: [54000, 53940],
          sunshine_duration: [46800, 46800],
        },
      })
    );

    const result = await handleDayLength({ latitude: 45, longitude: -100, days: 2 });
    assert.equal(result.isError, false);

    const parsed = parseJson(result);
    assert.equal(parsed.daily.length, 2);
    assert.equal(parsed.daily[0].sunrise, "05:58");
    assert.equal(parsed.daily[0].sunset, "20:32");
    assert.equal(parsed.daily[0].daylight_hours, "15:00");
    assert.equal(parsed.daily[1].daylight_hours, "14:59");
    assert.equal(parsed.trend, "losing ~1.0 min/day");
  });
});

// ====================================
// handleGardenClimate (composite)
// ====================================

describe("handleGardenClimate", () => {
  test("returns zone/frost/GDD/soil/day-length sections with correct hardiness zone math", async () => {
    // Ten years (2016-2025) where every year's single coldest day is
    // Jan 15 at -26.1C (an unambiguous mid-band value -> zone 5b), and
    // every other day is a mild 5C (never below zero elsewhere, and never
    // in the northern-hemisphere fall window Jul-Dec).
    const archive = buildArchiveYears(
      2016,
      2025,
      (d) => (d.slice(5) === "01-15" ? -26.1 : 5),
      () => 20
    );
    mockRoute("/v1/archive", () =>
      jsonResponse({
        daily: {
          time: archive.time,
          temperature_2m_min: archive.temperature_2m_min,
          temperature_2m_max: archive.temperature_2m_max,
        },
      })
    );
    mockRoute("/v1/forecast", () =>
      jsonResponse({
        hourly: {
          time: ["2020-01-01T00:00", "2020-01-01T12:00"],
          soil_temperature_6cm: [8, 12],
        },
        daily: {
          time: ["2026-07-23"],
          sunrise: ["2026-07-23T06:00"],
          sunset: ["2026-07-23T20:00"],
          daylight_duration: [50400],
        },
      })
    );

    const result = await handleGardenClimate({ latitude: 45, longitude: -100 });
    assert.equal(result.isError, false);

    const parsed = parseJson(result);

    // Hardiness zone math: avg annual extreme min = -26.1C = -14.98F, rounds
    // to -15.0F -> zone 5b per the code's 10F-zone/5F-half-zone bands.
    assert.equal(parsed.hardiness_zone.years_analyzed, 10);
    assert.equal(parsed.hardiness_zone.average_annual_extreme_min_c, -26.1);
    assert.equal(parsed.hardiness_zone.average_annual_extreme_min_f, -15);
    assert.equal(parsed.hardiness_zone.approximate_zone, "5b");

    // Frost dates section: present, and the only frost day (Jan 15) falls
    // in the northern spring window, never the fall window.
    assert.equal(parsed.frost_dates.threshold_c, 0);
    assert.equal(parsed.frost_dates.frost_free_climate, false);
    assert.equal(parsed.frost_dates.last_spring_frost_average, "Jan 15");
    assert.equal(parsed.frost_dates.first_fall_frost_average, null);
    assert.equal(parsed.frost_dates.years_analyzed, 10);

    // GDD section: present and a positive average.
    assert.equal(parsed.growing_degree_days.base_temp_c, 10);
    assert.equal(parsed.growing_degree_days.years_analyzed, 10);
    assert.equal(parsed.growing_degree_days.average_annual_gdd, 910.8);
    assert.ok(parsed.growing_degree_days.reference);

    // Current conditions section: soil temp + today's day length.
    assert.equal(parsed.current_conditions.soil_temperature_6cm_c, 12);
    assert.equal(parsed.current_conditions.today_day_length.date, "2026-07-23");
    assert.equal(parsed.current_conditions.today_day_length.sunrise, "06:00");
    assert.equal(parsed.current_conditions.today_day_length.sunset, "20:00");
    assert.equal(parsed.current_conditions.today_day_length.daylight_hours, "14:00");
  });
});
