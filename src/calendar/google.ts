import { createSign, randomUUID } from "node:crypto";
import type { Config } from "../config.js";
import { googleOAuthStore } from "./oauth-store.js";
import type { Booking, BookingAttendee, CalendarProvider, Slot } from "./provider.js";

const SLOT_MINUTES = 30;

function nextWholeHour(base: Date, hoursAhead: number): Date {
  const d = new Date(base.getTime() + hoursAhead * 3_600_000);
  d.setMinutes(0, 0, 0);
  return d;
}

/**
 * Builds a direct 1-click Google Calendar Add Event URL with pre-filled title, dates, notes, and location.
 */
export function buildGoogleCalendarUrl(opts: {
  title: string;
  start: Date;
  end: Date;
  description: string;
  location?: string;
}): string {
  const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");
  const dates = `${formatUtc(opts.start)}/${formatUtc(opts.end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates,
    details: opts.description,
    location: opts.location || "Phone / Video Call",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an RFC 5545 compliant .ics iCalendar file content.
 */
export function buildIcsContent(opts: {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  location?: string;
  attendeeName?: string;
  attendeeEmail?: string;
}): string {
  const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");
  const now = formatUtc(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Speed to Lead//Google Calendar Booking Collection//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${opts.id}@speed-to-lead.app`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatUtc(opts.start)}`,
    `DTEND:${formatUtc(opts.end)}`,
    `SUMMARY:${opts.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${opts.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${(opts.location || "Phone / Video Call").replace(/\n/g, " ")}`,
    opts.attendeeEmail
      ? `ATTENDEE;CN=${opts.attendeeName || "Prospect"};ROLE=REQ-PARTICIPANT:mailto:${opts.attendeeEmail}`
      : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

/**
 * Exchanges OAuth2 Refresh Token for a Google Calendar access token.
 */
async function getOAuthAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      console.error("[google-calendar] OAuth token error:", await res.text());
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    console.error("[google-calendar] OAuth fetch failed:", err);
    return null;
  }
}

/**
 * Signs a JWT with RSA-SHA256 and exchanges it for a Google Service Account access token.
 */
async function getServiceAccountAccessToken(email: string, privateKey: string): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const claim = Buffer.from(
      JSON.stringify({
        iss: email,
        scope: "https://www.googleapis.com/auth/calendar.events",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      }),
    ).toString("base64url");

    const sign = createSign("RSA-SHA256");
    sign.update(`${header}.${claim}`);
    sign.end();
    const signature = sign.sign(privateKey, "base64url");
    const jwt = `${header}.${claim}.${signature}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!res.ok) {
      console.error("[google-calendar] Service account token error:", await res.text());
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    console.error("[google-calendar] Service account JWT failed:", err);
    return null;
  }
}

export interface GoogleEventPayload {
  title: string;
  description: string;
  start: Date;
  end: Date;
  attendeeName: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  timeZone?: string;
}

/**
 * Automatically creates an event directly in Google Calendar using REST API.
 */
