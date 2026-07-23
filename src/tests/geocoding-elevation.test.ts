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

import { handleGeocode, handleReverseGeocode } from "../tools/geocoding.js";
import { handleElevation } from "../tools/elevation.js";

beforeEach(() => {
  installFetchMock();
});

afterEach(() => {
  resetFetchMock();
  restoreFetchMock();
});

describe("handleGeocode", () => {
  test("happy path: returns trimmed results for a two-result match", async () => {
    mockRoute("maps/api/geocode/json", () =>
      jsonResponse({
        status: "OK",
        results: [
          {
            formatted_address: "123 Main St, Springfield, IL 62701, USA",
            geometry: { location: { lat: 39.78, lng: -89.65 } },
            place_id: "place_abc",
            types: ["street_address"],
          },
          {
            formatted_address: "123 Main St, Springfield, MA 01103, USA",
            geometry: { location: { lat: 42.1, lng: -72.59 } },
            place_id: "place_def",
            types: ["street_address"],
          },
        ],
      })
    );

    const result = await handleGeocode({ address: "123 Main St, Springfield" });
    assert.equal(result.isError, false);

    const text = (result.content[0] as { type: "text"; text: string }).text;
    assert.ok(!text.includes("test-key-123"), "response text must not leak the API key");

    const parsed = JSON.parse(text);
    assert.equal(parsed.result_count, 2);
    assert.equal(parsed.results[0].place_id, "place_abc");
    assert.equal(parsed.results[1].location.lat, 42.1);
  });

  test("error path: non-OK status becomes an isError response", async () => {
    mockRoute("maps/api/geocode/json", () =>
      jsonResponse({ status: "ZERO_RESULTS", results: [] })
    );

    const result = await handleGeocode({ address: "nowhere at all" });
    assert.equal(result.isError, true);
  });
});

describe("handleReverseGeocode", () => {
  test("happy path: returns trimmed results and hides the API key", async () => {
    mockRoute("maps/api/geocode/json", () =>
      jsonResponse({
        status: "OK",
        results: [
          {
            formatted_address: "1600 Amphitheatre Pkwy, Mountain View, CA",
            geometry: { location: { lat: 37.422, lng: -122.084 } },
            place_id: "place_1",
            types: ["street_address"],
          },
          {
            formatted_address: "Mountain View, CA, USA",
            geometry: { location: { lat: 37.386, lng: -122.083 } },
            place_id: "place_2",
            types: ["locality", "political"],
          },
        ],
      })
    );

    const result = await handleReverseGeocode({ latitude: 37.422, longitude: -122.084 });
    assert.equal(result.isError, false);

    const text = (result.content[0] as { type: "text"; text: string }).text;
    assert.ok(!text.includes("test-key-123"));

    const parsed = JSON.parse(text);
    assert.equal(parsed.result_count, 2);
    assert.equal(parsed.results[0].formatted_address, "1600 Amphitheatre Pkwy, Mountain View, CA");
  });
});

describe("handleElevation", () => {
  test("point mode: returns rounded elevation for each location", async () => {
    mockRoute("maps/api/elevation/json", () =>
      jsonResponse({
        status: "OK",
        results: [
          { elevation: 100.456, location: { lat: 1, lng: 2 }, resolution: 10 },
          { elevation: 200.222, location: { lat: 3, lng: 4 }, resolution: 10 },
        ],
      })
    );

    const result = await handleElevation({
      locations: [
        { latitude: 1, longitude: 2 },
        { latitude: 3, longitude: 4 },
      ],
    });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.result_count, 2);
    assert.equal(parsed.results[0].elevation, 100.5);
    assert.equal(parsed.results[1].elevation, 200.2);
  });

  test("path/profile mode: computes ascent/descent/min/max summary", async () => {
    mockRoute("maps/api/elevation/json", () =>
      jsonResponse({
        status: "OK",
        results: [
          { elevation: 100, location: { lat: 0, lng: 0 }, resolution: 10 },
          { elevation: 150, location: { lat: 0.1, lng: 0 }, resolution: 10 },
          { elevation: 120, location: { lat: 0.2, lng: 0 }, resolution: 10 },
          { elevation: 180, location: { lat: 0.3, lng: 0 }, resolution: 10 },
        ],
      })
    );

    const result = await handleElevation({
      path: [
        { latitude: 0, longitude: 0 },
        { latitude: 0.3, longitude: 0 },
      ],
      samples: 4,
    });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.result_count, 4);
    assert.equal(parsed.summary.min_elevation, 100);
    assert.equal(parsed.summary.max_elevation, 180);
    assert.equal(parsed.summary.total_ascent, 110);
    assert.equal(parsed.summary.total_descent, 30);
  });

  test("validation error: both locations and path given", async () => {
    const result = await handleElevation({
      locations: [{ latitude: 1, longitude: 2 }],
      path: [{ latitude: 1, longitude: 2 }],
      samples: 5,
    });
    assert.equal(result.isError, true);
  });

  test("validation error: path given without samples", async () => {
    const result = await handleElevation({
      path: [
        { latitude: 1, longitude: 2 },
        { latitude: 3, longitude: 4 },
      ],
    });
    assert.equal(result.isError, true);
  });
});
