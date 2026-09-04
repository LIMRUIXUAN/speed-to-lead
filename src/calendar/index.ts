import type { Config } from "../config.js";
import { CalDotComProvider } from "./calcom.js";
import { GoogleCalendarProvider } from "./google.js";
import { MockCalendarProvider } from "./mock.js";
import type { CalendarProvider } from "./provider.js";

export function createCalendarProvider(config: Config): CalendarProvider {
  if (config.calendarProvider === "calcom") {
    return new CalDotComProvider({
      apiKey: config.calcomApiKey,
      eventTypeId: config.calcomEventTypeId,
      timezone: config.agentTimezone,
    });
  }
  if (config.calendarProvider === "google") {
    return new GoogleCalendarProvider(config.companyName, config);
  }
  return new MockCalendarProvider(config.companyName);
}

export { GoogleCalendarProvider, buildGoogleCalendarUrl, buildIcsContent } from "./google.js";
export { BookingsCollectionStore, bookingsStore, type StoredBooking } from "./store.js";
export type { Booking, BookingAttendee, CalendarProvider, Slot } from "./provider.js";

