/**
 * garden.ts - Garden and climate planning tools
 *
 * Provides frost dates, growing degree days, soil conditions, day length, and a
 * composite garden-climate summary, all derived from the free Open-Meteo
 * historical archive (ERA5 reanalysis) and forecast APIs. No API key is
 * required for any of these endpoints. Historical/derived climate values
 * (frost dates, GDD, hardiness zone) are approximations computed from ERA5
 * reanalysis grid data, not from ground station observations or the official
 * USDA hardiness zone raster.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ok, err, safe } from "../utils/respond.js";
import { getJson } from "../utils/http.js";

const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const LATITUDE_DESC =
  "Latitude coordinate (-90 to 90). Use maps_geocode to get coordinates for an address or place name.";
const LONGITUDE_DESC =
  "Longitude coordinate (-180 to 180). Use maps_geocode to get coordinates for an address or place name.";

// ====================================
// Shared types & helpers
// ====================================

interface ArchiveDailyResponse {
  daily?: {
    time: string[];
    temperature_2m_min: (number | null)[];
    temperature_2m_max: (number | null)[];
  };
}

/** Format a Date as YYYY-MM-DD (UTC, since we only care about calendar dates). */
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Fetch daily tmin/tmax from the Open-Meteo historical archive for a date range. */
async function fetchArchiveDaily(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<{ time: string[]; tmin: (number | null)[]; tmax: (number | null)[] }> {
  const url = new URL(ARCHIVE_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("daily", "temperature_2m_min,temperature_2m_max");
  url.searchParams.set("timezone", "auto");

  const data = await getJson<ArchiveDailyResponse>(url.toString());
  if (!data.daily) {
    throw new Error("No historical daily data returned for this location.");
  }
  return {
    time: data.daily.time,
    tmin: data.daily.temperature_2m_min,
    tmax: data.daily.temperature_2m_max,
  };
}

/** Last full calendar year (archive data typically lags ~5 days behind real time). */
function lastCompleteYear(): number {
  return new Date().getUTCFullYear() - 1;
}

/** Archive queries should end a few days before "now" to avoid missing recent data. */
function safeArchiveEndDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return fmtDate(d);
}

/** Day-of-year (1-366) for a YYYY-MM-DD date string, using a fixed non-leap reference year for averaging. */
function dateToDayOfYear(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86_400_000) + 1;
}

