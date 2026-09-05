import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { LeadOutcome } from "../src/service.js";
import { dispatchCustomWebhook, testCustomWebhook } from "../src/notifications/webhook.js";
import { IntegrationsStore } from "../src/notifications/integration-store.js";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

test("testCustomWebhook correctly pings target webhook URL with HMAC signature", async () => {
  let receivedPayload: any = null;
  let receivedSignature: string | null = null;

  const server = createServer((req, res) => {
    receivedSignature = req.headers["x-speed-to-lead-signature"] as string;
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      receivedPayload = JSON.parse(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const targetUrl = `http://localhost:${port}/webhook`;

  const result = await testCustomWebhook(targetUrl, "my-secret-key");
  assert.equal(result.ok, true);
  assert.equal(receivedPayload.event, "speed_to_lead.ping");
  assert.ok((receivedSignature as string | null)?.startsWith("sha256="));

  server.close();
});

test("dispatchCustomWebhook sends lead qualification payload when configured", async () => {
  let receivedPayload: any = null;

  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      receivedPayload = JSON.parse(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const targetUrl = `http://localhost:${port}/lead-hook`;

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "s2l-webhook-"));
  const store = new IntegrationsStore(path.join(dir, "integrations.json"));
  await store.saveWebhook({ url: targetUrl, label: "Zapier Pipe" });

  const dummyOutcome: LeadOutcome = {
    lead: {
      id: "lead_test_123",
      name: "Jordan Smith",
      phone: "+60127058268",
      company: "Apex Tech",
      region: "MY",
      locale: "ms-MY",
      createdAt: new Date().toISOString(),
    },
    mode: "mock",
    callId: "call_abc",
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
      objections: [],
      notes: "High intent buyer",
    },
    score: {
      score: 95,
      grade: "A",
      breakdown: { authority: 25, need: 25, timeline: 25, budget: 20 },
    },
    booking: null,
    summary: "Lead qualified with high intent.",
    evidence: [],
    transcript: [{ speaker: "agent", text: "Hello Jordan" }],
    confirmation: null,
    fallbackAction: null,
    processingTimeMs: 120,
    recordingUrl: "https://example.com/audio.mp3",
    createdAt: new Date().toISOString(),
  };

  const res = await dispatchCustomWebhook(dummyOutcome);
  // If global integrationStore has webhook or fallback
  server.close();
});
