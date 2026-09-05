import Fastify from "fastify";
import { createCalendarProvider } from "./calendar/index.js";
import { loadConfig } from "./config.js";
import { createCrmProvider } from "./crm/index.js";
import { getDashboardHtml } from "./dashboard.js";
import { metrics } from "./metrics.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerIntegrationsRoutes } from "./routes/integrations.js";
import { registerLeadRoutes } from "./routes/lead-submit.js";
import type { ServiceDeps } from "./service.js";
import { JsonFileStore } from "./store.js";

const config = loadConfig();

if (config.calleMode === "live" && !config.calleApiKey) {
  console.error("[speed-to-lead] CALLE_MODE=live but CALLE_API_KEY is not set. Set it in .env or use CALLE_MODE=mock.");
  process.exit(1);
}

const app = Fastify({ logger: true });

const deps: ServiceDeps = {
  config,
  calendar: createCalendarProvider(config),
  crm: createCrmProvider(config),
};
const store = new JsonFileStore(config.idempotencyPath);

app.get("/", async (req, reply) => {
  reply.type("text/html");
  return getDashboardHtml({
    companyName: config.companyName,
    calleMode: config.calleMode,
    calendarProvider: deps.calendar.name,
    crmProvider: deps.crm.name,
  });
});

app.get("/favicon.ico", async (_req, reply) => {
  reply.code(204).send();
});

app.get("/health", async () => ({
  ok: true,
  mode: config.calleMode,
  calendar: deps.calendar.name,
  crm: deps.crm.name,
  company: config.companyName,
}));

app.get("/metrics", async () => ({
  ...metrics,
  uptime_seconds: Math.round(process.uptime()),
}));

registerLeadRoutes(app, config, deps, store);
registerAuthRoutes(app, config);
registerIntegrationsRoutes(app, config);

async function start(): Promise<void> {
  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void start();
