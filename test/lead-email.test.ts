import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEmailText } from "../src/routes/lead-submit.js";

test("parses structured forwarded Gmail notification", () => {
  const email = `
From: notifications@typeform.com
Subject: New Inbound Lead Submission

Prospect Name: Elena Rostova
Phone: +1 650 555 0144
Work Email: elena@quantum-logistics.io
Company: Quantum Logistics Global
Inquiry Notes: Looking for sub-15s AI voice qualification.
`;

  const parsed = parseEmailText(email);
  assert.equal(parsed.name, "Elena Rostova");
  assert.equal(parsed.phone, "+16505550144");
  assert.equal(parsed.email, "elena@quantum-logistics.io");
  assert.equal(parsed.company, "Quantum Logistics Global");
  assert.ok(parsed.interest?.includes("Looking for sub-15s"));
});

test("parses mailto: link format", () => {
  const mailto = "mailto:jordan.smith@summit.com?subject=Roofing%20Lead&body=Name:%20Jordan%20Smith%0APhone:%20%2B14155550100%0ACompany:%20Summit%20Roofing";
  const parsed = parseEmailText(mailto);
  assert.equal(parsed.name, "Jordan Smith");
  assert.equal(parsed.phone, "+14155550100");
  assert.equal(parsed.email, "jordan.smith@summit.com");
  assert.equal(parsed.company, "Summit Roofing");
});

test("falls back gracefully on unstructured email body", () => {
  const text = "Hi, this is Dave from Acme Corp (dave@acme.com, +12065550199). Please call us.";
  const parsed = parseEmailText(text);
  assert.equal(parsed.email, "dave@acme.com");
  assert.equal(parsed.phone, "+12065550199");
  assert.equal(parsed.name, "Dave");
  assert.equal(parsed.company, "Acme");
});
