import type { Config } from "../config.js";
import type { LeadOutcome } from "../service.js";
import { integrationsStore } from "./integration-store.js";

/**
 * Sends a test ping to verify a Slack Webhook URL.
 */
export async function testSlackWebhook(webhookUrl: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "⚡ *Speed-to-Lead Connected!* This channel will receive instant real-time sales lead qualification alerts.",
      }),
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
 * Sends a rich Slack notification when an inbound lead is qualified.
 */
export async function sendSlackNotification(
  outcome: LeadOutcome,
  config: Partial<Config>,
): Promise<{ ok: boolean; error?: string }> {
  const slackConfig = await integrationsStore.getSlack(config);
  const webhookUrl = slackConfig.webhookUrl || config.slackWebhookUrl;

  if (!webhookUrl) {
    return { ok: false, error: "SLACK_WEBHOOK_URL not configured" };
  }

  try {
    const lead = outcome.lead;
    const score = outcome.score;
    const q = outcome.qualification;
    const isBooked = Boolean(outcome.booking);
    const latencySec = (outcome.processingTimeMs / 1000).toFixed(1);

    const gradeEmoji = score.grade === "A" ? "🟢" : score.grade === "B" ? "🔵" : score.grade === "C" ? "🟡" : "🔴";
    const statusHeader = isBooked
      ? `🎉 *Demo Booked in ${latencySec}s!*`
      : `⚡ *Lead Qualified in ${latencySec}s*`;

    const gcalUrl = outcome.booking?.googleCalendarUrl || outcome.booking?.url || "https://calendar.google.com";
    const objectionsText = q.objections?.length
      ? q.objections.map((o) => `• _${o}_`).join("\n")
      : "None identified";

    const payload = {
      text: `${gradeEmoji} Speed-to-Lead: ${lead.name} (${lead.company || "Direct"}) scored Grade ${score.grade} (${score.score}/100)`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `⚡ Speed-to-Lead: ${lead.name} (${lead.company || "Direct"})`,
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Status:*\n${statusHeader}`,
            },
            {
              type: "mrkdwn",
              text: `*Score:*\n${gradeEmoji} *Grade ${score.grade}* (${score.score}/100)`,
            },
            {
              type: "mrkdwn",
              text: `*Phone & Region:*\n\`${lead.phone}\` (${lead.region || "US"})`,
            },
            {
              type: "mrkdwn",
              text: `*Work Email:*\n${lead.email || "_N/A_"}`,
            },
          ],
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Budget:*\n\`${q.budget}\``,
            },
            {
              type: "mrkdwn",
              text: `*Authority:*\n\`${q.authority}\``,
            },
            {
              type: "mrkdwn",
              text: `*Need Pain:*\n\`${q.need}\``,
            },
            {
              type: "mrkdwn",
              text: `*Timeline:*\n\`${q.timeline}\``,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Objections & Signals:*\n${objectionsText}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Summary:*\n${outcome.summary || "_Call completed successfully._"}`,
          },
        },
        isBooked
          ? {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "📅 Open in Google Calendar",
                    emoji: true,
                  },
                  url: gcalUrl,
                  style: "primary",
                },
              ],
            }
          : {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: "📲 Self-serve reschedule link prepared for prospect.",
                },
              ],
            },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[slack] Webhook dispatch error:", errText);
      return { ok: false, error: errText };
    }

    console.log(`[slack] Successfully dispatched lead notification for ${lead.name}`);
    return { ok: true };
  } catch (err) {
    console.error("[slack] Failed to send Slack alert:", err);
    return { ok: false, error: String(err) };
  }
}
