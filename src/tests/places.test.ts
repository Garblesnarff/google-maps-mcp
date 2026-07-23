process.env.GOOGLE_MAPS_API_KEY = "test-key-123";

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  installFetchMock,
  restoreFetchMock,
  resetFetchMock,
  mockRoute,
  jsonResponse,
  capturedRequests,
} from "./fetch-mock.js";

import { handleSearchPlaces, handlePlaceDetails } from "../tools/places.js";

beforeEach(() => {
  installFetchMock();
});

afterEach(() => {
  resetFetchMock();
  restoreFetchMock();
});

describe("handleSearchPlaces", () => {
  test("happy path: trims fields (types capped at 5) and sends field mask header", async () => {
    mockRoute("places.googleapis.com/v1/places:searchText", () =>
      jsonResponse({
        places: [
          {
            id: "place_1",
            displayName: { text: "Trailhead Coffee" },
            formattedAddress: "1 Coffee St, Bend, OR",
            location: { latitude: 44.05, longitude: -121.31 },
            rating: 4.6,
            userRatingCount: 812,
            priceLevel: "PRICE_LEVEL_MODERATE",
            types: ["cafe", "food", "point_of_interest", "establishment", "store", "restaurant"],
            businessStatus: "OPERATIONAL",
            currentOpeningHours: { openNow: true },
            websiteUri: "https://example.com",
          },
        ],
      })
    );

    const result = await handleSearchPlaces({ query: "coffee in Bend, OR" });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.result_count, 1);
    const place = parsed.results[0];
    assert.equal(place.place_id, "place_1");
    assert.equal(place.name, "Trailhead Coffee");
    assert.equal(place.open_now, true);
    assert.equal(place.types.length, 5, "types should be trimmed to the first 5");

    const searchRequest = capturedRequests.find((r) => r.url.includes(":searchText"));
    assert.ok(searchRequest, "expected a request to the searchText endpoint");
    assert.ok(
      searchRequest!.headers["x-goog-fieldmask"]?.includes("places.displayName"),
      "expected X-Goog-FieldMask header on the search request"
    );
  });
});

describe("handlePlaceDetails", () => {
  test("happy path: trims reviews to 3 and review text to 300 chars, sends field mask header", async () => {
    const longReviewText = "x".repeat(500);

    mockRoute("places.googleapis.com/v1/places/", () =>
      jsonResponse({
        id: "place_1",
        displayName: { text: "Trailhead Coffee" },
        formattedAddress: "1 Coffee St, Bend, OR",
        location: { latitude: 44.05, longitude: -121.31 },
        rating: 4.6,
        userRatingCount: 812,
        priceLevel: "PRICE_LEVEL_MODERATE",
        types: ["cafe", "food"],
        businessStatus: "OPERATIONAL",
        nationalPhoneNumber: "(555) 555-0100",
        internationalPhoneNumber: "+1 555-555-0100",
        websiteUri: "https://example.com",
        googleMapsUri: "https://maps.google.com/?cid=1",
        regularOpeningHours: { weekdayDescriptions: ["Monday: 7 AM - 5 PM"] },
        editorialSummary: { text: "A cozy neighborhood coffee shop." },
        goodForChildren: true,
        allowsDogs: true,
        reviews: [
          { rating: 5, text: { text: longReviewText }, relativePublishTimeDescription: "a week ago" },
          { rating: 4, text: { text: "Nice spot" }, relativePublishTimeDescription: "a month ago" },
          { rating: 3, text: { text: "It was fine" }, relativePublishTimeDescription: "2 months ago" },
          { rating: 2, text: { text: "Not for me" }, relativePublishTimeDescription: "3 months ago" },
        ],
      })
    );

    const result = await handlePlaceDetails({ place_id: "place_1" });
    assert.equal(result.isError, false);

    const parsed = JSON.parse((result.content[0] as { type: "text"; text: string }).text);
    assert.equal(parsed.place_id, "place_1");
    assert.equal(parsed.name, "Trailhead Coffee");
    assert.equal(parsed.reviews.length, 3, "reviews should be trimmed to 3");
    assert.equal(parsed.reviews[0].text.length, 300, "review text should be trimmed to 300 chars");

    const detailsRequest = capturedRequests.find((r) => r.url.includes("/v1/places/place_1"));
    assert.ok(detailsRequest, "expected a request to the place details endpoint");
    assert.ok(
      detailsRequest!.headers["x-goog-fieldmask"]?.includes("displayName"),
      "expected X-Goog-FieldMask header on the details request"
    );
  });
});