/** Convert an average day-of-year (using a 365-day reference) back to an approximate "Month Day" string. */
function dayOfYearToMonthDay(doy: number): string {
  const rounded = Math.round(doy);
  // Use a fixed non-leap reference year (2001) to render month/day.
  const d = new Date(Date.UTC(2001, 0, 1));
  d.setUTCDate(d.getUTCDate() + Math.max(0, rounded - 1));
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// ====================================
// Frost dates - shared computation
// ====================================

export interface FrostYearResult {
  frost_year: string;
  last_spring_frost: string | null;
  first_fall_frost: string | null;
  frost_free_days: number | null;
}

export interface FrostDatesComputation {
  years_analyzed: number;
  frost_free_climate: boolean;
  last_spring_frost: {
    average: string | null;
    earliest: string | null;
    latest: string | null;
  };
  first_fall_frost: {
    average: string | null;
    earliest: string | null;
    latest: string | null;
  };
  average_frost_free_season_days: number | null;
  per_year: FrostYearResult[];
}

/**
 * Compute frost dates for `years` complete years, hemisphere-aware.
 * Northern hemisphere: spring = Jan-Jun, fall = Jul-Dec of the same calendar year.
 * Southern hemisphere: frost year runs Jul(year-1)-Jun(year); spring = Jul-Dec (year-1 half),
 * fall = Jan-Jun (year half). We label each "frost year" by the calendar year containing spring.
 */
async function computeFrostDates(
  latitude: number,
  longitude: number,
  years: number,
  thresholdC: number
): Promise<FrostDatesComputation> {
  const northern = latitude >= 0;
  const endYear = lastCompleteYear();
  const startYear = endYear - years + 1;

  // Fetch a single contiguous range covering all years (with a 6-month pad on
  // each side for the southern-hemisphere frost-year that spans Jul-Jun).
  const rangeStart = northern ? `${startYear}-01-01` : `${startYear - 1}-07-01`;
  const rangeEnd = northern ? `${endYear}-12-31` : `${endYear}-06-30`;

  const { time, tmin } = await fetchArchiveDaily(latitude, longitude, rangeStart, rangeEnd);

  const perYear: FrostYearResult[] = [];
  const springDoys: number[] = [];
  const fallDoys: number[] = [];
  const seasonLengths: number[] = [];
  let anyFrost = false;

  for (let y = startYear; y <= endYear; y++) {
    // Build the spring window and fall window date strings for this frost year.
    let springStart: string, springEnd: string, fallStart: string, fallEnd: string;
    if (northern) {
      springStart = `${y}-01-01`;
      springEnd = `${y}-06-30`;
      fallStart = `${y}-07-01`;
      fallEnd = `${y}-12-31`;
    } else {
      // Frost year y: spring = Jul-Dec of (y-1); fall = Jan-Jun of y.
      springStart = `${y - 1}-07-01`;
      springEnd = `${y - 1}-12-31`;
      fallStart = `${y}-01-01`;
      fallEnd = `${y}-06-30`;
    }

    // Last spring frost: scan spring window forward, keep the last frost day found.
    let lastSpring: string | null = null;
    for (let i = 0; i < time.length; i++) {
      const t = time[i];
      const v = tmin[i];
      if (t < springStart || t > springEnd) continue;
      if (v === null || v === undefined) continue;
      if (v <= thresholdC) {
        lastSpring = t;
        anyFrost = true;
      }
    }

    // First fall frost: scan fall window forward, keep the first frost day found.
    let firstFall: string | null = null;
    for (let i = 0; i < time.length; i++) {
      const t = time[i];
      const v = tmin[i];
      if (t < fallStart || t > fallEnd) continue;
      if (v === null || v === undefined) continue;
      if (v <= thresholdC) {
        firstFall = t;
        anyFrost = true;
        break;
      }
    }

    let frostFreeDays: number | null = null;
    if (lastSpring && firstFall) {
      const a = Date.parse(lastSpring + "T00:00:00Z");
      const b = Date.parse(firstFall + "T00:00:00Z");
      frostFreeDays = Math.round((b - a) / 86_400_000);
      seasonLengths.push(frostFreeDays);
    }

    if (lastSpring) springDoys.push(dateToDayOfYear(northern ? lastSpring : `2001-${lastSpring.slice(5)}`));
    if (firstFall) fallDoys.push(dateToDayOfYear(northern ? firstFall : `2001-${firstFall.slice(5)}`));

    perYear.push({
      frost_year: northern ? `${y}` : `${y - 1}-${y}`,
      last_spring_frost: lastSpring,
      first_fall_frost: firstFall,
      frost_free_days: frostFreeDays,
    });
  }

  const avg = (arr: number[]): number | null =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const springAvg = avg(springDoys);
  const fallAvg = avg(fallDoys);

  return {
    years_analyzed: perYear.length,
    frost_free_climate: !anyFrost,
    last_spring_frost: {
      average: springAvg !== null ? dayOfYearToMonthDay(springAvg) : null,
      earliest: springDoys.length ? dayOfYearToMonthDay(Math.min(...springDoys)) : null,
      latest: springDoys.length ? dayOfYearToMonthDay(Math.max(...springDoys)) : null,
    },
    first_fall_frost: {
      average: fallAvg !== null ? dayOfYearToMonthDay(fallAvg) : null,
      earliest: fallDoys.length ? dayOfYearToMonthDay(Math.min(...fallDoys)) : null,
      latest: fallDoys.length ? dayOfYearToMonthDay(Math.max(...fallDoys)) : null,
    },
    average_frost_free_season_days: avg(seasonLengths),
    per_year: perYear,
  };
}

export interface FrostDatesArgs {
  latitude: number;
  longitude: number;
  years?: number;
  frost_threshold_c?: number;
}

export async function handleFrostDates(args: FrostDatesArgs): Promise<CallToolResult> {
  const { latitude, longitude, years = 10, frost_threshold_c = 0 } = args;

  let result: FrostDatesComputation;
  try {
    result = await computeFrostDates(latitude, longitude, years, frost_threshold_c);
  } catch (error) {
    return err(
      `Frost dates request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return ok({
    location: { latitude, longitude },
    frost_threshold_c,
    hemisphere: latitude >= 0 ? "northern" : "southern",
    note:
      "Dates are approximations derived from ERA5 reanalysis grid data (Open-Meteo historical archive), " +
      "not local ground station observations. Actual microclimate frost risk can vary.",
    ...result,
  });
}

// ====================================
// Growing degree days - shared computation
// ====================================

export interface GddYearResult {
  year: number;
  total_gdd: number;
  days_with_data: number;
}

export interface GddComputation {
  years_analyzed: number;
  average_annual_gdd: number | null;
  min_year: GddYearResult | null;
  max_year: GddYearResult | null;
  per_year: GddYearResult[];
  year_to_date: {
    as_of_date: string;
    gdd_so_far: number;
  } | null;
}

/** GDD for a single day using the simple daily-average method with an upper cap on tmax. */
function dailyGdd(tmin: number, tmax: number, baseC: number, capC: number): number {
  const cappedMax = Math.min(tmax, capC);
  const avg = (cappedMax + tmin) / 2;
  return Math.max(0, avg - baseC);
}

async function computeGdd(
  latitude: number,
  longitude: number,
  years: number,
  baseC: number,
  capC: number
): Promise<GddComputation> {
  const endYear = lastCompleteYear();
  const startYear = endYear - years + 1;

  const { time, tmin, tmax } = await fetchArchiveDaily(
    latitude,
    longitude,
    `${startYear}-01-01`,
    `${endYear}-12-31`
  );

  const byYear = new Map<number, { total: number; count: number }>();
  for (let i = 0; i < time.length; i++) {
    const tMinV = tmin[i];
    const tMaxV = tmax[i];
    if (tMinV === null || tMinV === undefined || tMaxV === null || tMaxV === undefined) continue;
    const year = Number(time[i].slice(0, 4));
    const gdd = dailyGdd(tMinV, tMaxV, baseC, capC);
    const entry = byYear.get(year) ?? { total: 0, count: 0 };
    entry.total += gdd;
    entry.count += 1;
    byYear.set(year, entry);
  }

  const perYear: GddYearResult[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const entry = byYear.get(y);
    if (entry) {
      perYear.push({ year: y, total_gdd: Math.round(entry.total * 10) / 10, days_with_data: entry.count });
    }
  }

  const totals = perYear.map((p) => p.total_gdd);
  const average = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : null;
  const minYear = perYear.length
    ? perYear.reduce((a, b) => (a.total_gdd <= b.total_gdd ? a : b))
    : null;
  const maxYear = perYear.length
    ? perYear.reduce((a, b) => (a.total_gdd >= b.total_gdd ? a : b))
    : null;

  // Year-to-date GDD for the current calendar year, through the latest available archive date.
  let yearToDate: GddComputation["year_to_date"] = null;
  try {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const endDate = safeArchiveEndDate();
    if (endDate.slice(0, 4) === String(currentYear)) {
      const ytd = await fetchArchiveDaily(latitude, longitude, `${currentYear}-01-01`, endDate);
      let total = 0;
      for (let i = 0; i < ytd.time.length; i++) {
        const tMinV = ytd.tmin[i];
        const tMaxV = ytd.tmax[i];
        if (tMinV === null || tMinV === undefined || tMaxV === null || tMaxV === undefined) continue;
        total += dailyGdd(tMinV, tMaxV, baseC, capC);
      }
      yearToDate = { as_of_date: endDate, gdd_so_far: Math.round(total * 10) / 10 };
    }
  } catch {
    // Year-to-date is a bonus; ignore failures.
    yearToDate = null;
  }

  return {
    years_analyzed: perYear.length,
    average_annual_gdd: average !== null ? Math.round(average * 10) / 10 : null,
    min_year: minYear,
    max_year: maxYear,
    per_year: perYear,
    year_to_date: yearToDate,
  };
}

const GDD_REFERENCE_TABLE = {
  note: "Typical cumulative GDD (base 10°C) needed from planting/emergence to maturity. Approximate, varies by cultivar.",
  lettuce_c: "~800",
  tomatoes_c: "~1400-1600",
  peppers_c: "~1500-1800",
  melons_c: "~2000-2400",
};

export interface GrowingDegreeDaysArgs {
  latitude: number;
  longitude: number;
  base_temp_c?: number;
  upper_cap_c?: number;
  years?: number;
}

export async function handleGrowingDegreeDays(
  args: GrowingDegreeDaysArgs
): Promise<CallToolResult> {
  const { latitude, longitude, base_temp_c = 10, upper_cap_c = 30, years = 10 } = args;

  let result: GddComputation;
  try {
    result = await computeGdd(latitude, longitude, years, base_temp_c, upper_cap_c);
  } catch (error) {
    return err(
      `Growing degree days request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return ok({
    location: { latitude, longitude },
    base_temp_c,
    upper_cap_c,
    note:
      "GDD computed from ERA5 reanalysis daily min/max temperatures (Open-Meteo historical archive) " +
      "using the simple daily-average method with tmax capped at upper_cap_c. Approximation, not a " +
      "substitute for local station data.",
    reference_crop_gdd_requirements: GDD_REFERENCE_TABLE,
    ...result,
  });
}

// ====================================
// Soil conditions
// ====================================

interface SoilApiResponse {
  hourly?: {
    time: string[];
    soil_temperature_0cm: (number | null)[];
    soil_temperature_6cm: (number | null)[];
    soil_temperature_18cm: (number | null)[];
    soil_moisture_0_to_1cm: (number | null)[];
    soil_moisture_3_to_9cm: (number | null)[];
    soil_moisture_9_to_27cm: (number | null)[];
  };
}

const SOIL_PLANTING_GUIDANCE = {
  note: "Guidance based on soil temperature at 6cm depth.",
  cool_season_direct_sow_c: ">= 10 (e.g. peas, spinach, lettuce, carrots)",
  warm_season_transplant_c: ">= 15 (e.g. tomato and pepper transplants)",
  warm_season_direct_sow_c: ">= 18-21 (e.g. melons, squash, cucumbers)",
};

export interface SoilConditionsArgs {
  latitude: number;
  longitude: number;
  forecast_days?: number;
}

export async function handleSoilConditions(args: SoilConditionsArgs): Promise<CallToolResult> {
  const { latitude, longitude, forecast_days = 3 } = args;

  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set(
    "hourly",
    "soil_temperature_0cm,soil_temperature_6cm,soil_temperature_18cm,soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm"
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", forecast_days.toString());

  let data: SoilApiResponse;
  try {
    data = await getJson<SoilApiResponse>(url.toString());
  } catch (error) {
    return err(
      `Soil conditions request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!data.hourly) {
    return err("No soil data returned for this location.");
  }

  const h = data.hourly;
  const now = Date.now();
  let currentIdx = h.time.findIndex((t) => Date.parse(t) >= now);
  if (currentIdx === -1) currentIdx = h.time.length - 1;

  const current = {
    time: h.time[currentIdx],
    soil_temperature_0cm_c: h.soil_temperature_0cm[currentIdx] ?? null,
    soil_temperature_6cm_c: h.soil_temperature_6cm[currentIdx] ?? null,
    soil_temperature_18cm_c: h.soil_temperature_18cm[currentIdx] ?? null,
    soil_moisture_0_to_1cm: h.soil_moisture_0_to_1cm[currentIdx] ?? null,
    soil_moisture_3_to_9cm: h.soil_moisture_3_to_9cm[currentIdx] ?? null,
    soil_moisture_9_to_27cm: h.soil_moisture_9_to_27cm[currentIdx] ?? null,
  };

  // Daily summary: min/max of 6cm temp, mean moisture (0-1cm), grouped by date.
  interface DayAgg {
    temp6min: number | null;
    temp6max: number | null;
    moistureSum: number;
    moistureCount: number;
  }
  const byDay = new Map<string, DayAgg>();
  for (let i = 0; i < h.time.length; i++) {
    const date = h.time[i].slice(0, 10);
    const t6 = h.soil_temperature_6cm[i];
    const m = h.soil_moisture_0_to_1cm[i];
    const agg = byDay.get(date) ?? { temp6min: null, temp6max: null, moistureSum: 0, moistureCount: 0 };
    if (t6 !== null && t6 !== undefined) {
      agg.temp6min = agg.temp6min === null ? t6 : Math.min(agg.temp6min, t6);
      agg.temp6max = agg.temp6max === null ? t6 : Math.max(agg.temp6max, t6);
    }
    if (m !== null && m !== undefined) {
      agg.moistureSum += m;
      agg.moistureCount += 1;
    }
    byDay.set(date, agg);
  }

  const daily = Array.from(byDay.entries()).map(([date, agg]) => ({
    date,
    soil_temp_6cm_min_c: agg.temp6min,
    soil_temp_6cm_max_c: agg.temp6max,
    soil_moisture_0_to_1cm_mean: agg.moistureCount ? agg.moistureSum / agg.moistureCount : null,
  }));

  return ok({
    location: { latitude, longitude },
    current,
    daily,
    planting_guidance: SOIL_PLANTING_GUIDANCE,
  });
}

// ====================================
// Day length
// ====================================

interface DayLengthApiResponse {
  daily?: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    daylight_duration: number[];
    sunshine_duration: number[];
  };
}

function secondsToHm(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function localTime(isoString: string): string {
  // Open-Meteo returns e.g. "2026-07-23T05:58" in the location's local timezone.
  const parts = isoString.split("T");
  return parts.length > 1 ? parts[1] : isoString;
}

export interface DayLengthArgs {
  latitude: number;
  longitude: number;
  days?: number;
}

export async function handleDayLength(args: DayLengthArgs): Promise<CallToolResult> {
  const { latitude, longitude, days = 7 } = args;

  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("daily", "sunrise,sunset,daylight_duration,sunshine_duration");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", days.toString());

  let data: DayLengthApiResponse;
  try {
    data = await getJson<DayLengthApiResponse>(url.toString());
  } catch (error) {
    return err(
      `Day length request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!data.daily) {
    return err("No day length data returned for this location.");
  }

  const d = data.daily;
  const perDay = d.time.map((date, i) => ({
    date,
    sunrise: localTime(d.sunrise[i]),
    sunset: localTime(d.sunset[i]),
    daylight_hours: secondsToHm(d.daylight_duration[i]),
    sunshine_hours: secondsToHm(d.sunshine_duration[i]),
  }));

  let trend = "insufficient data";
  if (d.daylight_duration.length >= 2) {
    const first = d.daylight_duration[0];
    const last = d.daylight_duration[d.daylight_duration.length - 1];
    const totalChangeMin = (last - first) / 60;
    const perDayMin = totalChangeMin / (d.daylight_duration.length - 1);
    if (Math.abs(perDayMin) < 0.5) {
      trend = "roughly stable daylight";
    } else if (perDayMin > 0) {
      trend = `gaining ~${perDayMin.toFixed(1)} min/day`;
    } else {
      trend = `losing ~${Math.abs(perDayMin).toFixed(1)} min/day`;
    }
  }

  return ok({
    location: { latitude, longitude },
    daily: perDay,
    trend,
  });
}

// ====================================
// Garden climate (composite)
// ====================================

/** Approximate USDA hardiness zone from an average annual extreme minimum temperature in °F. */
function hardinessZoneFromMinF(minF: number): string {
  const clampedF = Math.max(-60, Math.min(70, minF));
  // Zone 1a starts at -60F; each zone spans 10F, each half-zone spans 5F.
  const offset = clampedF - -60; // >= 0
  const halfZoneIndex = Math.floor(offset / 5); // 0 = 1a, 1 = 1b, 2 = 2a, ...
  const zoneNumber = Math.floor(halfZoneIndex / 2) + 1;
  const suffix = halfZoneIndex % 2 === 0 ? "a" : "b";
  const clampedZoneNumber = Math.max(1, Math.min(13, zoneNumber));
  return `${clampedZoneNumber}${suffix}`;
}

export interface GardenClimateArgs {
  latitude: number;
  longitude: number;
}

export async function handleGardenClimate(args: GardenClimateArgs): Promise<CallToolResult> {
  const { latitude, longitude } = args;
  const years = 10;

  let frost: FrostDatesComputation;
  let gdd: GddComputation;
  let annualMinTemps: (number | null)[];
  let archiveTime: string[];

  try {
    const endYear = lastCompleteYear();
    const startYear = endYear - years + 1;

    const [frostResult, gddResult, archive] = await Promise.all([
      computeFrostDates(latitude, longitude, years, 0),
      computeGdd(latitude, longitude, years, 10, 30),
      fetchArchiveDaily(latitude, longitude, `${startYear}-01-01`, `${endYear}-12-31`),
    ]);
    frost = frostResult;
    gdd = gddResult;
    annualMinTemps = archive.tmin;
    archiveTime = archive.time;
  } catch (error) {
    return err(
      `Garden climate request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Average annual extreme minimum temperature (average of each year's single lowest tmin).
  const minByYear = new Map<number, number>();
  for (let i = 0; i < archiveTime.length; i++) {
    const v = annualMinTemps[i];
    if (v === null || v === undefined) continue;
    const year = Number(archiveTime[i].slice(0, 4));
    const cur = minByYear.get(year);
    if (cur === undefined || v < cur) minByYear.set(year, v);
  }
  const extremeMinsC = Array.from(minByYear.values());
  const avgExtremeMinC = extremeMinsC.length
    ? extremeMinsC.reduce((a, b) => a + b, 0) / extremeMinsC.length
    : null;
  const avgExtremeMinF = avgExtremeMinC !== null ? (avgExtremeMinC * 9) / 5 + 32 : null;
  const hardinessZone =
    avgExtremeMinF !== null ? hardinessZoneFromMinF(avgExtremeMinF) : null;

  // Current soil temp (6cm) and today's day length from a single forecast call.
  let soilTemp6cmC: number | null = null;
  let today: { date: string; sunrise: string; sunset: string; daylight_hours: string } | null =
    null;
  try {
    const url = new URL(FORECAST_URL);
    url.searchParams.set("latitude", latitude.toString());
    url.searchParams.set("longitude", longitude.toString());
    url.searchParams.set("hourly", "soil_temperature_6cm");
    url.searchParams.set("daily", "sunrise,sunset,daylight_duration");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "1");
    const data = await getJson<SoilApiResponse & DayLengthApiResponse>(url.toString());

    if (data.hourly) {
      const now = Date.now();
      let idx = data.hourly.time.findIndex((t) => Date.parse(t) >= now);
      if (idx === -1) idx = data.hourly.time.length - 1;
      soilTemp6cmC = data.hourly.soil_temperature_6cm[idx] ?? null;
    }
    if (data.daily && data.daily.time.length) {
      today = {
        date: data.daily.time[0],
        sunrise: localTime(data.daily.sunrise[0]),
        sunset: localTime(data.daily.sunset[0]),
        daylight_hours: secondsToHm(data.daily.daylight_duration[0]),
      };
    }
  } catch {
    // Soil/day-length are supplementary; ignore failures here.
  }

  return ok({
    location: { latitude, longitude },
    summary_note:
      "All values are approximations computed from ERA5 reanalysis grid data (Open-Meteo), not " +
      "official station observations or the USDA hardiness zone raster. Use for general garden " +
      "planning, not precision agriculture.",
    hardiness_zone: {
      approximate_zone: hardinessZone,
      caveat:
        "Computed from average annual extreme minimum temperature over the available history, using " +
        "the standard USDA 10°F zone / 5°F half-zone bands. This is NOT the official USDA hardiness " +
        "zone map (which uses 1991-2020 PRISM station climatology) and may differ by a zone or more, " +
        "especially in complex terrain.",
      average_annual_extreme_min_c:
        avgExtremeMinC !== null ? Math.round(avgExtremeMinC * 10) / 10 : null,
      average_annual_extreme_min_f:
        avgExtremeMinF !== null ? Math.round(avgExtremeMinF * 10) / 10 : null,
      years_analyzed: extremeMinsC.length,
    },
    frost_dates: {
      threshold_c: 0,
      frost_free_climate: frost.frost_free_climate,
      last_spring_frost_average: frost.last_spring_frost.average,
      first_fall_frost_average: frost.first_fall_frost.average,
      average_frost_free_season_days: frost.average_frost_free_season_days,
      years_analyzed: frost.years_analyzed,
    },
    growing_degree_days: {
      base_temp_c: 10,
      average_annual_gdd: gdd.average_annual_gdd,
      years_analyzed: gdd.years_analyzed,
      reference: GDD_REFERENCE_TABLE,
    },
    current_conditions: {
      soil_temperature_6cm_c: soilTemp6cmC,
      today_day_length: today,
    },
  });
}

// ====================================
// Registration
// ====================================

export function registerGardenTools(server: McpServer): void {
  server.registerTool(
    "maps_frost_dates",
    {
      title: "Get Historical Frost Dates",
      description:
        "Estimate last-spring and first-fall frost dates for a location from historical daily minimum " +
        "temperatures, useful for planning planting and harvest windows. Data source: Open-Meteo " +
        "historical archive (ERA5 reanalysis, free, no API key required). Hemisphere-aware: for the " +
        "northern hemisphere, spring = Jan-Jun and fall = Jul-Dec of each year; for the southern " +
        "hemisphere the 'frost year' runs Jul-Jun, spring = Jul-Dec and fall = Jan-Jun. Computed values " +
        "are approximations from reanalysis grid data, not local station observations.\n\n" +
        "Args:\n" +
        `  latitude: ${LATITUDE_DESC}\n` +
        `  longitude: ${LONGITUDE_DESC}\n` +
        "  years: Number of complete calendar years of history to analyze, 5-30 (default: 10).\n" +
        "  frost_threshold_c: Minimum temperature (°C) considered a frost (default: 0 = hard frost; " +
        "use 2 for light frost risk).\n\n" +
        "Returns:\n" +
        "  location, frost_threshold_c, hemisphere, frost_free_climate flag, average/earliest/latest " +
        "last-spring and first-fall frost dates, average frost-free season length in days, and a " +
        "per-year table.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe(LATITUDE_DESC),
        longitude: z.number().min(-180).max(180).describe(LONGITUDE_DESC),
        years: z
          .number()
          .int()
          .min(5)
          .max(30)
          .optional()
          .describe("Number of complete calendar years of history to analyze (5-30, default: 10)"),
        frost_threshold_c: z
          .number()
          .optional()
          .describe(
            "Minimum temperature in °C considered a frost (default: 0 = hard frost; 2 = light frost risk)"
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleFrostDates)
  );

  server.registerTool(
    "maps_growing_degree_days",
    {
      title: "Get Growing Degree Days",
      description:
        "Compute historical and year-to-date growing degree days (GDD) for a location, used to estimate " +
        "crop development timing. Data source: Open-Meteo historical archive (ERA5 reanalysis, free, no " +
        "API key required). GDD is computed per day as max(0, ((min(tmax, upper_cap_c) + tmin) / 2) - " +
        "base_temp_c) and summed per calendar year over the requested number of complete years. Values " +
        "are approximations from reanalysis grid data.\n\n" +
        "Args:\n" +
        `  latitude: ${LATITUDE_DESC}\n` +
        `  longitude: ${LONGITUDE_DESC}\n` +
        "  base_temp_c: Base temperature (°C) below which growth is assumed to stop (default: 10).\n" +
        "  upper_cap_c: Upper cap (°C) applied to daily max temperature before averaging (default: 30).\n" +
        "  years: Number of complete calendar years of history to analyze, 5-30 (default: 10).\n\n" +
        "Returns:\n" +
        "  location, average/min/max annual GDD totals, a per-year table, year-to-date GDD for the " +
        "current calendar year (as of the latest available archive date), and a reference table of " +
        "typical cumulative GDD requirements (base 10°C) for common crops.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe(LATITUDE_DESC),
        longitude: z.number().min(-180).max(180).describe(LONGITUDE_DESC),
        base_temp_c: z
          .number()
          .optional()
          .describe("Base temperature in °C below which growth is assumed to stop (default: 10)"),
        upper_cap_c: z
          .number()
          .optional()
          .describe("Upper cap in °C applied to daily max temperature before averaging (default: 30)"),
        years: z
          .number()
          .int()
          .min(5)
          .max(30)
          .optional()
          .describe("Number of complete calendar years of history to analyze (5-30, default: 10)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleGrowingDegreeDays)
  );

  server.registerTool(
    "maps_soil_conditions",
    {
      title: "Get Soil Temperature and Moisture Forecast",
      description:
        "Get current and forecast soil temperature (at 0cm, 6cm, 18cm depth) and soil moisture (at " +
        "0-1cm, 3-9cm, 9-27cm depth) for a location, useful for deciding when to plant. Data source: " +
        "Open-Meteo forecast API (free, no API key required).\n\n" +
        "Args:\n" +
        `  latitude: ${LATITUDE_DESC}\n` +
        `  longitude: ${LONGITUDE_DESC}\n` +
        "  forecast_days: Number of forecast days, 1-7 (default: 3).\n\n" +
        "Returns:\n" +
        "  location, current soil temperature/moisture readings, a daily summary (min/max 6cm soil " +
        "temperature and mean 0-1cm moisture per day), and planting guidance thresholds based on 6cm " +
        "soil temperature (>=10°C cool-season direct sow, >=15°C warm-season transplant, >=18-21°C " +
        "warm-season direct sow).",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe(LATITUDE_DESC),
        longitude: z.number().min(-180).max(180).describe(LONGITUDE_DESC),
        forecast_days: z
          .number()
          .int()
          .min(1)
          .max(7)
          .optional()
          .describe("Number of forecast days (1-7, default: 3)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleSoilConditions)
  );

  server.registerTool(
    "maps_day_length",
    {
      title: "Get Day Length and Sunlight Forecast",
      description:
        "Get sunrise/sunset times, daylight hours, and sunshine hours for a location over the next few " +
        "days, plus the day-over-day daylight trend, useful for planning garden tasks around available " +
        "light. Data source: Open-Meteo forecast API (free, no API key required).\n\n" +
        "Args:\n" +
        `  latitude: ${LATITUDE_DESC}\n` +
        `  longitude: ${LONGITUDE_DESC}\n` +
        "  days: Number of forecast days, 1-16 (default: 7).\n\n" +
        "Returns:\n" +
        "  location, per-day sunrise/sunset (local time), daylight hours (h:mm), sunshine hours (h:mm), " +
        "and a trend string describing whether daylight is gaining or losing minutes per day.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe(LATITUDE_DESC),
        longitude: z.number().min(-180).max(180).describe(LONGITUDE_DESC),
        days: z
          .number()
          .int()
          .min(1)
          .max(16)
          .optional()
          .describe("Number of forecast days (1-16, default: 7)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleDayLength)
  );

  server.registerTool(
    "maps_garden_climate",
    {
      title: "Get Garden Climate Summary",
      description:
        "One-call composite garden planning summary for a location: approximate USDA hardiness zone, " +
        "frost dates, average annual growing degree days, and current soil temperature and day length. " +
        "Data source: Open-Meteo historical archive and forecast APIs (ERA5 reanalysis, free, no API " +
        "key required). Internally reuses the same computations as maps_frost_dates, " +
        "maps_growing_degree_days, and maps_soil_conditions over 10 years of history. All values are " +
        "approximations from reanalysis grid data — the hardiness zone in particular is NOT the " +
        "official USDA hardiness zone map.\n\n" +
        "Args:\n" +
        `  latitude: ${LATITUDE_DESC}\n` +
        `  longitude: ${LONGITUDE_DESC}\n\n` +
        "Returns:\n" +
        "  location, approximate_zone (USDA-style, e.g. '5b') with the average annual extreme minimum " +
        "temperature in °C/°F, frost dates summary (threshold 0°C), average annual GDD (base 10°C) with " +
        "a crop reference table, and current soil temperature (6cm) and today's day length.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe(LATITUDE_DESC),
        longitude: z.number().min(-180).max(180).describe(LONGITUDE_DESC),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safe(handleGardenClimate)
  );
}
