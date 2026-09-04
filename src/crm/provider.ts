import type { Lead, Qualification } from "../types.js";
import type { LeadScore } from "../scoring.js";
import type { Booking } from "../calendar/provider.js";

/** Full pipeline record persisted to the CRM. */
export interface CrmLeadRecord {
  lead: Lead;
  mode: string;
  callId: string | null;
  qualification: Qualification;
  score: LeadScore;
  booking: Booking | null;
  summary: string | null;
  createdAt: string;
}

export interface CrmProvider {
  readonly name: string;
  write(record: CrmLeadRecord): Promise<{ id: string; provider: string }>;
}
