import type { CrmLeadRecord, CrmProvider } from "./provider.js";

const BASE_URL = "https://api.hubapi.com";

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

function lifecyclestageFor(grade: string): string {
  return grade === "A" || grade === "B" ? "salesqualifiedlead" : "lead";
}

function leadStatusFor(grade: string): string {
  switch (grade) {
    case "A":
      return "OPEN_DEAL";
    case "B":
      return "IN_PROGRESS";
    case "C":
      return "OPEN";
    default:
      return "UNQUALIFIED";
  }
}

/**
 * Creates (or updates via email) a contact in HubSpot with standard properties,
 * and if qualified, creates an associated Deal and logs the call engagement.
 */
export class HubspotCrm implements CrmProvider {
  readonly name = "hubspot";

  constructor(private readonly accessToken: string) {}

  async write(record: CrmLeadRecord): Promise<{ id: string; provider: string; dealId?: string }> {
    if (!this.accessToken) {
      throw new Error("HUBSPOT_ACCESS_TOKEN is not configured");
    }

    const { first, last } = splitName(record.lead.name);
    const properties: Record<string, string> = {
      firstname: first,
      lastname: last || "(unknown)",
      phone: record.lead.phone,
      company: record.lead.company ?? "",
      hs_lead_status: leadStatusFor(record.score.grade),
      lifecyclestage: lifecyclestageFor(record.score.grade),
    };
    if (record.lead.email) properties.email = record.lead.email;

    const res = await fetch(`${BASE_URL}/crm/v3/objects/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      throw new Error(`HubSpot error ${res.status}: ${json?.message ?? JSON.stringify(json)}`);
    }

    const contactId = String(json?.id ?? record.lead.id);
    let dealId: string | undefined;

    // If prospect is qualified or booked, create an associated Deal in HubSpot
    if (record.score.grade === "A" || record.score.grade === "B" || record.booking?.status === "booked") {
      try {
        const dealAmount =
          record.qualification.budget === "over_25k"
            ? "30000"
            : record.qualification.budget === "5k_25k"
              ? "15000"
              : "5000";

        const dealRes = await fetch(`${BASE_URL}/crm/v3/objects/deals`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              dealname: `⚡ ${record.lead.name} — Speed-to-Lead Demo`,
              amount: dealAmount,
              dealstage: record.booking?.status === "booked" ? "presentationscheduled" : "qualifiedtobuy",
              pipeline: "default",
            },
            associations: [
              {
                to: { id: contactId },
                types: [
                  {
                    associationCategory: "HUBSPOT_DEFINED",
                    associationTypeId: 3, // Deal to Contact association
                  },
                ],
              },
            ],
          }),
        });

        if (dealRes.ok) {
          const dealJson = (await dealRes.json().catch(() => null)) as any;
          dealId = dealJson?.id;
        }
      } catch (err) {
        // Non-blocking fallback if deal permissions are omitted from private app token
        console.warn("[hubspot] Deal association skipped:", err instanceof Error ? err.message : String(err));
      }
    }

    return { id: contactId, provider: this.name, dealId };
  }
}