export async function createGoogleCalendarApiEvent(
  payload: GoogleEventPayload,
  config: Partial<Config>,
): Promise<{ eventId?: string; htmlLink?: string } | null> {
  const calendarId = encodeURIComponent(config.googleCalendarId || "primary");
  const session = await googleOAuthStore.getSession();
  if (session?.disconnected === true) {
    return null;
  }
  const webhookUrl = session?.webhookUrl || config.googleWebhookUrl;

  // 1. Check for Webhook / Apps Script endpoint
  if (webhookUrl) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "follow",
        signal: controller.signal,
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          start: payload.start.toISOString(),
          end: payload.end.toISOString(),
          attendeeName: payload.attendeeName,
          attendeeEmail: payload.attendeeEmail,
          attendeePhone: payload.attendeePhone,
        }),
      });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        let data: { ok?: boolean; id?: string; url?: string; eventId?: string; htmlLink?: string } = {};
        try {
          data = JSON.parse(text);
        } catch {
          data = { id: text.trim() };
        }
        const eventId = data.id || data.eventId || `gcal_${Date.now()}`;
        const htmlLink = data.url || data.htmlLink || `https://calendar.google.com/calendar/u/0/r/eventedit/${encodeURIComponent(eventId)}`;
        console.log(`[google-calendar] Successfully created Google Calendar event via Webhook: ${eventId}`);
        return { eventId, htmlLink };
      }
    } catch (err) {
      console.error("[google-calendar] Webhook sync error:", err);
    }
  }

  // 2. Resolve Access Token via Browser OAuth Session, Service Account, or Configured Refresh Token
  let token: string | null = await googleOAuthStore.getValidAccessToken(config);
  if (!token) {
    if (config.googleServiceAccountEmail && config.googlePrivateKey) {
      token = await getServiceAccountAccessToken(config.googleServiceAccountEmail, config.googlePrivateKey);
    } else if (config.googleClientId && config.googleClientSecret && config.googleRefreshToken) {
      token = await getOAuthAccessToken(config.googleClientId, config.googleClientSecret, config.googleRefreshToken);
    }
  }

  if (!token) {
    return null;
  }

  // 3. Direct Google Calendar REST API insertion
  try {
    const eventBody = {
      summary: payload.title,
      description: payload.description,
      start: { dateTime: payload.start.toISOString(), timeZone: config.agentTimezone || "America/Los_Angeles" },
      end: { dateTime: payload.end.toISOString(), timeZone: config.agentTimezone || "America/Los_Angeles" },
      location: payload.attendeePhone ? `Phone: ${payload.attendeePhone}` : "Phone / Video Call",
      attendees: payload.attendeeEmail ? [{ email: payload.attendeeEmail, displayName: payload.attendeeName }] : undefined,
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      },
    );

    if (!res.ok) {
      console.error("[google-calendar] Google Calendar API event creation failed:", await res.text());
      return null;
    }

    const created = (await res.json()) as { id?: string; htmlLink?: string };
    console.log(`[google-calendar] Successfully created Google Calendar event ${created.id}: ${created.htmlLink}`);
    return { eventId: created.id, htmlLink: created.htmlLink };
  } catch (err) {
    console.error("[google-calendar] Error calling Google Calendar API:", err);
    return null;
  }
}

/**
 * Google Calendar Provider that automatically creates events in Google Calendar and maintains a durable collection.
 */
export class GoogleCalendarProvider implements CalendarProvider {
  readonly name = "google";

  constructor(
    private readonly companyName: string = "Acme",
    private readonly config: Partial<Config> = {},
  ) {}

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
    const id = `gcal_${Date.now()}`;
    const title = `⚡ ${this.companyName} Demo with ${attendee.name}`;
    const description = `Speed-to-Lead Autonomous AI Demo.\nProspect: ${attendee.name}\nPhone: ${attendee.phone}\nEmail: ${attendee.email || "N/A"}`;

    // 1. Generate standard fallback URL
    let gcalUrl = buildGoogleCalendarUrl({
      title,
      start: slot.start,
      end: slot.end,
      description,
      location: `Phone: ${attendee.phone}`,
    });

    // 2. Attempt automatic insertion via Google Calendar API if credentials are configured
    const apiResult = await createGoogleCalendarApiEvent(
      {
        title,
        description,
        start: slot.start,
        end: slot.end,
        attendeeName: attendee.name,
        attendeeEmail: attendee.email,
        attendeePhone: attendee.phone,
      },
      this.config,
    );

    if (apiResult?.htmlLink) {
      gcalUrl = apiResult.htmlLink;
    }

    return {
      id: apiResult?.eventId || id,
      status: "booked",
      provider: this.name,
      url: gcalUrl,
      googleCalendarUrl: gcalUrl,
      slot,
      start: slot.start,
      end: slot.end,
    };
  }
}

