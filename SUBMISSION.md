# CALL-E Hackathon Submission Kit — Speed-to-Lead

This kit contains all the materials needed to complete the submission for the CALL-E Hackathon on Devpost and the GitHub pull request to `awesome-phone-call-agents`.

---

## 1. Devpost Submission

### Project Title
**Speed-to-Lead: Sub-15s Autonomous Voice Lead Qualifier & Demo Booker**

### Tagline / Elevator Pitch (Under 200 chars)
*Instant AI voice inbound qualification powered by CALL-E. Calls leads in <15s, qualifies via strict BANT schema, books live calendar slots, and writes to CRM with instant multi-channel confirmations.*

---

### Description (Markdown format for Devpost)

```markdown
## 💡 Inspiration
In sales, **Speed-to-Lead** is the single highest leverage metric: reaching an inbound prospect within 5 minutes increases conversion rates by **800%**. Yet most companies still take hours or days to follow up on form submissions, losing warm leads to competitors.

We built **Speed-to-Lead** to bridge this gap: an autonomous, sub-15-second inbound voice response system powered by CALL-E that automatically dials inbound leads, executes a structured BANT qualification conversation, books a calendar slot in real-time, and writes rich structured data directly into the CRM.

## 🚀 What it does
When a lead submits a web form, ad, or checkout inquiry:
1. **Interactive Live Web Console:** Built-in dark-mode web dashboard (`http://localhost:8787/`) with 1-click test lead presets, live pipeline visualizer, real-time BANT score gauge, and transcript replay.
2. **Instant Outbound Trigger (<15s):** Fastify webhook receives the payload and immediately dispatches a CALL-E voice agent (`createAndWait`) with support for both synchronous and asynchronous webhook modes (`?async=true`).
3. **Smart Auto-Region Detection:** Automatically detects country code and locale (`+1` ➔ `US`, `+60` ➔ `MY`, `+44` ➔ `GB`, `+65` ➔ `SG`, `+61` ➔ `AU`, `+91` ➔ `IN`, `+49` ➔ `DE`, `+81` ➔ `JP`) to eliminate telephony carrier mismatches.
4. **Natural Voice BANT Qualification:** The CALL-E agent conducts a natural voice conversation (with TTS safeguards against robotic timestamp pronunciation) while enforcing a strict JSON `resultSchema` to extract:
   - **Budget** (`under_5k`, `5k_25k`, `over_25k`, `unknown`)
   - **Authority** (`decision_maker`, `influencer`, `committee`, `unknown`)
   - **Need** (`critical`, `high`, `medium`, `low`, `unknown`)
   - **Timeline** (`immediate`, `within_30_days`, `within_90_days`, `exploratory`, `unknown`)
5. **Dynamic Slot Booking:** Generates two optimal meeting slots in the prospect's local timezone, presents them over the phone, and captures the prospect's selection.
6. **Weighted Scoring (0–100):** Calculates an objective, deterministic lead score and letter grade (A/B/C/D) based on verified BANT signals.
7. **Pluggable Integrations:** Automatically books the accepted slot via **Cal.com v2** (or mock provider) and synchronizes the full call summary, score, and transcript into **HubSpot v3** (or local durable JSONL).
8. **Multi-Channel Confirmations & Fallbacks:** Automatically prepares instant SMS confirmations for booked meetings and generates automated self-service reschedule links for unreachable leads.
9. **Production Reliability:** Atomic file write persistence (`temp + rename`), durable idempotency tracking (preventing duplicate calls on replay/retry), signature-ready webhook security, and exponential backoff retry for telephony faults.

## 🛠️ How we built it
- **Core Engine:** Node.js 22 + TypeScript + Fastify for sub-millisecond response latency.
- **Voice Intelligence:** `@call-e/calle` SDK utilizing CALL-E's high-fidelity voice pipeline and structured `resultSchema` validation.
- **Calendar & CRM Adapters:** Modular adapter pattern supporting both production providers (**Cal.com v2**, **HubSpot v3**) and zero-credential offline mock adapters for deterministic local testing.
- **Storage & State:** Durable JSON idempotency ledger with atomic persistence and structured JSONL CRM audit log.
- **Testing & Tooling:** 11+ automated unit and integration tests (`node:test`), live validation smoke harnesses (`validate:live`, `validate:integrations`), and production multi-stage `Dockerfile` + `docker-compose.yml`.

## 🧗 Challenges we ran into
- **Guaranteed Output Formats:** Freeform LLM conversations often produce inconsistent data structures. We leveraged CALL-E's `resultSchema` to guarantee 100% type-safe BANT outputs directly from the voice call.
- **Telephony Edge Cases:** Handling carrier variability and transient connection errors required implementing a resilient exponential backoff retry layer with durable idempotency to guarantee leads are neither dropped nor spammed.
- **Zero-Friction Evaluation:** We architected pluggable mock providers for all external services (CALL-E, Cal.com, HubSpot) so judges and developers can clone the repository and run the full end-to-end pipeline in seconds without needing paid API keys.

