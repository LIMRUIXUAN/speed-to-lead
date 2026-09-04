import {
  CalleAPIError,
  CalleClient,
  CalleConnectionError,
  CalleRateLimitError,
  CalleTimeoutError,
  type Call,
  type JsonObject,
} from "@call-e/calle";
import type { Config } from "./config.js";
import { eventsHub } from "./events.js";
import { getPlaybook, type PlaybookId } from "./playbooks.js";
import { withRetry } from "./retry.js";
import { AUTHORITIES, BUDGETS, NEEDS, TIMELINES, type Lead, type Qualification } from "./types.js";
import type { Slot } from "./calendar/provider.js";

/**
 * BANT qualification schema. CALL-E validates the live call against this and
 * returns `structuredResult` only when the conversation produced matching
 * evidence — this is what prevents ghost bookings and hallucinated answers.
 */
export const BANT_RESULT_SCHEMA: JsonObject = {
  type: "object",
  required: [
    "qualified",
    "budget",
    "authority",
    "need",
    "timeline",
    "accepted_demo",
    "selected_slot",
    "objections",
    "notes",
  ],
  properties: {
    qualified: { type: "boolean" },
    budget: { type: "string", enum: [...BUDGETS] },
    authority: { type: "string", enum: [...AUTHORITIES] },
    need: { type: "string", enum: [...NEEDS] },
    timeline: { type: "string", enum: [...TIMELINES] },
    accepted_demo: { type: "boolean" },
    selected_slot: { type: "string" },
    objections: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
  },
};

export type BuyerSentiment = "positive" | "receptive" | "neutral" | "skeptical" | "frustrated";

export interface QualifierResult {
  mode: "live" | "mock";
  callId: string | null;
  status: string;
  taskCompleted: boolean | null;
  completionConfidence: { score: number; label: string } | null;
  qualification: Qualification;
  sentiment: BuyerSentiment;
  playbookId: PlaybookId;
  summary: string | null;
  evidence: string[];
  transcript: { speaker: string; text: string }[];
  recordingUrl?: string | null;
}

export function computeSentiment(qualification: Qualification): BuyerSentiment {
  if (qualification.accepted_demo && qualification.qualified) return "positive";
  if (qualification.qualified && qualification.objections.length > 0) return "receptive";
  if (qualification.qualified) return "positive";
  if (qualification.objections.some(o => o.toLowerCase().includes("competitor") || o.toLowerCase().includes("decline"))) {
    return "skeptical";
  }
  return "neutral";
}

/** Build the natural-language goal CALL-E executes over the phone with automatic language adaptation. */
export function buildTask(lead: Lead, slots: Slot[], cfg: Config, playbookId?: string): string {
  const playbook = getPlaybook(playbookId);
  const baseTask = playbook.systemInstructions(lead, slots, cfg);

  // Multilingual regional dialect and greeting guidance
  let languageDirective = `Speak naturally in English (US).`;
  if (lead.locale?.startsWith("ms") || lead.region === "MY") {
    languageDirective = `The caller is located in Malaysia (MY). Speak in polite Malaysian Business English or Bahasa Malaysia if the prospect prefers ("Selamat sejahtera / Hello ${lead.name}, saya follow-up dari ${cfg.companyName}").`;
  } else if (lead.locale?.startsWith("es") || lead.region === "ES" || lead.region === "MX") {
    languageDirective = `The caller is in a Spanish-speaking region (${lead.region || "ES"}). Speak in natural, professional Spanish ("Hola ${lead.name}, le llamo de ${cfg.companyName} con respecto a su solicitud").`;
  } else if (lead.locale?.startsWith("de") || lead.region === "DE") {
    languageDirective = `The caller is in Germany (DE). Speak in professional German ("Guten Tag ${lead.name}, ich rufe von ${cfg.companyName} bezüglich Ihrer Anfrage an").`;
  } else if (lead.locale?.startsWith("ja") || lead.region === "JP") {
    languageDirective = `The caller is in Japan (JP). Speak in polite business Japanese (Keigo: "いつもお世話になっております。${cfg.companyName}の担当者でございます").`;
  } else if (lead.locale?.startsWith("fr") || lead.region === "FR") {
    languageDirective = `The caller is in France (FR). Speak in professional French ("Bonjour ${lead.name}, je vous contacte de la part de ${cfg.companyName}").`;
  } else if (lead.locale?.startsWith("en-GB") || lead.region === "GB") {
    languageDirective = `The caller is in the United Kingdom. Speak with British English spelling and natural UK phrasing.`;
  }

  return [
    baseTask,
    ``,
    `LANGUAGE DIRECTIVE: ${languageDirective}`,
    ``,
    `If they select a time, set accepted_demo to true and store the corresponding Internal ISO value in selected_slot. If they decline or prefer a different time, set accepted_demo to false and leave selected_slot empty.`,
    ``,
    `Return the complete qualification strictly in the required JSON result schema.`,
  ].join("\n");
}

