# TODOS

## P2 — Ship soon

### E2E tests for demo happy path
**What:** Playwright test that opens /demo, clicks a suggested prompt, waits for a response, and asserts (a) a message appears and (b) at least one tool call appears in the trace panel.
**Why:** Ship-confidence test — the one you'd want passing before sharing with the AI Minister's chief of staff.
**Context:** No test framework is installed. Install Playwright, configure it to run against `localhost:3000`, and write the happy-path test for each of the three modes (BBC, Justice, Planning).
**Effort:** M (human: ~1 day) → S with CC (~15 min)
**Depends on:** /demo page being shipped

### Live usage counter
**What:** A counter showing "X questions answered today" on the /demo page, backed by Vercel KV or Upstash Redis. Increment on each successful /api/chat response.
**Why:** Social proof — when the AI Minister's chief of staff shares the link, the counter tells each new visitor "other people are looking at this."
**Context:** No persistent store exists. Vercel KV is the simplest option (native to Vercel). Upstash is free for low traffic.
**Effort:** S (human: ~4 hours) → S with CC (~15 min + Upstash/KV setup)
**Depends on:** /demo page live + real traffic to make the counter meaningful

## P3 — Phase 2

### BAILII integration for justice mode
**What:** When BAILII opens a public API (or if a scraping-approved approach exists), replace the legislation.gov.uk fallback with real case law search for the justice demo.
**Why:** The current justice mode uses statute and GOV.UK guidance, not case law. Real case law results would make the justice demo significantly more compelling to a legal audience.
**Context:** BAILII currently has no public API. Monitor for changes. The Judiciary's published judgments at judiciary.gov.uk could be a partial alternative.
**Effort:** M (human: ~3 days) → S with CC (~30 min once API exists)

### Explore Signal fork for production messenger
**What:** Evaluate forking Signal's open-source client and server code as the foundation for a production-quality Public AI messenger app.
**Why:** Signal provides mature encrypted messaging UX and infrastructure patterns that could accelerate delivery of a robust Public AI messenger.
**Context:** Run a feasibility study covering license constraints, hosting/ops complexity, protocol compatibility, account model, moderation/safety requirements, and integration points for Public AI agents/tool-calls.
**Effort:** L (human: ~1-2 weeks discovery) → M with CC (~2-4 hours for initial technical/architecture assessment)
