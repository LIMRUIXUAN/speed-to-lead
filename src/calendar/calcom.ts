import type { Booking, BookingAttendee, CalendarProvider, Slot } from "./provider.js";

const BASE_URL = "https://api.cal.com";
const API_VERSION = "2026-02-25";

interface CalDotComOptions {
  apiKey: string;
  eventTypeId: number | null;
  timezone: string;
}

function nextWholeHour(base: Date, hoursAhead: number): Date {
  const d = new Date(base.getTime() + hoursAhead * 3_600_000);
  d.setMinutes(0, 0, 0);
  return d;
}

/**
 * Real Cal.com integration via the v2 API.
 *
 * `availableSlots` returns candidate demo times; the authoritative
 * availability check happens inside `POST /v2/bookings`, which rejects
 * conflicts and out-of-window times with a surfaced error.
 */
export class CalDotComProvider implements CalendarProvider {
  readonly name = "calcom";

  constructor(private readonly opts: CalDotComOptions) {}

  async availableSlots(): Promise<Slot[]> {
    const now = new Date();
    const first = nextWholeHour(now, 26);
    const second = new Date(first.getTime() + 4 * 3_600_000);
    return [
      { start: first, end: new Date(first.getTime() + 30 * 60_000), label: "Tomorrow morning" },
      { start: second, end: new Date(second.getTime() + 30 * 60_000), label: "Tomorrow afternoon" },
    ];
  }

  async book(slot: Slot, attendee: BookingAttendee): Promise<Booking> {
    if (!this.opts.apiKey) {
      return { id: "", status: "failed", provider: this.name, error: "CALCOM_API_KEY is not configured" };
    }
    if (this.opts.eventTypeId == null) {
      return { id: "", status: "failed", provider: this.name, error: "CALCOM_EVENT_TYPE_ID is not configured" };
    }

    const email = attendee.email ?? `lead@${attendee.phone.replace(/\D/g, "")}.invalid`;
    const body = {
      start: slot.start.toISOString(),
      eventTypeId: this.opts.eventTypeId,
      attendee: {
        name: attendee.name,
        email,
        displayEmail: email,
        timeZone: this.opts.timezone,
        absent: false,
        phoneNumber: attendee.phone,
      },
      metadata: { source: "speed-to-lead" },
    };

    try {
      const res = await fetch(`${BASE_URL}/v2/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.opts.apiKey}`,
          "Content-Type": "application/json",
          "cal-api-version": API_VERSION,
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        const message = json?.error?.message ?? json?.message ?? `HTTP ${res.status}`;
        return { id: "", status: "failed", provider: this.name, error: message };
      }
      const data = json?.data ?? json ?? {};
      return {
        id: String(data.uid ?? data.id ?? ""),
        status: "booked",
        provider: this.name,
        url: typeof data.location === "string" ? data.location : undefined,
        start: slot.start,
        end: slot.end,
      };
    } catch (err) {
      return {
        id: "",
        status: "failed",
        provider: this.name,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
