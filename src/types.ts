export const BUDGETS = ["unknown", "under_5k", "5k_25k", "over_25k"] as const;
export const AUTHORITIES = ["unknown", "influencer", "decision_maker", "committee"] as const;
export const NEEDS = ["unknown", "low", "medium", "high", "critical"] as const;
export const TIMELINES = ["unknown", "immediate", "within_30_days", "within_90_days", "exploratory"] as const;

export type Budget = (typeof BUDGETS)[number];
export type Authority = (typeof AUTHORITIES)[number];
export type Need = (typeof NEEDS)[number];
export type Timeline = (typeof TIMELINES)[number];

/** Payload accepted on POST /api/lead-submit. */
export interface LeadInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source?: string;
  interest?: string;
  region?: string;
  locale?: string;
  /** Client-supplied dedupe key. Replaying the same key returns the stored outcome. */
  idempotency_key?: string;
}

/** Normalized, server-owned lead record. */
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source?: string;
  interest?: string;
  region?: string;
  locale?: string;
  createdAt: string;
}

/** BANT qualification extracted (schema-validated) from the CALL-E call. */
export interface Qualification {
  qualified: boolean;
  budget: Budget;
  authority: Authority;
  need: Need;
  timeline: Timeline;
  accepted_demo: boolean;
  selected_slot: string;
  objections: string[];
  notes: string;
}

/**
 * Country code to ISO region, default locale, and primary spoken language.
 */
export const PREFIX_REGION_MAP: [string, string, string, string][] = [
  ["+1", "US", "en-US", "English (US)"],
  ["+60", "MY", "ms-MY", "Bahasa Malaysia / English"],
  ["+65", "SG", "en-SG", "English (Singapore)"],
  ["+44", "GB", "en-GB", "English (UK)"],
  ["+61", "AU", "en-AU", "English (Australia)"],
  ["+64", "NZ", "en-NZ", "English (New Zealand)"],
  ["+91", "IN", "en-IN", "English (India) / Hindi"],
  ["+49", "DE", "de-DE", "German (Deutsch)"],
  ["+33", "FR", "fr-FR", "French (Français)"],
  ["+34", "ES", "es-ES", "Spanish (Español)"],
  ["+52", "MX", "es-MX", "Spanish (Español Latino)"],
  ["+55", "BR", "pt-BR", "Portuguese (Português)"],
  ["+39", "IT", "it-IT", "Italian (Italiano)"],
  ["+81", "JP", "ja-JP", "Japanese (日本語)"],
  ["+82", "KR", "ko-KR", "Korean (한국어)"],
  ["+852", "HK", "zh-HK", "Cantonese / English"],
  ["+971", "AE", "ar-AE", "Arabic / English"],
  ["+62", "ID", "id-ID", "Bahasa Indonesia"],
  ["+63", "PH", "en-PH", "English / Filipino"],
];

/**
 * Returns human-readable language for a given locale.
 */
export function getLanguageForLocale(locale: string): string {
  const match = PREFIX_REGION_MAP.find(([, , loc]) => loc.toLowerCase() === locale.toLowerCase());
  return match ? match[3] : "English (US)";
}

/**
 * Infer ISO region (e.g. "US", "MY", "GB") and locale from an E.164 phone number.
 */
export function inferRegionAndLocale(
  phone: string,
  explicitRegion?: string,
  explicitLocale?: string,
): { region: string; locale: string; language: string } {
  if (explicitRegion && explicitLocale) {
    return {
      region: explicitRegion.toUpperCase(),
      locale: explicitLocale,
      language: getLanguageForLocale(explicitLocale),
    };
  }

  for (const [prefix, reg, loc, lang] of PREFIX_REGION_MAP) {
    if (phone.startsWith(prefix)) {
      const selectedRegion = explicitRegion ? explicitRegion.toUpperCase() : reg;
      const selectedLocale = explicitLocale ?? loc;
      return {
        region: selectedRegion,
        locale: selectedLocale,
        language: explicitLocale ? getLanguageForLocale(explicitLocale) : lang,
      };
    }
  }

  return {
    region: explicitRegion ? explicitRegion.toUpperCase() : "US",
    locale: explicitLocale ?? "en-US",
    language: "English (US)",
  };
}

/**
 * Normalize a free-form phone number into E.164 (`+14155550100`).
 * Returns null when the input cannot be coerced into a plausible number.
 */
export function normalizeE164(input: string): string | null {
  if (!input) return null;
  let value = input.trim();
  // Keep only digits; allow an existing leading "+".
  const plus = value.startsWith("+");
  value = value.replace(/\D/g, "");
  if (value.length < 7 || value.length > 15) return null;
  return (plus ? "+" : "") + value;
}
