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
  handleRoutes,
  handleDirections,
  handleDistanceMatrix,
} from "../tools/routing.js";

beforeEach(() => {
  installFetchMock();
});

afterEach(() => {
  resetFetchMock();
  restoreFetchMock();
});

describe("handleRoutes", () => {
  test("happy path: humanizes duration/distance from a computeRoutes response", async () => {
    mockRoute("routes.googleapis.com/directions/v2:computeRoutes", () =>
      jsonResponse({
        routes: [
          {
            duration: "1234s",
            staticDuration: "1200s",
            distanceMeters: 50000,
            description: "Fastest route",
            warnings: [],
            legs: [{ duration: "1234s", distanceMeters: 50000 }],
            polyline: { encodedPolyline: "abc123" },
          },
        ],
      })
    );

    const result = await handleRoutes({
      origin: "Yosemite Valley, CA",
      destination: "Fresno, CA",
      travel_mode: "driving",
      routing_preference: "traffic_aware",
      compute_alternative_routes: false,
      avoid_tolls: false,
      avoid_highways: false,
      avoid_ferries: false,
    });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.route_count, 1);
    assert.equal(parsed.routes[0].duration, "21 min");
    assert.equal(parsed.routes[0].distance.meters, 50000);
  });
});

describe("handleDirections", () => {
  test("happy path: returns steps derived from computeRoutes legs", async () => {
    mockRoute("routes.googleapis.com/directions/v2:computeRoutes", () =>
      jsonResponse({
        routes: [
          {
            duration: "1234s",
            distanceMeters: 50000,
            description: "Fastest route",
            legs: [
              {
                duration: "1234s",
                distanceMeters: 50000,
                steps: [
                  {
                    distanceMeters: 1000,
                    staticDuration: "60s",
                    navigationInstruction: { instructions: "Head north on Main St", maneuver: "STRAIGHT" },
                  },
                ],
              },
            ],
          },
        ],
      })
    );

    const result = await handleDirections({
      origin: "Yosemite Valley, CA",
      destination: "Fresno, CA",
      mode: "driving",
    });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.step_count, 1);
    assert.equal(parsed.steps[0].instruction, "Head north on Main St");
    assert.equal(parsed.duration, "21 min");
  });
});

describe("handleDistanceMatrix", () => {
  test("happy path: parses a JSON array of elements keyed by origin/destination index", async () => {
    mockRoute("routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", () =>
      jsonResponse([
        { originIndex: 0, destinationIndex: 0, duration: "600s", distanceMeters: 5000, condition: "ROUTE_EXISTS" },
        { originIndex: 0, destinationIndex: 1, duration: "1200s", distanceMeters: 10000, condition: "ROUTE_EXISTS" },
      ])
    );

    const result = await handleDistanceMatrix({
      origins: ["Bend, OR"],
      destinations: ["Portland, OR", "Seattle, WA"],
      mode: "driving",
    });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.results.length, 1);
    assert.equal(parsed.results[0].origin_index, 0);
    assert.equal(parsed.results[0].destinations.length, 2);
    assert.equal(parsed.results[0].destinations[1].destination_index, 1);
    assert.equal(parsed.results[0].destinations[1].distance.meters, 10000);
  });
});
