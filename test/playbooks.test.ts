import test from "node:test";
import assert from "node:assert/strict";
import { getPlaybook, listPlaybooks } from "../src/playbooks.js";

test("listPlaybooks returns all registered industry playbooks", () => {
  const playbooks = listPlaybooks();
  assert.ok(playbooks.length >= 4);
  const ids = playbooks.map((p) => p.id);
  assert.ok(ids.includes("saas_demo"));
  assert.ok(ids.includes("real_estate"));
  assert.ok(ids.includes("solar_home"));
  assert.ok(ids.includes("emergency_triage"));
});

test("getPlaybook retrieves requested playbook or falls back to saas_demo", () => {
  const saas = getPlaybook("saas_demo");
  assert.equal(saas.id, "saas_demo");
  assert.ok(saas.keyQuestions.length > 0);

  const solar = getPlaybook("solar_home");
  assert.equal(solar.id, "solar_home");

  const unknown = getPlaybook("non_existent_id");
  assert.equal(unknown.id, "saas_demo");
});
