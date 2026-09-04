import { buildGoogleCalendarUrl } from "./google.js";
import type { Booking, BookingAttendee, CalendarProvider, Slot } from "./provider.js";

const SLOT_MINUTES = 30;

function nextWholeHour(base: Date, hoursAhead: number): Date {
  const d = new Date(base.getTime() + hoursAhead * 3_600_000);
  d.setMinutes(0, 0, 0);
  return d;
}

/** Deterministic offline calendar for demos and tests. */
export class MockCalendarProvider implements CalendarProvider {
  readonly name = "mock";

  constructor(private readonly companyName: string = "Acme") {}

  async availableSlots(): Promise<Slot[]> {
    const now = new Date();
    const first = nextWholeHour(now, 26);
    const second = new Date(first.getTime() + 4 * 3_600_000);
    return [
      { start: first, end: new Date(first.getTime() + SLOT_MINUTES * 60_000), label: "Tomorrow morning" },
      { start: second, end: new Date(second.getTime() + SLOT_MINUTES * 60_000), label: "Tomorrow afternoon" },
    ];
  }

  async book(slot: Slot, attendee: BookingAttendee): Promise<Booking> {
    const id = `mock_${Date.now()}`;
    const gcalUrl = buildGoogleCalendarUrl({
      title: `⚡ ${this.companyName} Demo with ${attendee.name}`,
      start: slot.start,
      end: slot.end,
      description: `Autonomous Speed-to-Lead Demo Qualification.\nProspect: ${attendee.name}\nPhone: ${attendee.phone}\nEmail: ${attendee.email || "N/A"}`,
      location: `Phone Call: ${attendee.phone}`,
    });

    return {
      id,
      status: "booked",
      provider: this.name,
      url: `https://cal.com/demo/${attendee.name.toLowerCase().replace(/\s+/g, "-")}`,
      googleCalendarUrl: gcalUrl,
      slot,
      start: slot.start,
      end: slot.end,
    };
  }
}

