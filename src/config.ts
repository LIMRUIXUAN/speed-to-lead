import "dotenv/config";

function str(key: string, fallback = ""): string {
  return (process.env[key] ?? fallback).trim();
}

function num(key: string, fallback: number): number {
  const value = Number(str(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export type CalleMode = "live" | "mock";
export type CalendarProviderName = "google" | "calcom" | "mock";
export type CrmProviderName = "hubspot" | "local";

export interface Config {
  port: number;
  host: string;
  calleMode: CalleMode;
  calleApiKey: string;
  calleBaseUrl: string;
  callTimeoutMs: number;
  webhookSecret: string;
  calendarProvider: CalendarProviderName;
  calcomApiKey: string;
  calcomEventTypeId: number | null;
  googleCalendarId: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  googleServiceAccountEmail: string;
  googlePrivateKey: string;
  googleWebhookUrl: string;
  slackWebhookUrl: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  crmProvider: CrmProviderName;
  hubspotAccessToken: string;
  crmLocalPath: string;
  companyName: string;
  agentTimezone: string;
  idempotencyPath: string;
}

export function loadConfig(): Config {
  const calleMode: CalleMode = str("CALLE_MODE", "mock") === "live" ? "live" : "mock";
  const calProviderRaw = str("CALENDAR_PROVIDER", "google").toLowerCase();
  const calendarProvider: CalendarProviderName =
    calProviderRaw === "calcom" ? "calcom" : (calProviderRaw === "mock" ? "mock" : "google");
  const crmProvider: CrmProviderName = str("CRM_PROVIDER", "local") === "hubspot" ? "hubspot" : "local";
  const eventTypeRaw = str("CALCOM_EVENT_TYPE_ID");

  return {
    port: num("PORT", 8787),
    host: str("HOST", "0.0.0.0"),
    calleMode,
    calleApiKey: str("CALLE_API_KEY"),
    calleBaseUrl: str("CALLE_BASE_URL", "https://api.heycall-e.com"),
    callTimeoutMs: num("CALL_TIMEOUT_MS", 240_000),
    webhookSecret: str("WEBHOOK_SECRET"),
    calendarProvider,
    calcomApiKey: str("CALCOM_API_KEY"),
    calcomEventTypeId: eventTypeRaw ? Number(eventTypeRaw) : null,
    googleCalendarId: str("GOOGLE_CALENDAR_ID", "primary"),
    googleClientId: str("GOOGLE_CLIENT_ID"),
    googleClientSecret: str("GOOGLE_CLIENT_SECRET"),
    googleRefreshToken: str("GOOGLE_REFRESH_TOKEN"),
    googleServiceAccountEmail: str("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    googlePrivateKey: str("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    googleWebhookUrl: str("GOOGLE_CALENDAR_WEBHOOK_URL"),
    slackWebhookUrl: str("SLACK_WEBHOOK_URL"),
    twilioAccountSid: str("TWILIO_ACCOUNT_SID"),
    twilioAuthToken: str("TWILIO_AUTH_TOKEN"),
    twilioPhoneNumber: str("TWILIO_PHONE_NUMBER"),
    crmProvider,
    hubspotAccessToken: str("HUBSPOT_ACCESS_TOKEN"),
    crmLocalPath: str("CRM_LOCAL_PATH", "./data/leads.jsonl"),
    companyName: str("COMPANY_NAME", "Acme"),
    agentTimezone: str("AGENT_TIMEZONE", "America/Los_Angeles"),
    idempotencyPath: str("IDEMPOTENCY_PATH", "./data/idempotency.json"),
  };
}

