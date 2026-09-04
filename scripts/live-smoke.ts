import {
  CalleAPIError,
  CalleClient,
  CalleConnectionError,
  CalleRateLimitError,
  CalleTimeoutError,
  type JsonObject,
} from "@call-e/calle";
import { loadConfig } from "../src/config.js";
import { withRetry } from "../src/retry.js";

function isRetryable(error: unknown): boolean {
  if (error instanceof CalleConnectionError || error instanceof CalleTimeoutError || error instanceof CalleRateLimitError) {
    return true;
  }
  if (error instanceof CalleAPIError) return error.status >= 500;
  return false;
}

/**
 * Places ONE real CALL-E call to validate connectivity and the live SDK path.
 * Retries transient 5xx / connection / timeout failures (stable idempotency key).
 *
 *   CALLE_EXAMPLE_PHONE=+14155550100 CALLE_REGION=US pnpm run validate:live
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const phone = (process.env.CALLE_EXAMPLE_PHONE ?? "").trim();
  const region = (process.env.CALLE_REGION ?? "US").trim();
  const locale = (process.env.CALLE_LOCALE ?? "en-US").trim();

  if (!config.calleApiKey) throw new Error("CALLE_API_KEY is not set in .env");
  if (!phone) throw new Error("CALLE_EXAMPLE_PHONE is not set (E.164, e.g. +14155550100)");

  const client = new CalleClient({ apiKey: config.calleApiKey, baseUrl: config.calleBaseUrl });
  const idempotencyKey = `live-smoke:${Date.now()}:v1`;
  console.log(`Placing a real CALL-E call to ${phone} (region=${region}, locale=${locale}) ...`);

  const schema: JsonObject = {
    type: "object",
    required: ["reached"],
    properties: { reached: { type: "boolean" } },
  };

  const call = await withRetry(
    () =>
      client.calls.createAndWait(
        {
          task: `Call ${phone} and confirm whether a human answered. Say this is a brief connectivity test from CALL-E.`,
          recipient: { phones: [phone], region, locale },
          resultSchema: schema,
          metadata: { source: "speed-to-lead-live-smoke" },
        },
        { idempotencyKey, timeoutMs: 180_000, intervalMs: 5_000 },
      ),
    { maxAttempts: 3, shouldRetry: isRetryable },
  );

  console.log(
    JSON.stringify(
      {
        callId: call.id,
        status: call.status,
        taskCompleted: call.taskCompleted,
        structuredResult: call.structuredResult,
        summary: call.summary,
        evidence: call.evidence,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
