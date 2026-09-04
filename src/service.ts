import { randomUUID } from "node:crypto";
import { bookingsStore, buildGoogleCalendarUrl } from "./calendar/index.js";
import type { Booking, CalendarProvider, Slot } from "./calendar/provider.js";
import type { Config } from "./config.js";
import type { CrmLeadRecord, CrmProvider } from "./crm/provider.js";
import { qualifyLead, type BuyerSentiment } from "./calle.js";
import { eventsHub } from "./events.js";
import { dispatchCustomWebhook, dispatchSms, sendSlackNotification } from "./notifications/index.js";
import type { PlaybookId } from "./playbooks.js";
import { scoreLead, type LeadScore } from "./scoring.js";
import type { Lead, Qualification } from "./types.js";

export interface ServiceDeps {
  config: Config;
  calendar: CalendarProvider;
  crm: CrmProvider;
}

export interface ConfirmationAction {
  channel: "sms" | "email";
  recipient: string;
  message: string;
  sentAt: string;
}

export interface FallbackAction {
  type: "reschedule_sms" | "followup_task";
  recipient: string;
  reason: string;
  suggestedAction: string;
}

/** Complete outcome returned to the webhook caller. */
export interface LeadOutcome {
  lead: Lead;
  mode: string;
  callId: string | null;
  status: string;
  taskCompleted: boolean | null;
  qualification: Qualification;
  sentiment?: BuyerSentiment;
  playbookId?: PlaybookId;
  dealId?: string;
  score: LeadScore;
  booking: Booking | null;
  summary: string | null;
  evidence: string[];
  transcript: { speaker: string; text: string }[];
  confirmation: ConfirmationAction | null;
  fallbackAction: FallbackAction | null;
  processingTimeMs: number;
  recordingUrl?: string | null;
  createdAt: string;
}

function resolveSlot(selectedIso: string, slots: Slot[]): Slot | null {
  if (!selectedIso) return null;
  const match = slots.find((s) => s.start.toISOString() === selectedIso);
  if (match) return match;
  const parsed = new Date(selectedIso);
  if (Number.isNaN(parsed.getTime())) return null;
  return { start: parsed, end: new Date(parsed.getTime() + 30 * 60_000), label: "Selected on call" };
}

/**
 * End-to-end pipeline: fetch slots -> qualify via CALL-E -> score -> book -> CRM -> post-call actions.
 */
