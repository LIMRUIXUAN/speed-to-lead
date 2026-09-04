import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeQualification } from "../src/calle.js";

test("maps a valid structured result to a qualification", () => {
  const q = normalizeQualification({
    qualified: true,
    budget: "over_25k",
    authority: "decision_maker",
    need: "high",
    timeline: "within_30_days",
    accepted_demo: true,
    selected_slot: "2026-09-01T15:00:00.000Z",
    objections: ["price"],
    notes: "wants a demo",
  });
  assert.equal(q.qualified, true);
  assert.equal(q.budget, "over_25k");
  assert.equal(q.authority, "decision_maker");
  assert.equal(q.objections.length, 1);
  assert.equal(q.selected_slot, "2026-09-01T15:00:00.000Z");
});

test("coerces null to safe defaults", () => {
  const q = normalizeQualification(null);
  assert.equal(q.qualified, false);
  assert.equal(q.budget, "unknown");
  assert.equal(q.authority, "unknown");
  assert.deepEqual(q.objections, []);
});

test("rejects out-of-enum strings and wrong types", () => {
  const q = normalizeQualification({ qualified: true, budget: "bogus", authority: 42, need: "high", timeline: "immediate" });
  assert.equal(q.budget, "unknown");
  assert.equal(q.authority, "unknown");
  assert.equal(q.need, "high");
});
