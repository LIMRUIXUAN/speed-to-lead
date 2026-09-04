import { CalDotComProvider } from "../src/calendar/calcom.js";
import { loadConfig } from "../src/config.js";
import { HubspotCrm } from "../src/crm/hubspot.js";
import type { CrmLeadRecord } from "../src/crm/provider.js";
import type { Qualification } from "../src/types.js";

/**
 * Validates the Cal.com and HubSpot integrations using your real credentials.
 * Each check is skipped when its credentials are not configured.
 *
 *   pnpm run validate:integrations
 */
async function checkCalcom(config: ReturnType<typeof loadConfig>): Promise<void> {
  if (!config.calcomApiKey || config.calcomEventTypeId == null) {
    console.log("Cal.com: SKIPPED (set CALCOM_API_KEY and CALCOM_EVENT_TYPE_ID to test)");
    return;
  }
  const provider = new CalDotComProvider({
    apiKey: config.calcomApiKey,
    eventTypeId: config.calcomEventTypeId,
    timezone: config.agentTimezone,
  });
  const slots = await provider.availableSlots();
  const booking = await provider.book(slots[0], {
    name: "Integration Test",
    phone: "+14155550100",
    email: "integration-test@example.com",
  });
  console.log("Cal.com booking:", JSON.stringify({ slot: slots[0]?.start.toISOString(), booking }, null, 2));
}

async function checkHubspot(config: ReturnType<typeof loadConfig>): Promise<void> {
  if (!config.hubspotAccessToken) {
    console.log("HubSpot: SKIPPED (set HUBSPOT_ACCESS_TOKEN to test)");
    return;
  }
  const qualification: Qualification = {
    qualified: true,
    budget: "over_25k",
    authority: "decision_maker",
    need: "high",
    timeline: "immediate",
    accepted_demo: true,
    selected_slot: "",
    objections: [],
    notes: "integration check",
  };
  const record: CrmLeadRecord = {
    lead: {
      id: "integration-test",
      name: "Integration Test",
      phone: "+14155550100",
      email: "integration-test@example.com",
      company: "Acme",
      createdAt: new Date().toISOString(),
    },
    mode: "test",
    callId: null,
    qualification,
    score: { score: 100, grade: "A", breakdown: { authority: 30, need: 30, timeline: 25, budget: 15 } },
    booking: null,
    summary: null,
    createdAt: new Date().toISOString(),
  };
  const result = await new HubspotCrm(config.hubspotAccessToken).write(record);
  console.log("HubSpot contact created:", JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  const config = loadConfig();
  console.log("=== Cal.com check ===");
  await checkCalcom(config);
  console.log("\n=== HubSpot check ===");
  await checkHubspot(config);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