export async function processLead(
  lead: Lead,
  deps: ServiceDeps,
  idempotencyKey: string = randomUUID(),
  playbookId?: PlaybookId,
): Promise<LeadOutcome> {
  const startTime = Date.now();

  eventsHub.emitEvent(
    "lead:received",
    {
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      company: lead.company,
      interest: lead.interest,
      playbookId: playbookId ?? "saas_demo",
      idempotencyKey,
    },
    { leadId: lead.id },
  );

  const slots = await deps.calendar.availableSlots();
  const result = await qualifyLead(lead, slots, deps.config, idempotencyKey, playbookId);
  const score = scoreLead(result.qualification);

  let booking: Booking | null = null;
  if (result.qualification.accepted_demo) {
    const slot = resolveSlot(result.qualification.selected_slot, slots);
    if (slot) {
      booking = await deps.calendar.book(slot, { name: lead.name, phone: lead.phone, email: lead.email });
      if (booking.status === "booked") {
        if (!booking.googleCalendarUrl) {
          booking.googleCalendarUrl = buildGoogleCalendarUrl({
            title: `⚡ ${deps.config.companyName} Demo with ${lead.name}`,
            start: booking.start ?? slot.start,
            end: booking.end ?? slot.end,
            description: `Autonomous Speed-to-Lead Demo Qualification.\nProspect: ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email || "N/A"}\nCompany: ${lead.company || "N/A"}\nBANT Score: ${score.score} (${score.grade})\nNotes: ${result.summary || "Qualified via CALL-E"}`,
            location: `Phone Call: ${lead.phone}`,
          });
        }

        // Persist to durable Bookings Collection
        await bookingsStore.append({
          id: booking.id,
          leadId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          leadEmail: lead.email,
          leadCompany: lead.company,
          start: (booking.start ?? slot.start).toISOString(),
          end: (booking.end ?? slot.end).toISOString(),
          slotLabel: slot.label,
          provider: booking.provider,
          googleCalendarUrl: booking.googleCalendarUrl,
          status: "booked",
          score,
          qualification: result.qualification,
          summary: result.summary ?? "",
          createdAt: new Date().toISOString(),
        });

        eventsHub.emitEvent(
          "booking:confirmed",
          {
            bookingId: booking.id,
            slotLabel: slot.label,
            provider: booking.provider,
            googleCalendarUrl: booking.googleCalendarUrl,
          },
          { leadId: lead.id, callId: result.callId ?? undefined },
        );
      }
    }
  }

  const createdAt = new Date().toISOString();
  const record: CrmLeadRecord = {
    lead,
    mode: result.mode,
    callId: result.callId,
    qualification: result.qualification,
    score,
    booking,
    summary: result.summary,
    createdAt,
  };
  const crmRes = await deps.crm.write(record);

  eventsHub.emitEvent(
    "crm:synced",
    {
      crmRecordId: crmRes.id,
      provider: deps.crm.name,
      dealId: (crmRes as { dealId?: string }).dealId,
    },
    { leadId: lead.id, callId: result.callId ?? undefined },
  );

  // Generate automated post-call multi-channel actions
  let confirmation: ConfirmationAction | null = null;
  let fallbackAction: FallbackAction | null = null;

  if (booking && booking.status === "booked") {
    const slotLabel = result.qualification.selected_slot || "your chosen time";
    const gcalLink = booking.googleCalendarUrl ? `\nCalendar: ${booking.googleCalendarUrl}` : "";
    const smsMessage = `Hi ${lead.name}, your ${deps.config.companyName} demo is confirmed for ${slotLabel}.${gcalLink}`;

    // Dispatch real SMS via Twilio if configured
    await dispatchSms(lead.phone, smsMessage, deps.config);

    confirmation = {
      channel: "sms",
      recipient: lead.phone,
      message: smsMessage,
      sentAt: new Date().toISOString(),
    };
  } else if (result.status === "failed" || result.taskCompleted === false) {
    const rescheduleUrl = booking?.googleCalendarUrl || `https://cal.com/${deps.config.companyName.toLowerCase()}/intro`;
    const fallbackMessage = `Hi ${lead.name}, we missed you on our quick call! You can book your demo directly here: ${rescheduleUrl}`;

    await dispatchSms(lead.phone, fallbackMessage, deps.config);

    fallbackAction = {
      type: "reschedule_sms",
      recipient: lead.phone,
      reason: result.status === "failed" ? "Call unreachable or telephony fault" : "Prospect did not complete qualification",
      suggestedAction: `Dispatched self-service booking link via SMS: ${rescheduleUrl}`,
    };
  }

  eventsHub.emitEvent(
    "notifications:dispatched",
    {
      confirmationChannel: confirmation?.channel,
      fallbackType: fallbackAction?.type,
    },
    { leadId: lead.id, callId: result.callId ?? undefined },
  );

  const processingTimeMs = Date.now() - startTime;

  const outcome: LeadOutcome = {
    lead,
    mode: result.mode,
    callId: result.callId,
    status: result.status,
    taskCompleted: result.taskCompleted,
    qualification: result.qualification,
    sentiment: result.sentiment,
    playbookId: result.playbookId,
    dealId: (crmRes as { dealId?: string }).dealId,
    score,
    booking,
    summary: result.summary,
    evidence: result.evidence,
    transcript: result.transcript,
    recordingUrl: result.recordingUrl,
    confirmation,
    fallbackAction,
    processingTimeMs,
    createdAt,
  };

  eventsHub.emitEvent(
    "lead:completed",
    {
      leadId: lead.id,
      score: score.score,
      grade: score.grade,
      booked: Boolean(booking && booking.status === "booked"),
      processingTimeMs,
    },
    { leadId: lead.id, callId: result.callId ?? undefined },
  );

  // Asynchronously trigger Slack Sales Notification (non-blocking)
  if (deps.config.slackWebhookUrl) {
    void sendSlackNotification(outcome, deps.config);
  }

  // Asynchronously trigger Zapier / Make.com Webhook (non-blocking)
  void dispatchCustomWebhook(outcome);

  return outcome;
}
