process.env.GOOGLE_MAPS_API_KEY = "test-key-123";

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  installFetchMock,
  restoreFetchMock,
  resetFetchMock,
  mockRoute,
  jsonResponse,
  imageResponse,
} from "./fetch-mock.js";

import { handleStaticMap, handleStreetView } from "../tools/visual.js";

beforeEach(() => {
  installFetchMock();
});

afterEach(() => {
  resetFetchMock();
  restoreFetchMock();
});

describe("handleStaticMap", () => {
  test("happy path: returns an inline image block and key-free metadata", async () => {
    mockRoute("maps/api/staticmap", () => imageResponse());

    const result = await handleStaticMap({ center: "Seattle, WA" });
    assert.equal(result.isError, false);
    assert.equal(result.content.length, 2);

    const imageBlock = result.content[0] as { type: string; data: string; mimeType: string };
    assert.equal(imageBlock.type, "image");
    assert.ok(imageBlock.data.length > 0, "expected base64 image data");
    assert.equal(imageBlock.mimeType, "image/png");

    const metadataText = (result.content[1] as { type: "text"; text: string }).text;
    assert.ok(!metadataText.includes("test-key-123"), "metadata must not leak the API key");
  });
});

describe("handleStreetView", () => {
  test("happy path: fetches metadata then image bytes", async () => {
    mockRoute("streetview/metadata", () =>
      jsonResponse({
        status: "OK",
        date: "2024-06",
        copyright: "© Google",
        location: { lat: 40.758, lng: -73.985 },
        pano_id: "pano_123",
      })
    );
    mockRoute("api/streetview?", () => imageResponse(200, "image/jpeg"));

    const result = await handleStreetView({ location: "Times Square, NYC" });
    assert.equal(result.isError, false);

    const imageBlock = result.content[0] as { type: string; data: string; mimeType: string };
    assert.equal(imageBlock.type, "image");
    assert.ok(imageBlock.data.length > 0);
    assert.equal(imageBlock.mimeType, "image/jpeg");

    const metadataText = (result.content[1] as { type: "text"; text: string }).text;
    assert.ok(metadataText.includes("pano_123"));
    assert.ok(!metadataText.includes("test-key-123"));
  });

  test("no-imagery path: ZERO_RESULTS metadata status becomes an isError response", async () => {
    mockRoute("streetview/metadata", () =>
      jsonResponse({ status: "ZERO_RESULTS" })
    );

    const result = await handleStreetView({ location: "Middle of the ocean" });
    assert.equal(result.isError, true);

    const text = (result.content[0] as { type: "text"; text: string }).text;
    assert.ok(text.includes("ZERO_RESULTS"));
  });
});
