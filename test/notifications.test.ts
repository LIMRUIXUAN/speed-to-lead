import { test } from "node:test";
import assert from "node:assert/strict";
import { dispatchSms, sendSlackNotification } from "../src/notifications/index.js";
import type { LeadOutcome } from "../src/service.js";

test("dispatchSms generates a mock dispatch when Twilio is unconfigured", async () => {
  const result = await dispatchSms("+14155550100", "Your demo is confirmed!", {});
  assert.equal(result.dispatched, true);
  assert.equal(result.provider, "mock");
  assert.equal(result.recipient, "+14155550100");
  assert.ok(result.message.includes("Your demo is confirmed!"));
  assert.ok(result.sentAt);
});

test("sendSlackNotification gracefully handles unconfigured webhook URL", async () => {
  const mockOutcome: LeadOutcome = {
    lead: {
      id: "lead_test",
      name: "Jordan Smith",
      phone: "+14155550100",
      createdAt: new Date().toISOString(),
    },
    mode: "mock",
    callId: "mock_123",
    status: "completed",
    taskCompleted: true,
    qualification: {
      qualified: true,
      budget: "over_25k",
      authority: "decision_maker",
      need: "critical",
      timeline: "immediate",
      accepted_demo: true,
      selected_slot: new Date().toISOString(),
      objections: ["Requires SOC2 Type II"],
      notes: "High intent enterprise lead",
    },
    score: {
      score: 95,
      grade: "A",
      breakdown: { budget: 25, authority: 25, need: 25, timeline: 20 },
    },
    booking: null,
    summary: "Qualified lead",
    evidence: ["Budget confirmed"],
    transcript: [],
    confirmation: null,
    fallbackAction: null,
    processingTimeMs: 4200,
    createdAt: new Date().toISOString(),
  };

  const res = await sendSlackNotification(mockOutcome, {});
  assert.equal(res.ok, false);
  assert.equal(res.error, "SLACK_WEBHOOK_URL not configured");
});
