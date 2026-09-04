import { randomUUID } from "node:crypto";
import { createCalendarProvider } from "../src/calendar/index.js";
import { loadConfig } from "../src/config.js";
import { createCrmProvider } from "../src/crm/index.js";
import { processLead } from "../src/service.js";
import type { Lead } from "../src/types.js";

async function main(): Promise<void> {
  const config = loadConfig();
  config.calleMode = "mock"; // never place a real call from the smoke test

  const deps = {
    config,
    calendar: createCalendarProvider(config),
    crm: createCrmProvider(config),
  };

  const lead: Lead = {
    id: randomUUID(),
    name: "Jordan Smith",
    phone: "+14155550100",
    email: "jordan@example.com",
    company: "Summit Roofing",
    source: "google-ads",
    interest: "Instant lead response demo",
    createdAt: new Date().toISOString(),
  };

  const outcome = await processLead(lead, deps, `lead:${lead.id}`);
  console.log(JSON.stringify(outcome, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
