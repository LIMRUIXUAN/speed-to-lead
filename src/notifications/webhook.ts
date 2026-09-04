import { createHmac } from "node:crypto";
import type { LeadOutcome } from "../service.js";
import { integrationsStore } from "./integration-store.js";

/**
 * Signs payload using HMAC-SHA256.
 */
function signPayload(payload: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Sends a test ping to verify an external Zapier/Make webhook URL.
 */
export async function testCustomWebhook(url: string, secret?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      event: "speed_to_lead.ping",
      message: "⚡ Speed-to-Lead Webhook test connection successful!",
      timestamp: new Date().toISOString(),
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "SpeedToLead-WebhookEngine/1.0",
    };

    if (secret) {
      headers["X-Speed-To-Lead-Signature"] = signPayload(payload, secret);
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: payload,
    });

    if (!res.ok) {
      return { ok: false, error: await res.text() };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Dispatches a lead outcome to an external Zapier / Make.com / n8n webhook.
 */
export async function dispatchCustomWebhook(
  outcome: LeadOutcome,
): Promise<{ ok: boolean; error?: string }> {
  const webhookConfig = await integrationsStore.getWebhook();
  if (!webhookConfig.connected || !webhookConfig.url) {
    return { ok: false, error: "Custom webhook not configured" };
  }

  try {
    const payload = JSON.stringify({
      event: "lead.qualified",
      id: outcome.lead.id,
      timestamp: outcome.createdAt,
      lead: outcome.lead,
      qualification: outcome.qualification,
      score: outcome.score,
      booking: outcome.booking,
      summary: outcome.summary,
      evidence: outcome.evidence,
      transcript: outcome.transcript,
      processingTimeMs: outcome.processingTimeMs,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "SpeedToLead-WebhookEngine/1.0",
    };

    if (webhookConfig.secret) {
      headers["X-Speed-To-Lead-Signature"] = signPayload(payload, webhookConfig.secret);
    }

    const res = await fetch(webhookConfig.url, {
      method: "POST",
      headers,
      body: payload,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[custom-webhook] Webhook dispatch error:", errText);
      return { ok: false, error: errText };
    }

    console.log(`[custom-webhook] Successfully dispatched webhook for lead ${outcome.lead.name} to ${webhookConfig.url}`);
    return { ok: true };
  } catch (err) {
    console.error("[custom-webhook] Dispatch failed:", err);
    return { ok: false, error: String(err) };
  }
}
