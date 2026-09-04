import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { IntegrationsStore } from "../src/notifications/integration-store.js";

test("IntegrationsStore dynamically persists and retrieves Slack and Twilio credentials", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "s2l-integrations-"));
  const filePath = path.join(dir, "integrations.json");
  const store = new IntegrationsStore(filePath);

  const initialSlack = await store.getSlack({});
  assert.equal(initialSlack.connected, false);

  await store.saveSlack({
    webhookUrl: "https://hooks.slack.com/services/TEST/123/456",
    channel: "#sales-inbound",
  });

  const updatedSlack = await store.getSlack({});
  assert.equal(updatedSlack.connected, true);
  assert.equal(updatedSlack.channel, "#sales-inbound");

  await store.saveTwilio({
    accountSid: "AC1234567890",
    authToken: "token_abc_xyz",
    phoneNumber: "+14155550199",
  });

  const updatedTwilio = await store.getTwilio({});
  assert.equal(updatedTwilio.connected, true);
  assert.equal(updatedTwilio.phoneNumber, "+14155550199");

  await store.clearSlack();
  const clearedSlack = await store.getSlack({});
  assert.equal(clearedSlack.connected, false);
});
