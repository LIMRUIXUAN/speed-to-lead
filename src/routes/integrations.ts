import type { FastifyInstance } from "fastify";
import { googleOAuthStore } from "../calendar/oauth-store.js";
import type { Config } from "../config.js";
import { integrationsStore } from "../notifications/integration-store.js";
import { testSlackWebhook } from "../notifications/slack.js";
import { testTwilioCarrier } from "../notifications/sms.js";
import { testCustomWebhook } from "../notifications/webhook.js";

export function registerIntegrationsRoutes(app: FastifyInstance, config: Config): void {
  /**
   * Overall Integrations Hub Status (Google, Slack, Twilio, Zapier/Make Webhook)
   */
  app.get("/api/integrations/status", async () => {
    const googleSession = await googleOAuthStore.getSession();
    const slack = await integrationsStore.getSlack(config);
    const twilio = await integrationsStore.getTwilio(config);
    const webhook = await integrationsStore.getWebhook();

    const isGoogleDisconnected = googleSession?.disconnected === true;
    const isGoogleConnected = !isGoogleDisconnected && Boolean(googleSession?.refreshToken || googleSession?.webhookUrl || config.googleRefreshToken || config.googleWebhookUrl);
    const googleEmail = isGoogleDisconnected ? undefined : googleSession?.email || (googleSession?.webhookUrl ? "Apps Script Webhook" : config.googleWebhookUrl ? "Apps Script Webhook" : undefined);

    return {
      google: {
        connected: isGoogleConnected,
        email: googleEmail,
        type: isGoogleConnected ? (googleSession?.refreshToken ? "oauth" : "webhook") : "unconnected",
      },
      slack: {
        connected: slack.connected,
        channel: slack.channel || "#speed-to-lead",
        teamName: slack.teamName,
        webhookConfigured: Boolean(slack.webhookUrl),
      },
      twilio: {
        connected: twilio.connected,
        phoneNumber: twilio.phoneNumber,
        accountSid: twilio.accountSid ? `${twilio.accountSid.slice(0, 6)}...` : undefined,
      },
      webhook: {
        connected: webhook.connected,
        url: webhook.url,
        label: webhook.label || "Zapier / Make.com Webhook",
      },
    };
  });

  /**
   * Save and verify Custom Zapier/Make Webhook
   */
  app.post<{ Body: { url: string; secret?: string; label?: string } }>(
    "/api/integrations/webhook",
    async (req, reply) => {
      const { url, secret, label } = req.body ?? {};
      if (!url || !url.startsWith("http")) {
        return reply.status(400).send({ error: "A valid webhook URL (http/https) is required." });
      }

      // Live test ping
      const testRes = await testCustomWebhook(url.trim(), secret?.trim());
      if (!testRes.ok) {
        return reply.status(400).send({ error: `Webhook test ping failed: ${testRes.error}` });
      }

      await integrationsStore.saveWebhook({
        url: url.trim(),
        secret: secret?.trim(),
        label: label?.trim() || "Zapier / Make Webhook",
      });

      return { ok: true, message: "Custom webhook connected and verified!" };
    },
  );

  /**
   * Disconnect Custom Webhook
   */
  app.post("/api/integrations/webhook/disconnect", async () => {
    await integrationsStore.clearWebhook();
    return { ok: true, message: "Custom webhook disconnected." };
  });

  /**
   * Save and verify Slack Webhook directly from the dashboard
   */
  app.post<{ Body: { webhookUrl: string; channel?: string } }>(
    "/api/integrations/slack",
    async (req, reply) => {
      const { webhookUrl, channel } = req.body ?? {};
      if (!webhookUrl || !webhookUrl.startsWith("http")) {
        return reply.status(400).send({ error: "A valid Slack Webhook URL is required." });
      }

      // Test webhook live
      const testResult = await testSlackWebhook(webhookUrl.trim());
      if (!testResult.ok) {
        return reply.status(400).send({ error: `Slack test ping failed: ${testResult.error}` });
      }

      await integrationsStore.saveSlack({
        webhookUrl: webhookUrl.trim(),
        channel: channel?.trim() || "#speed-to-lead",
      });

      return { ok: true, message: "Slack webhook connected and verified!" };
    },
  );

  /**
   * Disconnect Slack
   */
  app.post("/api/integrations/slack/disconnect", async () => {
    await integrationsStore.clearSlack();
    return { ok: true, message: "Slack disconnected." };
  });

  /**
   * 1-Click "Add to Slack" OAuth Redirect
   */
  app.get("/api/auth/slack/login", async (req, reply) => {
    const slack = await integrationsStore.getSlack(config);
    const clientId = slack.clientId || process.env.SLACK_CLIENT_ID;

    if (!clientId) {
      return reply.redirect("/?slack_auth=need_client_id");
    }

    const host = req.headers.host || "localhost:8787";
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const redirectUri = `${protocol}://${host}/api/auth/slack/callback`;

    const slackUrl = new URL("https://slack.com/oauth/v2/authorize");
    slackUrl.searchParams.set("client_id", clientId);
    slackUrl.searchParams.set("scope", "incoming-webhook,chat:write");
    slackUrl.searchParams.set("redirect_uri", redirectUri);

    return reply.redirect(slackUrl.toString());
  });

  /**
   * Slack OAuth Callback
   */
  app.get<{ Querystring: { code?: string; error?: string } }>(
    "/api/auth/slack/callback",
    async (req, reply) => {
      const { code, error } = req.query;
      if (error || !code) {
        return reply.redirect(`/?slack_auth=failed&error=${encodeURIComponent(error || "Cancelled")}`);
      }

      const renderSlackResponse = (ok: boolean, channelOrErr: string) => {
        reply.type("text/html").send(`<!DOCTYPE html>
<html>
<head>
  <title>Slack Workspace Authentication</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#0B1120; color:#F8FAFC; text-align:center; }
    .card { background:#1E293B; border:1px solid #334155; border-radius:16px; padding:32px; max-width:400px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:40px; margin-bottom:12px;">${ok ? "🎉" : "❌"}</div>
    <h2>${ok ? "Slack Connected!" : "Authentication Failed"}</h2>
    <p style="color:#94A3B8; font-size:14px;">${ok ? "Channel: <strong>" + channelOrErr + "</strong>. Closing window..." : channelOrErr}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: '${ok ? "SLACK_AUTH_SUCCESS" : "SLACK_AUTH_ERROR"}', channel: '${channelOrErr}', error: '${channelOrErr}' }, '*');
      setTimeout(() => window.close(), 1200);
    } else {
      setTimeout(() => {
        window.location.href = '${ok ? "/?slack_auth=success&channel=" + encodeURIComponent(channelOrErr) : "/?slack_auth=failed&error=" + encodeURIComponent(channelOrErr)}';
      }, 1000);
    }
  </script>
</body>
</html>`);
      };

      if (error || !code) {
        return renderSlackResponse(false, error || "No code provided by Slack");
      }

      const slack = await integrationsStore.getSlack(config);
      const clientId = slack.clientId || process.env.SLACK_CLIENT_ID;
      const clientSecret = slack.clientSecret || process.env.SLACK_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return renderSlackResponse(false, "Missing Slack App Client ID or Secret");
      }

      const host = req.headers.host || "localhost:8787";
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const redirectUri = `${protocol}://${host}/api/auth/slack/callback`;

      try {
        const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
          }),
        });

        const tokenData = (await tokenRes.json()) as {
          ok: boolean;
          error?: string;
          incoming_webhook?: { url: string; channel: string };
          team?: { name: string };
        };

        if (!tokenData.ok || !tokenData.incoming_webhook?.url) {
          return renderSlackResponse(false, tokenData.error || "Slack OAuth failed");
        }

        await integrationsStore.saveSlack({
          webhookUrl: tokenData.incoming_webhook.url,
          channel: tokenData.incoming_webhook.channel,
          teamName: tokenData.team?.name,
          clientId,
          clientSecret,
        });

        return renderSlackResponse(true, tokenData.incoming_webhook.channel);
      } catch (err) {
        return renderSlackResponse(false, "Internal server error connecting Slack");
      }
    },
  );

  /**
   * Save and verify Twilio Carrier Credentials
   */
  app.post<{ Body: { accountSid: string; authToken: string; phoneNumber: string; testPhone?: string } }>(
    "/api/integrations/twilio",
    async (req, reply) => {
      const { accountSid, authToken, phoneNumber, testPhone } = req.body ?? {};
      if (!accountSid?.trim() || !authToken?.trim() || !phoneNumber?.trim()) {
        return reply.status(400).send({ error: "Account SID, Auth Token, and Phone Number are required." });
      }

      // If testPhone is provided, execute a real verification ping
      if (testPhone?.trim()) {
        const testRes = await testTwilioCarrier(accountSid.trim(), authToken.trim(), phoneNumber.trim(), testPhone.trim());
        if (!testRes.ok) {
          return reply.status(400).send({ error: `Twilio test SMS failed: ${testRes.error}` });
        }
      }

      await integrationsStore.saveTwilio({
        accountSid: accountSid.trim(),
        authToken: authToken.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      return { ok: true, message: "Twilio SMS carrier connected and verified!" };
    },
  );

  /**
   * Disconnect Twilio
   */
  app.post("/api/integrations/twilio/disconnect", async () => {
    await integrationsStore.clearTwilio();
    return { ok: true, message: "Twilio disconnected." };
  });

  /**
   * Send test SMS via connected Twilio carrier
   */
  app.post<{ Body: { to: string } }>("/api/integrations/twilio/test", async (req, reply) => {
    const { to } = req.body ?? {};
    if (!to?.trim()) {
      return reply.status(400).send({ error: "Recipient phone number is required." });
    }

    const twilio = await integrationsStore.getTwilio(config);
    if (!twilio.accountSid || !twilio.authToken || !twilio.phoneNumber) {
      return reply.status(400).send({ error: "Twilio is not configured." });
    }

    const res = await testTwilioCarrier(twilio.accountSid, twilio.authToken, twilio.phoneNumber, to.trim());
    if (!res.ok) {
      return reply.status(400).send({ error: `Test SMS failed: ${res.error}` });
    }
    return { ok: true, sid: res.sid, message: "Test SMS sent successfully!" };
  });
}
