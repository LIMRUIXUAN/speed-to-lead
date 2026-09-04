import type { Config } from "../config.js";
import { integrationsStore } from "./integration-store.js";

export interface SmsDispatchResult {
  dispatched: boolean;
  provider: "twilio" | "mock";
  recipient: string;
  message: string;
  sid?: string;
  sentAt: string;
  error?: string;
}

/**
 * Tests Twilio carrier connection by sending a verification ping.
 */
export async function testTwilioCarrier(
  accountSid: string,
  authToken: string,
  fromPhone: string,
  toPhone: string,
): Promise<{ ok: boolean; sid?: string; error?: string }> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const body = new URLSearchParams({
      To: toPhone,
      From: fromPhone,
      Body: "⚡ Speed-to-Lead Twilio Carrier verification: Outbound SMS is working!",
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      return { ok: false, error: await res.text() };
    }

    const data = (await res.json()) as { sid?: string };
    return { ok: true, sid: data.sid };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Dispatches an outbound SMS via Twilio REST API, or produces a mock record if unconfigured.
 */
export async function dispatchSms(
  to: string,
  message: string,
  config: Partial<Config>,
): Promise<SmsDispatchResult> {
  const sentAt = new Date().toISOString();
  const twilioConfig = await integrationsStore.getTwilio(config);

  const sid = twilioConfig.accountSid || config.twilioAccountSid;
  const token = twilioConfig.authToken || config.twilioAuthToken;
  const fromPhone = twilioConfig.phoneNumber || config.twilioPhoneNumber;

  // If Twilio credentials are configured, execute real carrier dispatch
  if (sid && token && fromPhone) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");

      const body = new URLSearchParams({
        To: to,
        From: fromPhone,
        Body: message,
      });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[twilio] SMS dispatch failed:", errText);
        return {
          dispatched: false,
          provider: "twilio",
          recipient: to,
          message,
          sentAt,
          error: errText,
        };
      }

      const data = (await res.json()) as { sid?: string; status?: string };
      console.log(`[twilio] Real SMS dispatched to ${to}: SID ${data.sid}`);
      return {
        dispatched: true,
        provider: "twilio",
        recipient: to,
        message,
        sid: data.sid,
        sentAt,
      };
    } catch (err) {
      console.error("[twilio] Network exception sending SMS:", err);
      return {
        dispatched: false,
        provider: "twilio",
        recipient: to,
        message,
        sentAt,
        error: String(err),
      };
    }
  }

  // Graceful simulated carrier record for local / mock mode
  return {
    dispatched: true,
    provider: "mock",
    recipient: to,
    message,
    sentAt,
  };
}
