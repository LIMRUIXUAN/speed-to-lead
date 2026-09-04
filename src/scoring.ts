import type { Authority, Budget, Need, Qualification, Timeline } from "./types.js";

const AUTHORITY_POINTS: Record<Authority, number> = {
  decision_maker: 30,
  influencer: 22,
  committee: 15,
  unknown: 8,
};

const NEED_POINTS: Record<Need, number> = {
  critical: 30,
  high: 24,
  medium: 15,
  low: 6,
  unknown: 0,
};

const TIMELINE_POINTS: Record<Timeline, number> = {
  immediate: 25,
  within_30_days: 20,
  within_90_days: 12,
  exploratory: 6,
  unknown: 0,
};

const BUDGET_POINTS: Record<Budget, number> = {
  over_25k: 15,
  "5k_25k": 12,
  under_5k: 6,
  unknown: 3,
};

export interface LeadScore {
  score: number;
  grade: "A" | "B" | "C" | "D";
  breakdown: {
    authority: number;
    need: number;
    timeline: number;
    budget: number;
  };
}

/**
 * Weighted 0-100 lead score derived from the BANT qualification.
 * A prospect that is not qualified is clamped to a "D" ceiling regardless of
 * the raw component sum.
 */
export function scoreLead(q: Qualification): LeadScore {
  const authority = AUTHORITY_POINTS[q.authority];
  const need = NEED_POINTS[q.need];
  const timeline = TIMELINE_POINTS[q.timeline];
  const budget = BUDGET_POINTS[q.budget];
  const raw = authority + need + timeline + budget;

  let score = Math.max(0, Math.min(100, raw));
  if (!q.qualified) score = Math.min(score, 24);

  const grade: LeadScore["grade"] =
    score >= 75 ? "A" : score >= 55 ? "B" : score >= 35 ? "C" : "D";

  return { score, grade, breakdown: { authority, need, timeline, budget } };
}
