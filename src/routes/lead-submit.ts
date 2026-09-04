import { randomUUID, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { bookingsStore, buildIcsContent } from "../calendar/index.js";
import { checkTcpaCompliance } from "../compliance.js";
import type { Config } from "../config.js";
import { eventsHub } from "../events.js";
import { increment } from "../metrics.js";
import { dispatchSms } from "../notifications/index.js";
import { listPlaybooks, type PlaybookId } from "../playbooks.js";
import { processLead, type ServiceDeps } from "../service.js";
import type { JsonFileStore } from "../store.js";
import { inferRegionAndLocale, normalizeE164, type Lead, type LeadInput } from "../types.js";

/** Constant-time string comparison to avoid leaking the secret via timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Parses raw forwarded Gmail messages, mailto links, and email inquiry bodies
 * into structured LeadInput fields.
 */
export function parseEmailText(rawInput: string): Partial<LeadInput> {
  let text = rawInput.trim();

  // If input is a mailto: URL, decode and parse query parameters
  if (text.toLowerCase().startsWith("mailto:")) {
    try {
      const url = new URL(text);
      const email = url.pathname || undefined;
      const params = url.searchParams;
      const subject = params.get("subject") ?? "";
      const body = params.get("body") ?? "";
      text = `Email: ${email}\nSubject: ${subject}\n${body}`;
    } catch {
      // If URL parsing fails, strip mailto: and continue regex extraction
      text = decodeURIComponent(text.replace(/^mailto:/i, ""));
    }
  }

  const result: Partial<LeadInput> = {};

  // 1. Extract Email (Prioritize explicit lead email fields over automated notification From headers)
  const explicitEmail = text.match(/(?:work email|lead email|contact email|email|e-mail):\s*([^\s<>]+@[^\s<>]+)/i);
  if (explicitEmail) {
    result.email = explicitEmail[1].trim();
  } else {
    const allEmails = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
    const nonSystemEmail = allEmails.find(e => !/(?:notifications?|no-?reply|mailer|daemon|support|info)@/i.test(e));
    if (nonSystemEmail) {
      result.email = nonSystemEmail.trim();
    } else if (typeof allEmails[0] === "string") {
      result.email = allEmails[0].trim();
    }
  }

  // 2. Extract Phone
  const phoneMatch = text.match(/(?:phone|tel|mobile|cell|contact):\s*([+\d\s().-]{7,25})/i) ||
                     text.match(/(\+\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/);
  if (phoneMatch) {
    const rawPhone = phoneMatch[1].trim();
    const normalized = normalizeE164(rawPhone);
    result.phone = normalized ?? rawPhone;
  }

  // 3. Extract Name
  const nameMatch = text.match(/(?:name|contact name|prospect|full name):\s*([^\r\n,;]+)/i) ||
                    text.match(/(?:hi|hello|dear)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  } else if (result.email) {
    // Derive name from email prefix if not present (e.g. jordan.smith@...)
    const prefix = result.email.split("@")[0].replace(/[._-]/g, " ");
    result.name = prefix.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  // 4. Extract Company
  const companyMatch = text.match(/(?:company|organization|business|corp|org):\s*([^\r\n,;]+)/i);
  if (companyMatch) {
    result.company = companyMatch[1].trim();
  } else if (result.email) {
    const domain = result.email.split("@")[1]?.split(".")[0];
    if (domain && !["gmail", "yahoo", "hotmail", "outlook", "icloud"].includes(domain.toLowerCase())) {
      result.company = domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  }

  // 5. Extract Interest / Inquiry (Prioritize explicit inquiry notes/message over subject lines)
  const explicitInterest = text.match(/(?:inquiry notes|lead interest|project notes|interest|message|inquiry|notes|pain|needs?):\s*([^\r\n]+)/i);
  if (explicitInterest) {
    result.interest = explicitInterest[1].trim();
  } else {
    const subjectMatch = text.match(/(?:subject):\s*([^\r\n]+)/i);
    if (subjectMatch && !/^(?:new lead|inbound lead|fwd:|re:)/i.test(subjectMatch[1].trim())) {
      result.interest = subjectMatch[1].trim();
    } else {
      result.interest = "Inbound Email Lead via Gmail";
    }
  }

  return result;
}

export function registerLeadRoutes(
  app: FastifyInstance,
  config: Config,
  deps: ServiceDeps,
  store: JsonFileStore,
): void {
  // Real-time SSE event pipeline for live dashboard monitoring
  app.get("/api/events/stream", async (req, reply) => {
    eventsHub.registerClient(reply);
  });

  // List available industry sales playbooks
  app.get("/api/playbooks", async (req, reply) => {
    return reply.code(200).send({ ok: true, playbooks: listPlaybooks() });
  });

  // Pre-call TCPA & quiet hours compliance lookup
  app.get("/api/compliance/check", async (req, reply) => {
    const { phone } = (req.query as { phone?: string }) ?? {};
    if (!phone) {
      return reply.code(400).send({ error: "phone query parameter is required" });
    }
    const normalized = normalizeE164(phone);
    if (!normalized) {
      return reply.code(400).send({ error: "phone must be a valid E.164 number" });
    }
    const compliance = checkTcpaCompliance(normalized);
    return reply.code(200).send({ ok: true, compliance });
  });

  // Query recent processed leads
  app.get("/api/leads", async (req, reply) => {
    const list = await store.list(50);
    return reply.code(200).send({ ok: true, count: list.length, leads: list.map((item) => item.value) });
  });

  // Query Google Calendar / Demo bookings collection
  app.get("/api/bookings", async (req, reply) => {
    const bookings = await bookingsStore.list(100);
    return reply.code(200).send({ ok: true, count: bookings.length, bookings });
  });

  // Download .ics calendar event file for direct import to Google / Apple / Outlook Calendar
  app.get("/api/bookings/:id/ics", async (req, reply) => {
    const { id } = req.params as { id: string };
    const booking = await bookingsStore.get(id);
    if (!booking) {
      return reply.code(404).send({ error: "not_found", message: `No booking found for id ${id}` });
    }
    const ics = buildIcsContent({
      id: booking.id,
      title: `⚡ ${config.companyName} Demo with ${booking.leadName}`,
      start: new Date(booking.start),
      end: new Date(booking.end),
      description: `Speed-to-Lead Autonomous AI Demo.\nLead: ${booking.leadName}\nPhone: ${booking.leadPhone}\nCompany: ${booking.leadCompany || "N/A"}\nNotes: ${booking.summary || ""}`,
      location: `Phone Call: ${booking.leadPhone}`,
      attendeeName: booking.leadName,
      attendeeEmail: booking.leadEmail,
    });

    reply.header("Content-Type", "text/calendar; charset=utf-8");
    reply.header(
      "Content-Disposition",
      `attachment; filename="demo-${booking.leadName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.ics"`,
    );
    return reply.send(ics);
  });

  // Query specific lead outcome or async status
  app.get("/api/lead-status/:key", async (req, reply) => {
    const { key } = req.params as { key: string };
    const cached = await store.get(key);
    if (!cached) {
      return reply.code(404).send({ error: "not_found", message: `No record found for key ${key}` });
    }
    return reply.code(200).send(cached);
  });

  // Intelligent parser for forwarded Gmail emails, mailto links, and email notifications
  app.post("/api/parse-email", async (req, reply) => {
    const body = req.body as { raw?: string; mailto?: string } | null;
    const raw = (body?.raw ?? body?.mailto ?? "").trim();
    if (!raw) {
      return reply.code(400).send({ error: "raw email content or mailto link is required" });
    }

    const parsed = parseEmailText(raw);
    return reply.code(200).send({ ok: true, lead: parsed });
  });

  app.post("/api/lead-submit", async (req, reply) => {
    if (config.webhookSecret) {
      const provided = req.headers["x-webhook-secret"];
      if (typeof provided !== "string" || !safeEqual(provided, config.webhookSecret)) {
        return reply.code(401).send({ error: "unauthorized" });
      }
    }

    const body = req.body as (LeadInput & { async?: boolean; playbook?: PlaybookId; override_tcpa?: boolean }) | null;
    if (!body || typeof body.name !== "string" || !body.name.trim() || typeof body.phone !== "string") {
      return reply.code(400).send({ error: "name and phone are required" });
    }

    const phone = normalizeE164(body.phone);
    if (!phone) {
      return reply.code(400).send({ error: "phone must be a valid E.164 number (e.g. +14155550100)" });
    }

    // Auto-detect region and locale from country code prefix if not explicitly specified
    const { region, locale } = inferRegionAndLocale(phone, body.region, body.locale);

    const lead: Lead = {
      id: randomUUID(),
      name: body.name.trim(),
      phone,
      email: body.email?.trim() || undefined,
      company: body.company?.trim() || undefined,
      source: body.source?.trim() || undefined,
      interest: body.interest?.trim() || undefined,
      region,
      locale,
      createdAt: new Date().toISOString(),
    };

    const idempotencyKey =
      typeof body.idempotency_key === "string" && body.idempotency_key.trim()
        ? body.idempotency_key.trim()
        : `lead:${lead.id}`;

    const cached = await store.get(idempotencyKey);
    if (cached) {
      increment("leads_replayed");
      return reply.code(200).send({ replayed: true, ...(cached as Record<string, unknown>) });
    }

    // Evaluate TCPA quiet hours compliance (8:00 AM - 8:30 PM recipient local time)
    const compliance = checkTcpaCompliance(phone, new Date(), body.override_tcpa === true);
    eventsHub.emitEvent(
      "compliance:checked",
      { compliance, leadPhone: phone, leadName: lead.name },
      { leadId: lead.id },
    );

    if (!compliance.allowed) {
      increment("leads_total");
      const rescheduleUrl = `https://cal.com/${config.companyName.toLowerCase()}/intro`;
      const quietSms = `Hi ${lead.name}, thank you for reaching out to ${config.companyName}! Since it is currently outside permissible business hours in your timezone (${compliance.localTime}), our AI SDR will call you tomorrow morning at 9:00 AM, or you can pick a demo slot right now: ${rescheduleUrl}`;
      await dispatchSms(lead.phone, quietSms, config);

      const quietOutcome = {
        lead,
        status: "queued_quiet_hours",
        compliance,
        message: compliance.reason,
        fallbackAction: {
          type: "reschedule_sms",
          recipient: lead.phone,
          reason: "TCPA Quiet Hours Safeguard",
          suggestedAction: `Queued for ${compliance.nextPermissibleTime}. Sent SMS invite to ${lead.phone}.`,
        },
        createdAt: lead.createdAt,
      };
      await store.set(idempotencyKey, quietOutcome);
      return reply.code(200).send(quietOutcome);
    }

    // Check for async execution mode (recommended for third-party webhooks with strict timeouts)
    const isAsync =
      Boolean((req.query as Record<string, unknown>)?.async === "true") ||
      body.async === true ||
      req.headers["prefer"] === "respond-async";

    if (isAsync) {
      increment("leads_total");
      // Mark as queued immediately in store
      const pendingRecord = {
        lead,
        status: "queued",
        idempotencyKey,
        playbook: body.playbook ?? "saas_demo",
        createdAt: lead.createdAt,
        message: "Outbound call initiated in background.",
      };
      await store.set(idempotencyKey, pendingRecord);

      // Spawn background worker without holding the HTTP connection open
      (async () => {
        try {
          const outcome = await processLead(lead, deps, idempotencyKey, body.playbook);
          await store.set(idempotencyKey, outcome);
        } catch (err) {
          increment("leads_failed");
          req.log.error(err);
          await store.set(idempotencyKey, {
            lead,
            status: "failed",
            error: err instanceof Error ? err.message : String(err),
            failedAt: new Date().toISOString(),
          });
        }
      })();

      return reply.code(202).send({
        ok: true,
        status: "queued",
        leadId: lead.id,
        idempotencyKey,
        statusUrl: `/api/lead-status/${encodeURIComponent(idempotencyKey)}`,
      });
    }

    // Synchronous execution path
    increment("leads_total");
    try {
      const outcome = await processLead(lead, deps, idempotencyKey, body.playbook);
      await store.set(idempotencyKey, outcome);
      return reply.code(200).send(outcome);
    } catch (err) {
      increment("leads_failed");
      req.log.error(err);
      return reply.code(500).send({
        error: "lead processing failed",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
