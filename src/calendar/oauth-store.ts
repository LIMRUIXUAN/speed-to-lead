import { promises as fs } from "node:fs";
import path from "node:path";
import type { Config } from "../config.js";

export interface GoogleOAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  email?: string;
  name?: string;
  picture?: string;
  clientId?: string;
  clientSecret?: string;
  webhookUrl?: string;
  disconnected?: boolean;
  updatedAt: string;
}

const DEFAULT_SESSION_PATH = "./data/google-oauth.json";

export class GoogleOAuthStore {
  constructor(private readonly filePath: string = DEFAULT_SESSION_PATH) {}

  private async ensureDir(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async getSession(): Promise<GoogleOAuthSession | null> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data) as GoogleOAuthSession;
    } catch {
      return null;
    }
  }

  async saveSession(session: GoogleOAuthSession): Promise<void> {
    await this.ensureDir();
    session.disconnected = false;
    await fs.writeFile(this.filePath, JSON.stringify(session, null, 2), "utf-8");
  }

  async clearSession(): Promise<void> {
    await this.ensureDir();
    const session = (await this.getSession()) ?? {
      accessToken: "",
      refreshToken: "",
      expiresAt: 0,
      updatedAt: new Date().toISOString(),
    };
    session.accessToken = "";
    session.refreshToken = "";
    session.webhookUrl = "";
    session.email = "";
    session.disconnected = true;
    session.updatedAt = new Date().toISOString();
    await fs.writeFile(this.filePath, JSON.stringify(session, null, 2), "utf-8");
  }

  /**
   * Retrieves a guaranteed fresh access token, auto-refreshing via Google OAuth if expired.
   */
  async getValidAccessToken(config: Partial<Config>): Promise<string | null> {
    const session = await this.getSession();
    if (!session || !session.refreshToken) {
      return null;
    }

    // If access token is valid for more than 60 seconds, reuse it
    if (session.accessToken && session.expiresAt > Date.now() + 60_000) {
      return session.accessToken;
    }

    // Needs refresh
    const clientId = session.clientId || config.googleClientId;
    const clientSecret = session.clientSecret || config.googleClientSecret;

    if (!clientId || !clientSecret) {
      console.warn("[google-oauth] Cannot refresh token: missing clientId/clientSecret");
      return session.accessToken || null;
    }

    try {
      console.log("[google-oauth] Refreshing expired Google OAuth access token...");
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: session.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!res.ok) {
        console.error("[google-oauth] Token refresh failed:", await res.text());
        return null;
      }

      const data = (await res.json()) as { access_token: string; expires_in: number };
      session.accessToken = data.access_token;
      session.expiresAt = Date.now() + data.expires_in * 1000;
      session.updatedAt = new Date().toISOString();
      await this.saveSession(session);

      console.log("[google-oauth] Token refreshed successfully!");
      return session.accessToken;
    } catch (err) {
      console.error("[google-oauth] Refresh error:", err);
      return null;
    }
  }
}

export const googleOAuthStore = new GoogleOAuthStore();
