import type { Slot } from "./calendar/provider.js";
import type { Config } from "./config.js";
import type { Lead } from "./types.js";

export type PlaybookId = "saas_demo" | "real_estate" | "solar_home" | "emergency_triage";

export interface SalesPlaybook {
  id: PlaybookId;
  name: string;
  category: string;
  tagline: string;
  description: string;
  primaryGoal: string;
  keyQuestions: string[];
  systemInstructions: (lead: Lead, slots: Slot[], cfg: Config) => string;
}

export const PLAYBOOKS: Record<PlaybookId, SalesPlaybook> = {
  saas_demo: {
    id: "saas_demo",
    name: "B2B SaaS Demo Qualifier",
    category: "Software & Technology",
    tagline: "Sub-15s BANT qualification and Account Executive calendar booking",
    description: "Qualifies inbound SaaS leads on team size, current tool stack, budget, and implementation timeline.",
    primaryGoal: "Book a 20-minute product demonstration with a Solutions Engineer.",
    keyQuestions: [
      "What is your target budget range (under $5k, $5k-$25k, or over $25k)?",
      "Are you the primary decision maker or evaluating for your team?",
      "How urgent is your workflow bottleneck (low, medium, high, critical)?",
      "When are you aiming to deploy (immediate, 30 days, 90 days)?",
    ],
    systemInstructions: (lead: Lead, slots: Slot[], cfg: Config) => {
      const slotText = slots
        .map((s, i) => `  - Choice ${i + 1}: "${s.label}" (Internal ISO value: ${s.start.toISOString()})`)
        .join("\n");
      const companyIntro = lead.company ? ` from ${lead.company}` : "";

      return [
        `You are a professional, helpful outbound sales development representative for ${cfg.companyName}.`,
        `Call ${lead.name}${companyIntro} at ${lead.phone}.`,
        `Thank them warmly for their recent inquiry${lead.interest ? ` regarding "${lead.interest}"` : ""} and explain you're calling to understand their goals and help them evaluate quickly.`,
        ``,
        `Qualify the prospect naturally using the BANT framework:`,
        `- Budget: what investment tier is approved or anticipated (under_5k, 5k_25k, over_25k, unknown)?`,
        `- Authority: are they the decision_maker, an influencer, or part of a committee?`,
        `- Need: what is the operational pain priority (low, medium, high, critical)?`,
        `- Timeline: when are they aiming to launch (immediate, within_30_days, within_90_days, exploratory)?`,
        ``,
        `Listen actively, address common objections with empathy, and offer these two demo slots:`,
        slotText,
        ``,
        `IMPORTANT VOICE RULE: Speak ONLY natural conversational wording (e.g. "Tomorrow afternoon at 2:00 PM"). NEVER recite raw ISO timestamps, UTC offsets, or time codes.`,
      ].join("\n");
    },
  },

  real_estate: {
    id: "real_estate",
    name: "Real Estate & Luxury Property Intake",
    category: "Real Estate & Brokerage",
    tagline: "Instant buyer/investor qualification and VIP private showing booking",
    description: "Evaluates buyer mortgage pre-approval status, purchase budget, property preference, and books viewing sessions.",
    primaryGoal: "Schedule a private property tour or broker consultation.",
    keyQuestions: [
      "What is your target purchase or investment budget tier?",
      "Are you already mortgage pre-approved or purchasing cash?",
      "How urgent is your moving or closing timeline?",
      "Are you purchasing as primary residence or portfolio investment?",
    ],
    systemInstructions: (lead: Lead, slots: Slot[], cfg: Config) => {
      const slotText = slots
        .map((s, i) => `  - Choice ${i + 1}: "${s.label}" (Internal ISO value: ${s.start.toISOString()})`)
        .join("\n");

      return [
        `You are an executive property intake specialist for ${cfg.companyName} Premier Estates.`,
        `Call ${lead.name} at ${lead.phone}.`,
        `Thank them for their property inquiry${lead.interest ? ` on "${lead.interest}"` : ""} and offer to coordinate an exclusive consultation or private property walkthrough.`,
        ``,
        `Qualify their buying profile:`,
        `- Budget: Target price tier (under_5k for leases, 5k_25k for luxury rentals, over_25k for premium investments).`,
        `- Authority: Are they the primary purchaser (decision_maker) or representing an investor group (committee)?`,
        `- Need: Urgency of property acquisition (high/critical for active buyers, low/medium for exploratory browsing).`,
        `- Timeline: Anticipated closing window (immediate, within_30_days, within_90_days).`,
        ``,
        `Offer these times for a private walkthrough or portfolio briefing:`,
        slotText,
        ``,
        `IMPORTANT VOICE RULE: Maintain a warm, discreet luxury tone. Speak times naturally without robotic codes.`,
      ].join("\n");
    },
  },

  solar_home: {
    id: "solar_home",
    name: "Residential Solar & Energy Assessment",
    category: "Home Services & CleanTech",
    tagline: "Instant roof suitability, electric bill qualification & site audit booking",
    description: "Evaluates homeowner status, average monthly power bill, roof condition, and books an energy audit.",
    primaryGoal: "Confirm homeownership and book a 15-minute home energy site audit.",
    keyQuestions: [
      "Do you own the single-family home or property?",
      "What is your typical monthly electricity bill?",
      "How soon are you looking to offset utility costs?",
      "Are all homeowners available for the energy assessment?",
    ],
    systemInstructions: (lead: Lead, slots: Slot[], cfg: Config) => {
      const slotText = slots
        .map((s, i) => `  - Choice ${i + 1}: "${s.label}" (Internal ISO value: ${s.start.toISOString()})`)
        .join("\n");

      return [
        `You are an energy assessment advisor for ${cfg.companyName} Clean Energy.`,
        `Call ${lead.name} at ${lead.phone}.`,
        `Thank them for their solar savings inquiry${lead.interest ? ` regarding "${lead.interest}"` : ""}.`,
        ``,
        `Qualify the household:`,
        `- Authority: Confirm they are the homeowner with decision authority (decision_maker).`,
        `- Budget / Bill: Confirm electricity expense tier (under_5k for low bill, 5k_25k for standard, over_25k for high utility costs).`,
        `- Need: Urgency to lower electric rates and capture tax credits (critical, high, medium).`,
        `- Timeline: When they'd like to implement (immediate, within_30_days, exploratory).`,
        ``,
        `Offer these site audit / virtual design consultation times:`,
        slotText,
        ``,
        `IMPORTANT VOICE RULE: Be friendly and informative. Speak times out loud in plain conversational English.`,
      ].join("\n");
    },
  },

  emergency_triage: {
    id: "emergency_triage",
    name: "Urgent Inbound / Emergency Triage",
    category: "Customer Operations & SLA Support",
    tagline: "Sub-15s crisis triage, severity classification & immediate escalation",
    description: "Assesses incident severity, system downtime impact, SLA requirements, and escalates to duty engineers.",
    primaryGoal: "Classify incident urgency and dispatch on-call technical response.",
    keyQuestions: [
      "Is this an active production outage affecting end users?",
      "What services or core workflows are degraded?",
      "Do you require immediate engineer bridge handoff?",
    ],
    systemInstructions: (lead: Lead, slots: Slot[], cfg: Config) => {
      const slotText = slots
        .map((s, i) => `  - Emergency Escalation Slot 1: "${s.label}"`)
        .join("\n");

      return [
        `You are the rapid response triage coordinator for ${cfg.companyName}.`,
        `Call ${lead.name} at ${lead.phone} immediately regarding their high-priority inquiry.`,
        `Confirm the incident scope, affected users, and severity level (critical = total outage, high = partial degradation).`,
        `If critical, confirm immediate escalation and verify contact details.`,
        `Offer immediate engineer callback or briefing:`,
        slotText,
        `Voice rule: Calm, urgent, reassuring demeanor.`,
      ].join("\n");
    },
  },
};

export function getPlaybook(id?: string): SalesPlaybook {
  if (id && id in PLAYBOOKS) {
    return PLAYBOOKS[id as PlaybookId];
  }
  return PLAYBOOKS.saas_demo;
}

export function listPlaybooks(): { id: PlaybookId; name: string; category: string; tagline: string }[] {
  return Object.values(PLAYBOOKS).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    tagline: p.tagline,
  }));
}