/** Retry only transient failures; never re-run a rejected/terminal request. */
function isRetryableCalleError(error: unknown): boolean {
  if (error instanceof CalleConnectionError || error instanceof CalleTimeoutError || error instanceof CalleRateLimitError) {
    return true;
  }
  if (error instanceof CalleAPIError) return error.status >= 500;
  return false;
}

/** Trigger the real CALL-E outbound call and wait for the terminal result. */
export async function qualifyLead(
  lead: Lead,
  slots: Slot[],
  cfg: Config,
  idempotencyKey: string,
  playbookId?: PlaybookId,
): Promise<QualifierResult> {
  const chosenPlaybook: PlaybookId = playbookId ?? "saas_demo";

  eventsHub.emitEvent(
    "call:dialing",
    {
      leadId: lead.id,
      phone: lead.phone,
      name: lead.name,
      company: lead.company,
      playbook: chosenPlaybook,
      mode: cfg.calleMode,
    },
    { leadId: lead.id },
  );

  if (cfg.calleMode === "mock") return mockQualify(lead, slots, cfg, chosenPlaybook);

  const client = new CalleClient({ apiKey: cfg.calleApiKey, baseUrl: cfg.calleBaseUrl });
  const call = await withRetry(
    () =>
      client.calls.createAndWait(
        {
          task: buildTask(lead, slots, cfg, chosenPlaybook),
          recipient: { phones: [lead.phone], region: lead.region ?? "US", locale: lead.locale ?? "en-US" },
          resultSchema: BANT_RESULT_SCHEMA,
          metadata: {
            lead_id: lead.id,
            source: lead.source ?? "webhook",
            company: lead.company ?? null,
            playbook: chosenPlaybook,
          },
        },
        { idempotencyKey, timeoutMs: cfg.callTimeoutMs, intervalMs: 5000 },
      ),
    { maxAttempts: 4, shouldRetry: isRetryableCalleError },
  );

  return toResult(call, chosenPlaybook);
}

function toResult(call: Call, playbookId: PlaybookId): QualifierResult {
  const recordingUrl =
    (call as unknown as { recordingUrl?: string; recording?: { url?: string } }).recordingUrl ||
    (call as unknown as { recording?: { url?: string } }).recording?.url ||
    null;

  const qualification = normalizeQualification(call.structuredResult);
  const sentiment = computeSentiment(qualification);

  const transcript = (call.recipients?.[0]?.attempts?.[0]?.transcriptTurns ?? []).map((t) => ({
    speaker: t.speaker,
    text: t.text,
  }));

  const leadId = (call.metadata?.lead_id as string) || undefined;

  eventsHub.emitEvent(
    "call:connected",
    {
      callId: call.id,
      leadId,
      status: call.status,
    },
    { leadId, callId: call.id },
  );

  for (let i = 0; i < transcript.length; i++) {
    eventsHub.emitEvent(
      "call:turn",
      {
        turnIndex: i,
        speaker: transcript[i].speaker,
        text: transcript[i].text,
      },
      { leadId, callId: call.id },
    );
  }

  eventsHub.emitEvent(
    "call:analyzing",
    {
      callId: call.id,
      leadId,
      qualification,
      sentiment,
      taskCompleted: call.taskCompleted,
    },
    { leadId, callId: call.id },
  );

  return {
    mode: "live",
    callId: call.id,
    status: call.status,
    taskCompleted: call.taskCompleted,
    completionConfidence: call.completionConfidence
      ? { score: call.completionConfidence.score, label: call.completionConfidence.label }
      : null,
    qualification,
    sentiment,
    playbookId,
    summary: call.summary,
    evidence: call.evidence ?? [],
    transcript,
    recordingUrl,
  };
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Coerce CALL-E's structured result into a typed, always-valid Qualification. */
export function normalizeQualification(raw: unknown): Qualification {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    qualified: r.qualified === true,
    budget: oneOf(r.budget, BUDGETS, "unknown"),
    authority: oneOf(r.authority, AUTHORITIES, "unknown"),
    need: oneOf(r.need, NEEDS, "unknown"),
    timeline: oneOf(r.timeline, TIMELINES, "unknown"),
    accepted_demo: r.accepted_demo === true,
    selected_slot: typeof r.selected_slot === "string" ? r.selected_slot : "",
    objections: Array.isArray(r.objections) ? r.objections.filter((x): x is string => typeof x === "string") : [],
    notes: typeof r.notes === "string" ? r.notes : "",
  };
}

