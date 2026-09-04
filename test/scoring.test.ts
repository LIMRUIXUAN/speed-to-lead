import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreLead } from "../src/scoring.js";
import type { Qualification } from "../src/types.js";

function qual(overrides: Partial<Qualification> = {}): Qualification {
  return {
    qualified: true,
    budget: "over_25k",
    authority: "decision_maker",
    need: "critical",
    timeline: "immediate",
    accepted_demo: true,
    selected_slot: "",
    objections: [],
    notes: "",
    ...overrides,
  };
}

test("perfect BANT lead scores 100 and grades A", () => {
  const s = scoreLead(qual());
  assert.equal(s.score, 100);
  assert.equal(s.grade, "A");
});

test("unqualified lead is clamped to D", () => {
  const s = scoreLead(qual({ qualified: false }));
  assert.equal(s.score, 24);
  assert.equal(s.grade, "D");
});

test("unknown BANT fields produce a low D score", () => {
  const s = scoreLead(qual({ budget: "unknown", authority: "unknown", need: "unknown", timeline: "unknown" }));
  assert.equal(s.score, 11);
  assert.equal(s.grade, "D");
});

test("score stays within 0-100 for any input", () => {
  const s = scoreLead(
    qual({ budget: "unknown", authority: "committee", need: "low", timeline: "exploratory", qualified: false }),
  );
  assert.ok(s.score >= 0 && s.score <= 100);
});
