import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  GoogleCalendarProvider,
  buildGoogleCalendarUrl,
  buildIcsContent,
} from "../src/calendar/google.js";
import { BookingsCollectionStore } from "../src/calendar/store.js";

test("buildGoogleCalendarUrl generates a valid Google Calendar template URL", () => {
  const start = new Date("2026-09-02T14:00:00Z");
  const end = new Date("2026-09-02T14:30:00Z");
  const url = buildGoogleCalendarUrl({
    title: "⚡ Acme Demo with Jordan Smith",
    start,
    end,
    description: "Lead score: 95/100",
    location: "Phone Call",
  });

  assert.ok(url.startsWith("https://calendar.google.com/calendar/render?"));
  assert.ok(url.includes("action=TEMPLATE"));
  assert.ok(url.includes("20260902T140000Z%2F20260902T143000Z"));
  assert.ok(url.includes("Jordan+Smith"));
});

test("buildIcsContent generates standard RFC 5545 iCalendar content", () => {
  const start = new Date("2026-09-02T14:00:00Z");
  const end = new Date("2026-09-02T14:30:00Z");
  const ics = buildIcsContent({
    id: "booking_123",
    title: "Speed-to-Lead Demo",
    start,
    end,
    description: "Discussion on AI voice qualification",
    attendeeName: "Jordan Smith",
    attendeeEmail: "jordan@example.com",
  });

  assert.ok(ics.includes("BEGIN:VCALENDAR"));
  assert.ok(ics.includes("BEGIN:VEVENT"));
  assert.ok(ics.includes("UID:booking_123@speed-to-lead.app"));
  assert.ok(ics.includes("DTSTART:20260902T140000Z"));
  assert.ok(ics.includes("DTEND:20260902T143000Z"));
  assert.ok(ics.includes("SUMMARY:Speed-to-Lead Demo"));
  assert.ok(ics.includes("ATTENDEE;CN=Jordan Smith;ROLE=REQ-PARTICIPANT:mailto:jordan@example.com"));
  assert.ok(ics.includes("END:VEVENT"));
  assert.ok(ics.includes("END:VCALENDAR"));
});

test("GoogleCalendarProvider provides slots and creates bookings with Google links", async () => {
  const provider = new GoogleCalendarProvider("Apex Solar");
  assert.equal(provider.name, "google");

  const slots = await provider.availableSlots();
  assert.equal(slots.length, 2);
  assert.ok(slots[0].start instanceof Date);

  const booking = await provider.book(slots[0], {
    name: "Elena Rostova",
    phone: "+16505550144",
    email: "elena@example.com",
  });

  assert.equal(booking.status, "booked");
  assert.equal(booking.provider, "google");
  assert.ok(booking.googleCalendarUrl?.includes("calendar.google.com"));
});

test("BookingsCollectionStore appends and retrieves durable bookings list", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "s2l-bookings-"));
  const filePath = path.join(dir, "bookings.jsonl");
  const store = new BookingsCollectionStore(filePath);

  const listBefore = await store.list();
  assert.equal(listBefore.length, 0);

  await store.append({
    id: "booking_abc",
    leadId: "lead_123",
    leadName: "Jordan Smith",
    leadPhone: "+14155550100",
    leadEmail: "jordan@example.com",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 1800000).toISOString(),
    slotLabel: "Tomorrow 2 PM",
    provider: "google",
    googleCalendarUrl: "https://calendar.google.com/...",
    status: "booked",
    createdAt: new Date().toISOString(),
  });

  const listAfter = await store.list();
  assert.equal(listAfter.length, 1);
  assert.equal(listAfter[0].leadName, "Jordan Smith");

  const fetched = await store.get("booking_abc");
  assert.ok(fetched);
  assert.equal(fetched.id, "booking_abc");
});
