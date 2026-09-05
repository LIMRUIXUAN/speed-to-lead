import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTask, normalizeQualification } from "../src/calle.js";
import { loadConfig } from "../src/config.js";

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

test("buildTask injects warm inbound conversation mode directives", () => {
  const cfg = loadConfig();
  cfg.companyName = "Apex Solutions";

  const lead = {
    id: "lead_test",
    name: "Alex Morgan",
    phone: "+14155550100",
    company: "Morgan Corp",
    interest: "AI speed to lead pipeline",
    region: "US",
    locale: "en-US",
    createdAt: new Date().toISOString(),
  };

  const slots = [
    { start: new Date("2026-09-06T14:00:00.000Z"), label: "Tomorrow at 10:00 AM" },
    { start: new Date("2026-09-06T18:00:00.000Z"), label: "Tomorrow at 2:00 PM" },
  ];

  const task = buildTask(lead, slots, cfg, "saas_demo");

  // Verify Warm Mode directive
  assert.ok(task.includes("WARM INBOUND CONVERSATION MODE:"));
  assert.ok(task.includes("High Warmth & Gratitude"));
  assert.ok(task.includes("Alex Morgan"));
  assert.ok(task.includes("AI speed to lead pipeline"));
  assert.ok(task.includes("Anti-Interrogation Guardrail"));
  assert.ok(task.includes("Gracious Demo Invitation"));

  // Verify default warm US greeting
  assert.ok(task.includes("Speak naturally and warmly in English (US)"));
  assert.ok(task.includes("Hi Alex Morgan! Thanks so much for reaching out to Apex Solutions"));

  // Verify regional warm greetings
  const myTask = buildTask({ ...lead, region: "MY", locale: "ms-MY" }, slots, cfg);
  assert.ok(myTask.includes("Malaysia (MY)"));
  assert.ok(myTask.includes("Terima kasih kerana menghubungi Apex Solutions"));

  const esTask = buildTask({ ...lead, region: "ES", locale: "es-ES" }, slots, cfg);
  assert.ok(esTask.includes("¡Hola Alex Morgan! Muchísimas gracias por contactar a Apex Solutions"));

  const deTask = buildTask({ ...lead, region: "DE", locale: "de-DE" }, slots, cfg);
  assert.ok(deTask.includes("Guten Tag Alex Morgan, herzlichen Dank für Ihr Interesse an Apex Solutions"));

  const jpTask = buildTask({ ...lead, region: "JP", locale: "ja-JP" }, slots, cfg);
  assert.ok(jpTask.includes("Alex Morgan様、この度はApex Solutionsにお問い合わせいただき誠にありがとうございます"));

  const frTask = buildTask({ ...lead, region: "FR", locale: "fr-FR" }, slots, cfg);
  assert.ok(frTask.includes("Bonjour Alex Morgan ! Merci beaucoup d'avoir contacté Apex Solutions"));

  const gbTask = buildTask({ ...lead, region: "GB", locale: "en-GB" }, slots, cfg);
  assert.ok(gbTask.includes("Hello Alex Morgan, lovely to speak with you! Thanks ever so much for getting in touch with Apex Solutions"));
});