function hashPhone(phone: string): number {
  let h = 0;
  for (const ch of phone) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Deterministic offline simulation so the whole pipeline runs without credits. */
function mockQualify(lead: Lead, slots: Slot[], cfg: Config, playbookId: PlaybookId = "saas_demo"): QualifierResult {
  const h = hashPhone(lead.phone);
  const qualified = h % 5 !== 0;
  const accepted = qualified && h % 3 !== 0;
  let objections: string[] = [];
  if (lead.name.toLowerCase().includes("vance")) {
    objections = ["Requires SOC2 Type II compliance verification"];
  } else if (lead.name.toLowerCase().includes("chen")) {
    objections = ["Needs API webhook docs for growth engineering review"];
  } else if (lead.name.toLowerCase().includes("rivera")) {
    objections = ["Currently testing open-source alternative", "Budget allocated next quarter"];
  } else if (!qualified) {
    objections = ["Not the right time", "Already evaluating competitor"];
  }

  const qualification: Qualification = {
    qualified,
    budget: BUDGETS[h % BUDGETS.length],
    authority: AUTHORITIES[h % AUTHORITIES.length],
    need: NEEDS[(h + 1) % NEEDS.length],
    timeline: TIMELINES[(h + 2) % TIMELINES.length],
    accepted_demo: accepted,
    selected_slot: accepted && slots[0] ? slots[0].start.toISOString() : "",
    objections,
    notes: `Simulated BANT qualification (CALLE_MODE=mock, Playbook=${playbookId}).`,
  };

  const sentiment = computeSentiment(qualification);

  let transcript = [
    { speaker: "bot", text: `Hi ${lead.name}, this is ${cfg.companyName}. I'm following up on your recent inquiry.` },
    { speaker: "user", text: qualified ? "Yes, we're actively looking for an automated voice solution." : "Not a good time, thanks." },
  ];

  if (lead.region === "MY" || lead.phone.startsWith("+60")) {
    transcript = [
      { speaker: "bot", text: `Selamat pagi / Hi ${lead.name}, this is ${cfg.companyName} calling regarding your inbound lead automation inquiry.` },
      { speaker: "user", text: qualified ? "Hello! Yes, we want to cut down our response time under 15 seconds across our APAC team." : "Hi, not interested currently." },
      { speaker: "bot", text: qualified ? `Understood. Would tomorrow morning or tomorrow afternoon work best for a 20-minute executive walkthrough?` : "No problem at all, have a great day." },
      { speaker: "user", text: qualified ? (accepted ? "Tomorrow morning at 10 AM works great for us!" : "Let me check with my team first.") : "" },
    ].filter((t) => Boolean(t.text));
  } else if (lead.region === "ES" || lead.region === "MX" || lead.phone.startsWith("+34") || lead.phone.startsWith("+52")) {
    transcript = [
      { speaker: "bot", text: `Hola ${lead.name}, le llamo de ${cfg.companyName} para dar seguimiento a su solicitud de demostración.` },
      { speaker: "user", text: qualified ? "Hola, sí, estamos evaluando soluciones para calificar prospectos automáticamente." : "Por ahora no estamos interesados." },
      { speaker: "bot", text: qualified ? "¿Le gustaría agendar una breve sesión mañana por la mañana o por la tarde?" : "Comprendido, que tenga un excelente día." },
      { speaker: "user", text: qualified ? (accepted ? "Mañana por la mañana sería perfecto." : "Prefiero consultarlo con mi equipo primero.") : "" },
    ].filter((t) => Boolean(t.text));
  } else if (qualified && accepted) {
    transcript.push(
      { speaker: "bot", text: `Great! I have slots open for tomorrow morning and afternoon. Which works best for you?` },
      { speaker: "user", text: `Tomorrow morning works best for my schedule.` },
      { speaker: "bot", text: `Perfect, I've reserved tomorrow morning and sent an invitation with a Google Meet link to your email.` },
    );
  }

  const callId = `mock_${lead.id}`;

  eventsHub.emitEvent(
    "call:connected",
    {
      callId,
      leadId: lead.id,
      status: "in_progress",
    },
    { leadId: lead.id, callId },
  );

  for (let i = 0; i < transcript.length; i++) {
    eventsHub.emitEvent(
      "call:turn",
      {
        turnIndex: i,
        speaker: transcript[i].speaker,
        text: transcript[i].text,
      },
      { leadId: lead.id, callId },
    );
  }

  eventsHub.emitEvent(
    "call:analyzing",
    {
      callId,
      leadId: lead.id,
      qualification,
      sentiment,
      taskCompleted: true,
    },
    { leadId: lead.id, callId },
  );

  return {
    mode: "mock",
    callId,
    status: "completed",
    taskCompleted: true,
    completionConfidence: { score: 0.94, label: "high" },
    qualification,
    sentiment,
    playbookId,
    summary: qualified ? `Prospect qualified with ${qualification.need} pain priority and confirmed demo slot.` : "Prospect not qualified at this time.",
    evidence: qualified ? [`${lead.name} confirmed authority and selected demo slot.`] : [`${lead.name} declined to proceed.`],
    transcript,
    recordingUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  };
}
