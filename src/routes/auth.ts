import type { FastifyInstance } from "fastify";
import { googleOAuthStore } from "../calendar/oauth-store.js";
import type { Config } from "../config.js";

export function registerAuthRoutes(app: FastifyInstance, config: Config): void {
  /**
   * Status of Google OAuth Connection
   */
  app.get("/api/auth/google/status", async () => {
    const session = await googleOAuthStore.getSession();
    const isDisconnected = session?.disconnected === true;
    const hasClientId = Boolean(session?.clientId || config.googleClientId);
    const hasWebhook = Boolean(session?.webhookUrl || (!isDisconnected && config.googleWebhookUrl));
    const isConnected = !isDisconnected && Boolean(session?.refreshToken || session?.webhookUrl || config.googleRefreshToken || config.googleWebhookUrl);
    const email = isDisconnected ? undefined : session?.email || (session?.webhookUrl ? "Apps Script Webhook" : config.googleWebhookUrl ? "Apps Script Webhook" : undefined);

    return {
      connected: isConnected,
      email,
      name: isDisconnected ? undefined : session?.name,
      picture: isDisconnected ? undefined : session?.picture,
      type: isConnected ? (session?.refreshToken ? "oauth" : "webhook") : "unconnected",
      clientIdConfigured: hasClientId,
      webhookConfigured: hasWebhook,
      clientId: session?.clientId || config.googleClientId || "",
      updatedAt: session?.updatedAt,
    };
  });

  /**
   * Save Client ID & Secret from UI (Pre-configured or custom)
   */
  app.post<{ Body: { clientId: string; clientSecret: string } }>(
    "/api/auth/google/config",
    async (req, reply) => {
      const { clientId, clientSecret } = req.body ?? {};
      if (!clientId?.trim() || !clientSecret?.trim()) {
        return reply.status(400).send({ error: "Both clientId and clientSecret are required." });
      }

      const existing = (await googleOAuthStore.getSession()) ?? {
        accessToken: "",
        refreshToken: "",
        expiresAt: 0,
        updatedAt: new Date().toISOString(),
      };

      existing.clientId = clientId.trim();
      existing.clientSecret = clientSecret.trim();
      existing.updatedAt = new Date().toISOString();
      await googleOAuthStore.saveSession(existing);

      return { ok: true, message: "Google OAuth credentials saved. Ready to sign in!" };
    },
  );

  /**
   * Save and verify Google Apps Script Webhook URL from UI
   */
  app.post<{ Body: { webhookUrl: string } }>(
    "/api/auth/google/webhook",
    async (req, reply) => {
      const { webhookUrl } = req.body ?? {};
      if (!webhookUrl || !webhookUrl.startsWith("http")) {
        return reply.status(400).send({ error: "A valid Google Apps Script Webhook URL is required." });
      }

      const existing = (await googleOAuthStore.getSession()) ?? {
        accessToken: "",
        refreshToken: "",
        expiresAt: 0,
        updatedAt: new Date().toISOString(),
      };

      existing.webhookUrl = webhookUrl.trim();
      existing.updatedAt = new Date().toISOString();
      await googleOAuthStore.saveSession(existing);

      return { ok: true, message: "Google Calendar Webhook connected successfully!" };
    },
  );

  /**
   * Initiates Google OAuth2 Browser Redirect or Popup
   */
  app.get("/api/auth/google/login", async (req, reply) => {
    const session = await googleOAuthStore.getSession();
    const clientId = session?.clientId || config.googleClientId;

    if (!clientId) {
      return reply.redirect("/?auth=need_client_id");
    }

    const host = req.headers.host || "localhost:8787";
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" ");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return reply.redirect(authUrl.toString());
  });

  /**
   * Google OAuth2 Redirect Callback Handler (Supports both Popup & Full Redirect)
   */
  app.get<{ Querystring: { code?: string; error?: string } }>(
    "/api/auth/google/callback",
    async (req, reply) => {
      const { code, error } = req.query;

      const renderResponse = (ok: boolean, emailOrErr: string) => {
        reply.type("text/html").send(`<!DOCTYPE html>
<html>
<head>
  <title>Google Calendar Authentication</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#0B1120; color:#F8FAFC; text-align:center; }
    .card { background:#1E293B; border:1px solid #334155; border-radius:16px; padding:32px; max-width:400px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:40px; margin-bottom:12px;">${ok ? "🎉" : "❌"}</div>
    <h2>${ok ? "Connected to Google Calendar!" : "Authentication Failed"}</h2>
    <p style="color:#94A3B8; font-size:14px;">${ok ? "Signed in as <strong>" + emailOrErr + "</strong>. Closing window..." : emailOrErr}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: '${ok ? "GOOGLE_AUTH_SUCCESS" : "GOOGLE_AUTH_ERROR"}', email: '${emailOrErr}', error: '${emailOrErr}' }, '*');
      setTimeout(() => window.close(), 1200);
    } else {
      setTimeout(() => {
        window.location.href = '${ok ? "/?auth=success&email=" + encodeURIComponent(emailOrErr) : "/?auth=failed&error=" + encodeURIComponent(emailOrErr)}';
      }, 1000);
    }
  </script>
</body>
</html>`);
      };

      if (error || !code) {
        console.error("[google-oauth] OAuth callback error:", error || "No code provided");
        return renderResponse(false, error || "Access denied by user");
      }

      const session = await googleOAuthStore.getSession();
      const clientId = session?.clientId || config.googleClientId;
      const clientSecret = session?.clientSecret || config.googleClientSecret;

      if (!clientId || !clientSecret) {
        return renderResponse(false, "Missing OAuth Client ID or Secret");
      }

      const host = req.headers.host || "localhost:8787";
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

      try {
        // 1. Exchange authorization code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) {
          const errBody = await tokenRes.text();
          console.error("[google-oauth] Token exchange failed:", errBody);
          return renderResponse(false, "Google token exchange failed");
        }

        const tokenData = (await tokenRes.json()) as {
          access_token: string;
          refresh_token?: string;
          expires_in: number;
        };

        // 2. Fetch User Profile
        let email = "";
        let name = "";
        let picture = "";

        try {
          const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (userRes.ok) {
            const userData = (await userRes.json()) as { email?: string; name?: string; picture?: string };
            email = userData.email || "";
            name = userData.name || "";
            picture = userData.picture || "";
          }
        } catch (err) {
          console.warn("[google-oauth] Could not fetch user profile:", err);
        }

        // 3. Save Session
        await googleOAuthStore.saveSession({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || session?.refreshToken || "",
          expiresAt: Date.now() + tokenData.expires_in * 1000,
          email,
          name,
          picture,
          clientId,
          clientSecret,
          updatedAt: new Date().toISOString(),
        });

        console.log(`[google-oauth] User authenticated successfully: ${email}`);
        return renderResponse(true, email);
      } catch (err) {
        console.error("[google-oauth] Callback exception:", err);
        return renderResponse(false, "Internal server error during authentication");
      }
    },
  );

  /**
   * Disconnect Google Account
   */
  app.post("/api/auth/google/disconnect", async () => {
    await googleOAuthStore.clearSession();
    return { ok: true, message: "Disconnected successfully" };
  });
}
