import test from "node:test";
import assert from "node:assert/strict";
import { EventsHub } from "../src/events.js";

test("EventsHub stores recent events and notifies listeners", () => {
  const hub = new EventsHub();
  const received: unknown[] = [];

  hub.on("pipeline:event", (ev) => {
    received.push(ev);
  });

  const evt1 = hub.emitEvent("lead:received", { name: "Jordan Smith" }, { leadId: "lead_123" });
  assert.equal(evt1.type, "lead:received");
  assert.equal(evt1.leadId, "lead_123");
  assert.equal(received.length, 1);

  const evt2 = hub.emitEvent("call:connected", { status: "connected" }, { callId: "call_456" });
  assert.equal(evt2.type, "call:connected");
  assert.equal(received.length, 2);

  const history = hub.getRecentEvents();
  assert.equal(history.length, 2);
  assert.equal(history[0]?.id, evt1.id);
  assert.equal(history[1]?.id, evt2.id);
});

test("EventsHub clears history properly", () => {
  const hub = new EventsHub();
  hub.emitEvent("call:dialing", { phone: "+14155550100" });
  assert.equal(hub.getRecentEvents().length, 1);
  hub.clearHistory();
  assert.equal(hub.getRecentEvents().length, 0);
});
