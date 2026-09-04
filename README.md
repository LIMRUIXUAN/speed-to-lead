# Speed-to-Lead — Sub-15s Autonomous Voice Lead Qualifier

A production-grade CALL-E hackathon project that answers every inbound lead with an **outbound phone call in under 15 seconds**, qualifies them using strict BANT schema extraction, books a live demo slot, and writes structured records into a CRM with post-call multi-channel confirmations.

```
[Web form / ad / Stripe lead] ──► POST /api/lead-submit (Fastify)
                                        │  (< 1s)
                                        ▼
                              CALL-E outbound call  (createAndWait)
                                        │
                       • Natural voice conversational flow
                       • BANT qualification (resultSchema)
                       • Dynamic 2-slot calendar offer
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        Calendar booking (Cal.com / mock)        CRM write (HubSpot / local JSONL)
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        ▼
                       • Instant multi-channel SMS / email confirmation
                       • Fallback self-serve reschedule link for missed calls
```

## What it demonstrates

- **Visual Simulator & Live Dashboard** — Built-in single-page dark-mode web console served directly at `http://localhost:8787/` with interactive test presets, real-time BANT gauges, and transcript replay.
- **Real CALL-E usage at runtime** — `CalleClient.calls.createAndWait(...)` from `@call-e/calle`, with a strict `resultSchema` that forces schema-validated BANT output (no hallucinated availability, no ghost bookings).
- **Natural Voice Prompting** — Clean conversational phrasing preventing speech synthesis engines from reading robotic ISO timestamps out loud over the phone.
- **Smart Auto-Region Detection** — Automatically detects country code and locale (`+1` ➔ `US`, `+60` ➔ `MY`, `+44` ➔ `GB`, `+65` ➔ `SG`, `+61` ➔ `AU`, `+91` ➔ `IN`, `+49` ➔ `DE`, `+81` ➔ `JP`) to avoid telephony carrier mismatches.
- **Sync & Async Execution Modes** — Supports immediate `202 Accepted` background processing (`?async=true` or header `prefer: respond-async`) to prevent webhook timeouts from upstream providers (Typeform, Stripe, Zapier).
- **Post-Call Multi-Channel Confirmations & Fallbacks** — Generates instant SMS confirmations for booked meetings and automatic self-serve reschedule links for unreachable calls.
- **Thread-safe Idempotency** — Atomic file write persistence (`temp + rename`) and in-memory queue to guarantee zero race conditions on concurrent leads.
- **Pluggable booking & CRM** — Swap between Cal.com / HubSpot and offline mock providers via env vars, so the demo runs end-to-end without extra credentials.
- **Tested & containerized** — 12 unit + integration tests and a production multi-stage Docker image.

## Quick start (Interactive Web Console)

```bash
cd speed-to-lead
pnpm install
pnpm run dev              # starts the server in CALLE_MODE=mock
```

Open your browser at **`http://localhost:8787/`** to view the live dashboard and trigger test leads with one click!

Alternatively, test from the terminal:

```bash
pnpm test                 # run the automated test suite (12 passing tests)
pnpm run test:mock        # exercises the full pipeline without placing a call

curl -s http://localhost:8787/health
curl -s http://localhost:8787/metrics

curl -s http://localhost:8787/api/lead-submit \
  -H 'Content-Type: application/json' \
  -d '{"name":"Jordan Smith","phone":"+14155550100","email":"jordan@example.com","company":"Summit Roofing","source":"google-ads","interest":"Solar lead response"}'
```

## Live mode (real calls)

```bash
cp .env.example .env
# edit .env and set:
#   CALLE_API_KEY=...          (from https://dashboard.heycall-e.com/account/api-keys)
#   CALLE_MODE=live
pnpm run dev
```

### Validate your live wiring first (recommended)

Before submitting, prove the CALL-E path works with **one** real call to a number
you control:

```bash
CALLE_EXAMPLE_PHONE=+14155550100 pnpm run validate:live
```

And validate Cal.com / HubSpot with your real credentials:

```bash
pnpm run validate:integrations
```

| Env var | Default | Purpose |
| --- | --- | --- |
| `CALLE_API_KEY` | — | CALL-E API key (required in `live` mode) |
| `CALLE_BASE_URL` | `https://api.heycall-e.com` | CALL-E API base URL |
| `CALLE_MODE` | `mock` | `live` places real calls; `mock` is offline |
| `CALL_TIMEOUT_MS` | `240000` | Max wait for a terminal call result |
| `PORT` / `HOST` | `8787` / `0.0.0.0` | Server bind |
| `WEBHOOK_SECRET` | — | Optional shared secret (send as `X-Webhook-Secret`) |
| `COMPANY_NAME` | `Acme` | Company name the agent introduces itself as |
| `AGENT_TIMEZONE` | `America/Los_Angeles` | Timezone used for booking |
| `CALENDAR_PROVIDER` | `mock` | `calcom` or `mock` |
| `CALCOM_API_KEY` / `CALCOM_EVENT_TYPE_ID` | — | Cal.com v2 credentials |
| `CRM_PROVIDER` | `local` | `hubspot` or `local` |
| `HUBSPOT_ACCESS_TOKEN` | — | HubSpot private app token |
| `CRM_LOCAL_PATH` | `./data/leads.jsonl` | Local JSONL store |
| `IDEMPOTENCY_PATH` | `./data/idempotency.json` | Durable idempotency ledger |

