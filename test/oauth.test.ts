import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { GoogleOAuthStore } from "../src/calendar/oauth-store.js";

test("GoogleOAuthStore saves, retrieves, and clears OAuth sessions", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "s2l-oauth-"));
  const filePath = path.join(dir, "google-oauth.json");
  const store = new GoogleOAuthStore(filePath);

  const initial = await store.getSession();
  assert.equal(initial, null);

  const mockSession = {
    accessToken: "mock_access_token_123",
    refreshToken: "mock_refresh_token_456",
    expiresAt: Date.now() + 3600 * 1000,
    email: "operator@example.com",
    name: "Alex Vance",
    clientId: "mock_client_id",
    clientSecret: "mock_secret",
    updatedAt: new Date().toISOString(),
  };

  await store.saveSession(mockSession);
  const loaded = await store.getSession();
  assert.ok(loaded);
  assert.equal(loaded.email, "operator@example.com");

  const validToken = await store.getValidAccessToken({});
  assert.equal(validToken, "mock_access_token_123");

  await store.clearSession();
  const cleared = await store.getSession();
  assert.equal(cleared?.disconnected, true);
  assert.equal(cleared?.accessToken, "");
});
