process.env.GOOGLE_MAPS_API_KEY = "test-key-123";

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { sanitizeUrl } from "../utils/http.js";
import { ok, CHARACTER_LIMIT } from "../utils/respond.js";
import { createServer } from "../index.js";

describe("sanitizeUrl", () => {
  test("strips the 'key' query param but keeps other params", () => {
    const sanitized = sanitizeUrl(
      "https://maps.googleapis.com/maps/api/geocode/json?address=Bend&key=test-key-123"
    );
    assert.ok(!sanitized.includes("test-key-123"));
    assert.ok(!sanitized.includes("key="));
    assert.ok(sanitized.includes("address=Bend"));
  });

  test("returns the input unchanged if it is not a valid URL", () => {
    assert.equal(sanitizeUrl("not a url"), "not a url");
  });
});

describe("ok()", () => {
  test("truncates strings longer than the character limit", () => {
    const longData = { blob: "x".repeat(CHARACTER_LIMIT + 500) };
    const result = ok(longData);
    assert.equal(result.isError, false);

    const text = (result.content[0] as { type: "text"; text: string }).text;
    assert.ok(text.length < JSON.stringify(longData, null, 2).length);
    assert.ok(text.includes(`truncated at ${CHARACTER_LIMIT} characters`));
  });

  test("does not truncate short data", () => {
    const result = ok({ hello: "world" });
    const text = (result.content[0] as { type: "text"; text: string }).text;
    assert.ok(!text.includes("truncated"));
    assert.deepEqual(JSON.parse(text), { hello: "world" });
  });
});

describe("createServer", () => {
  test("constructs an McpServer with all tools registered, without throwing", () => {
    assert.doesNotThrow(() => createServer());
  });
});
