export interface Slot {
  start: Date;
  end: Date;
  label: string;
}

export interface Booking {
  id: string;
  status: "booked" | "failed";
  provider: string;
  url?: string;
  googleCalendarUrl?: string;
  slot?: Slot;
  start?: Date;
  end?: Date;
  error?: string;
}

export interface BookingAttendee {
  name: string;
  phone: string;
  email?: string;
}

export interface CalendarProvider {
  readonly name: string;
  /** Return the demo slots the agent offers on the call. */
  availableSlots(): Promise<Slot[]>;
  /** Authoritatively create the booking in the source-of-truth calendar. */
  book(slot: Slot, attendee: BookingAttendee): Promise<Booking>;
}