## 🏆 Accomplishments that we're proud of
- Built a production-ready, clean TypeScript codebase with 100% strict type safety and zero compiler warnings.
- Sub-second pipeline overhead before CALL-E outbound call dispatch.
- Resilient architecture with durable idempotency preventing duplicate outbound dials.
- Full observability with `/health`, `/metrics` endpoint, and structured audit logs.

## 🔮 What's next for Speed-to-Lead
- **Multi-channel follow-up:** Sending instant SMS confirmations with calendar invites and meeting agendas immediately after the call wraps up.
- **Human-in-the-loop Transfer:** Real-time warm transfer to an available human account executive if a lead scores Grade A during the live conversation.
- **Multi-lingual routing:** Dynamic language detection based on caller region to converse fluently in local languages.

---

### Built With
- TypeScript
- Node.js
- CALL-E Voice SDK (`@call-e/calle`)
- Fastify
- Cal.com API v2
- HubSpot API v3
- Docker & Docker Compose
```

---

## 2. Awesome-Phone-Call-Agents Pull Request (PR)

### PR Target Repository
`https://github.com/CALLE-AI/awesome-phone-call-agents`

### Target Branch
`main`

### Suggested PR Title
`Add Speed-to-Lead (Sub-15s BANT Qualifier & Demo Booker) to Agent Skills / Workflow Plugins`

### PR Description Body (Markdown)

```markdown
### What does this PR add?
Adds **Speed-to-Lead** to the `Agent Skills & Workflow Plugins` section.

**Speed-to-Lead** is a production-grade TypeScript service that uses CALL-E (`createAndWait`) to call inbound form leads within 15 seconds, qualify them via strict BANT `resultSchema`, book a live demo via Cal.com, and sync the lead score and transcript to HubSpot.

### Contribution Details
- **Project Name:** Speed-to-Lead
- **Repository:** https://github.com/<YOUR_GITHUB_USERNAME>/speed-to-lead
- **Category:** Agent Skills / Workflow Plugins
- **Key Features:**
  - Sub-15s automated outbound phone qualification on inbound webhook
  - Strict BANT `resultSchema` extraction with 0–100 deterministic scoring
  - Real-time slot offering and booking via Cal.com v2
  - HubSpot CRM v3 sync & durable local JSONL storage
  - Built-in durable idempotency and exponential backoff retry

### Markdown Entry to Add in README.md

```markdown
- [Speed-to-Lead](https://github.com/<YOUR_GITHUB_USERNAME>/speed-to-lead) - Sub-15s inbound phone lead qualification and calendar booking agent powered by CALL-E, featuring strict BANT extraction, Cal.com scheduling, and HubSpot CRM sync.
```
```

---

## 3. Demo Video Script (< 3 Minutes)

### Target Duration: 2:00 – 2:45

| Time | Scene / Screen | Script / Talking Points |
|---|---|---|
| **0:00 - 0:25** | **Slide / Intro & Problem** | "Hi everyone! In inbound sales, speed is everything. Studies show reaching a lead within 5 minutes makes them 8x more likely to convert. Today we're presenting **Speed-to-Lead**, an autonomous voice agent built on CALL-E that calls new inbound leads in under 15 seconds, qualifies them with BANT, and books a demo on the spot." |
| **0:25 - 0:55** | **Architecture & Trigger** | "Here's how it works: When a lead submits a form or ad, our Fastify webhook receives the payload. It triggers CALL-E's `createAndWait` with a strict `resultSchema`. Let's trigger a lead submission right now." *(Run lead submission via curl or UI)* |
| **0:55 - 1:45** | **Live Call Demo** | *(Show phone ringing, answer on speaker)* <br/>**Agent:** "Hi Jordan, this is Alex from Acme..." <br/>*(Show brief back-and-forth answering budget, timeline, and selecting a meeting slot)* |
| **1:45 - 2:20** | **Results & Integrations** | "As soon as the call completes, CALL-E returns the structured BANT schema. Our system calculates a weighted 0–100 lead score (Grade A), books the meeting in Cal.com, and records the lead with full transcript and audio insights in HubSpot / local CRM." *(Show terminal / logs / JSON output)* |
| **2:20 - 2:45** | **Reliability & Wrap-up** | "The project is fully typed in TypeScript, includes durable idempotency to prevent duplicate calls, has exponential backoff retry, and runs offline via mock mode for easy testing. Thanks to CALL-E for making sub-minute voice response effortless!" |

---

## 4. Final Submission Checklist

- [ ] **1. CALL-E Account:** Ensure your registered Devpost email matches your CALL-E account email.
- [ ] **2. GitHub Repository:** Ensure your repository is public and includes all code, tests, and documentation.
- [ ] **3. Open PR:** Submit the PR to `github.com/CALLE-AI/awesome-phone-call-agents`.
- [ ] **4. Video:** Upload your <3 min demo to YouTube / Loom / Vimeo and grab the link.
- [ ] **5. Devpost Form:** Paste the Title, Tagline, Description, Repo Link, PR Link, and Video Link into Devpost.
