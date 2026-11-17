import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gaMeasurementId, initGoogleAnalytics } from "./analytics";

describe("gaMeasurementId", () => {
  it("accepts a GA4 measurement ID", () => {
    assert.equal(gaMeasurementId("G-ABC123XYZ9"), "G-ABC123XYZ9");
    assert.equal(gaMeasurementId("  g-abc123  "), "G-ABC123");
  });

  it("rejects empty or malformed values", () => {
    assert.equal(gaMeasurementId(undefined), null);
    assert.equal(gaMeasurementId(""), null);
    assert.equal(gaMeasurementId("UA-12345-1"), null);
    assert.equal(gaMeasurementId("G-"), null);
    assert.equal(gaMeasurementId("G-abc\"><script>"), null);
  });
});

describe("initGoogleAnalytics", () => {
  it("does nothing when disabled or without an ID", () => {
    assert.equal(initGoogleAnalytics("G-ABC123", false), false);
    assert.equal(initGoogleAnalytics("", true), false);
    assert.equal(initGoogleAnalytics(undefined, true), false);
  });
});