## Webhook contract

`POST /api/lead-submit`

```json
{
  "name": "Jordan Smith",
  "phone": "+14155550100",
  "email": "jordan@example.com",
  "company": "Summit Roofing",
  "source": "google-ads",
  "interest": "Solar lead response",
  "idempotency_key": "optional-durable-dedupe-key"
}
```

Response: the lead record, CALL-E call id, schema-validated BANT qualification, a
0–100 lead score with grade, the booking (if the prospect accepted a slot), the
call summary, evidence, and transcript.

**Idempotency:** if you send an `idempotency_key`, the first call processes the lead
and persists the outcome; any later request with the same key returns the stored
outcome with `"replayed": true` and does **not** place another call. The ledger is
durable across restarts (`IDEMPOTENCY_PATH`). Without a key, one is generated per
request from the lead id.

**Auth:** set `WEBHOOK_SECRET` and send it as the `X-Webhook-Secret` header.
Note: CALL-E's current webhook deliveries are unsigned, so this app uses a shared
secret rather than signature verification.

## Testing

```bash
pnpm test                 # unit + integration tests via node:test
pnpm run typecheck        # strict TypeScript check
pnpm run build            # compile to dist/
```

## Docker

```bash
docker compose up --build   # serves on http://localhost:8787
```

`docker-compose.yml` reads your `.env` for `CALLE_API_KEY` etc. and mounts
`./data` so idempotency and CRM records persist across container restarts.

## CI/CD & Google Cloud Run Deployment

The project includes an enterprise-grade two-stage **GitHub Actions** deployment pipeline designed for **Google Gemini Flash** and **Google Cloud Run**:

- **PR Verification (`.github/workflows/ci.yml`)**: Runs typechecks, tests, builds, and builds a dry-run container image on all PRs to `main`/`master`.
- **Cloud Run Deployment (`.github/workflows/deploy.yml`)**: Builds container image with Buildx layer caching, pushes to Google Artifact Registry, deploys zero-downtime revision to Cloud Run with Secret Manager binding, and smoke tests the live `/health` endpoint.

### 1-Click GCP Provisioning

Run the setup script with the `gcloud` CLI to automatically configure APIs, Artifact Registry, IAM service accounts, and Secret Manager:

**Linux / macOS / Cloud Shell:**
```bash
chmod +x ./scripts/setup-gcp.sh
./scripts/setup-gcp.sh
```

**Windows (PowerShell):**
```powershell
./scripts/setup-gcp.ps1
```

### GitHub Secrets Required

Configure these in your GitHub repository (**Settings > Secrets and variables > Actions**):
- `GCP_PROJECT_ID` — Your Google Cloud project ID
- `GCP_SA_KEY` — The JSON key string generated by `setup-gcp.sh` (or configure `WIF_PROVIDER` for keyless OIDC)
- `GEMINI_API_KEY` — Your Google Gemini Flash API key (saved in Secret Manager)

## Project layout

```
src/
  index.ts            Fastify server + /health + /metrics
  config.ts           env parsing
  types.ts            BANT enums, Lead, E.164 normalization
  calle.ts            CALL-E createAndWait + BANT resultSchema + retry + mock
  retry.ts            exponential-backoff retry helper
  store.ts            durable JSON idempotency ledger
  metrics.ts          in-memory counters
  scoring.ts          0–100 weighted lead score
  service.ts          orchestration: slots -> qualify -> score -> book -> CRM
  routes/lead-submit.ts
  calendar/           CalendarProvider (mock + Cal.com v2)
  crm/                CrmProvider (local JSONL + HubSpot v3)
test/                 node:test unit + integration tests
scripts/              smoke (mock), live-smoke (real call), integrations-check
```

## Submission checklist (CALL-E hackathon)

- [ ] Open a PR to https://github.com/CALLE-AI/awesome-phone-call-agents (Agent Skills / Workflow Plugins area per its README)
- [ ] Run `pnpm run validate:live` to prove a real CALL-E call, and record it for the demo
- [ ] Record a <3 min demo video showing the app running + a live call
- [ ] Provide the PR URL, description, video link, and CALL-E account email on Devpost
