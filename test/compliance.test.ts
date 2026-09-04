import test from "node:test";
import assert from "node:assert/strict";
import { checkTcpaCompliance, resolvePhoneTimezone } from "../src/compliance.js";

test("resolvePhoneTimezone resolves international and US phone numbers", () => {
  assert.equal(resolvePhoneTimezone("+60127058268"), "Asia/Kuala_Lumpur");
  assert.equal(resolvePhoneTimezone("+6591234567"), "Asia/Singapore");
  assert.equal(resolvePhoneTimezone("+442071234567"), "Europe/London");
  assert.equal(resolvePhoneTimezone("+14155550100"), "America/Los_Angeles"); // San Francisco area code 415
  assert.equal(resolvePhoneTimezone("+12125550100"), "America/New_York"); // NYC area code 212
});

test("checkTcpaCompliance enforces business hours window (8:00 AM - 8:30 PM)", () => {
  // Test daytime: 14:00 UTC = 22:00 (10 PM) in KL (+8), outside 8:30 PM
  const nightInKl = new Date("2026-09-04T14:00:00Z");
  const klResult = checkTcpaCompliance("+60127058268", nightInKl, false);
  assert.equal(klResult.allowed, false);
  assert.equal(klResult.suggestedAction, "queue_for_morning");

  // Test morning in KL: 02:00 UTC = 10:00 AM in KL (+8), within permissible hours
  const morningInKl = new Date("2026-09-04T02:00:00Z");
  const klMorningResult = checkTcpaCompliance("+60127058268", morningInKl, false);
  assert.equal(klMorningResult.allowed, true);
  assert.equal(klMorningResult.suggestedAction, "call_immediately");

  // Test override flag allows calling anytime
  const overrideResult = checkTcpaCompliance("+60127058268", nightInKl, true);
  assert.equal(overrideResult.allowed, true);
});
