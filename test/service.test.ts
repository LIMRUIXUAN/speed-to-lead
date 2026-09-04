import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCalendarProvider } from "../src/calendar/index.js";
import { loadConfig } from "../src/config.js";
import { LocalJsonCrm } from "../src/crm/local.js";
import { processLead } from "../src/service.js";
import type { Lead } from "../src/types.js";

test("processLead runs the full mock pipeline and persists to the CRM", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "s2l-"));
  const crmPath = path.join(dir, "leads.jsonl");

  const config = loadConfig();
  config.calleMode = "mock";

  const deps = {
    config,
    calendar: createCalendarProvider(config),
    crm: new LocalJsonCrm(crmPath),
  };

  const lead: Lead = {
    id: randomUUID(),
    name: "Test Lead",
    phone: "+14155550100",
    createdAt: new Date().toISOString(),
  };

  const outcome = await processLead(lead, deps, `lead:${lead.id}`);

  assert.equal(outcome.mode, "mock");
  assert.ok(outcome.score.score >= 0 && outcome.score.score <= 100);
  if (outcome.qualification.accepted_demo) {
    assert.ok(outcome.booking, "accepted demo should produce a booking");
  } else {
    assert.equal(outcome.booking, null);
  }

  const lines = (await fs.readFile(crmPath, "utf8")).trim().split("\n");
  assert.equal(lines.length, 1);
  assert.ok(lines[0].includes(lead.id));
});
