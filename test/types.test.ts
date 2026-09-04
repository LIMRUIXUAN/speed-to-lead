import { test } from "node:test";
import assert from "node:assert/strict";
import { inferRegionAndLocale, normalizeE164 } from "../src/types.js";

test("strips formatting and keeps a valid E.164 number", () => {
  assert.equal(normalizeE164("+1 (415) 555-0100"), "+14155550100");
});

test("accepts digits without a leading plus", () => {
  assert.equal(normalizeE164("14155550100"), "14155550100");
});

test("rejects non-numeric and too-short input", () => {
  assert.equal(normalizeE164("not a phone"), null);
  assert.equal(normalizeE164("123"), null);
  assert.equal(normalizeE164(""), null);
});

test("infers region and locale correctly from international prefixes", () => {
  assert.deepEqual(inferRegionAndLocale("+14155550100"), { region: "US", locale: "en-US", language: "English (US)" });
  assert.deepEqual(inferRegionAndLocale("+60127058268"), { region: "MY", locale: "ms-MY", language: "Bahasa Malaysia / English" });
  assert.deepEqual(inferRegionAndLocale("+447911123456"), { region: "GB", locale: "en-GB", language: "English (UK)" });
  assert.deepEqual(inferRegionAndLocale("+6591234567"), { region: "SG", locale: "en-SG", language: "English (Singapore)" });
  assert.deepEqual(inferRegionAndLocale("+491512345678"), { region: "DE", locale: "de-DE", language: "German (Deutsch)" });
  // Explicit overrides take priority
  assert.deepEqual(inferRegionAndLocale("+14155550100", "CA", "fr-CA"), { region: "CA", locale: "fr-CA", language: "English (US)" });
});

