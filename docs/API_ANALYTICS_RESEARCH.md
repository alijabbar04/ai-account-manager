# API Key Analytics — Provider Research Report

**Date:** 2026-07-09 · Verified against official provider docs (2026-current).

This report answers the discovery task: for each provider, what usage / cost /
credit / rate-limit data is reachable **with an API key held by a desktop app**,
what is not, and what must be estimated. It drives the adapter design in
[API_ANALYTICS_DESIGN.md](API_ANALYTICS_DESIGN.md).

## The one fact that shapes everything

**This app is not a proxy.** It does not sit between the user's code and the
provider, so it cannot observe individual requests or their token counts. Every
number it shows must come from a provider endpoint that reports account-level
state. Where a provider exposes only a *cumulative* counter (running spend, a
decrementing balance), the app derives "today / this week / this month" and the
trend charts by **snapshotting that counter over time and differencing** — see
the analytics engine. Where a provider exposes nothing for a plain key, the
metric is shown as unavailable (honestly labeled), never fabricated.

## Capability matrix (with a standard, user-held key)

| Provider | Balance / credits | Usage (tokens/req) | Cost (USD) | Rate limits | Key validation |
|---|---|---|---|---|---|
| **OpenRouter** | ✅ exact (`/key`, `/credits`) | ✅ exact rolling windows (`/key`) | ✅ exact (`usage*`) | ⚠️ deprecated field | ✅ `/key` |
| **Anthropic** | ❌ none | 🔑 admin key only | 🔑 admin key only | ⚠️ headers on real calls / 🔑 admin endpoint | ✅ `/v1/models` |
| **OpenAI** | ❌ none | 🔑 admin key only | 🔑 admin key only | ⚠️ headers on real calls | ✅ `/v1/models` |
| **Gemini** | ❌ none | ❌ per-response only | ❌ estimate from tokens×price | ❌ docs-only tiers | ✅ `/v1beta/models` |

✅ exact · 🔑 requires a separate Admin/org key · ⚠️ partial / on-request · ❌ not available via the key

---

## OpenRouter — the best-supported provider

Holds an **inference key** `sk-or-v1-…`. Build the dashboard around **`GET
https://openrouter.ai/api/v1/key`** (`Authorization: Bearer <key>`), which returns
for the authenticating key:

- `label`, `is_free_tier`
- `limit`, `limit_remaining`, `limit_reset` — the credit limit and remaining balance
- `usage`, `usage_daily`, `usage_weekly`, `usage_monthly` — **rolling spend windows, USD, direct** (no snapshotting needed)
- `rate_limit` — **deprecated**, "safe to ignore" (limits are now credit-derived)

- **Balance:** `GET /api/v1/credits` → `{ data: { total_credits, total_usage } }`,
  balance = `total_credits − total_usage`. **Caveat:** 2026 docs say `/credits`
  may require a *management* key and can `403` an inference key — so the adapter
  tries `/credits` and falls back to `/key`'s `limit_remaining`.
- **Per-request cost:** `GET /api/v1/generation?id=…` → `total_cost`,
  `native_tokens_prompt/completion` (not used by the dashboard, documented for completeness).
- **Pricing table:** `GET /api/v1/models` (public) → per-model `pricing.prompt/completion` (USD/token).
- **Historical series:** only with a management key (`POST /api/v1/analytics/query`);
  with an inference key, longer history comes from the app's own snapshots.
- **Validation:** `GET /api/v1/key` → 200 valid / 401 invalid.

Sources: openrouter.ai/docs/api-reference/{limits,get-credits,list-available-models,get-a-generation}.

## Anthropic (Claude developer API)

Standard key `sk-ant-api03-…`; admin key `sk-ant-admin01-…` (org admins only).

- **Usage & cost — admin key only:** `GET /v1/organizations/usage_report/messages`
  (tokens, `bucket_width` 1m/1h/1d) and `GET /v1/organizations/cost_report` (USD,
  cents as decimal strings, daily). Auth `x-api-key: sk-ant-admin01-…`. Standard
  keys are rejected; individual (non-org) accounts have no admin key at all.
- **Balance/credits:** none via API (Console UI only).
- **Rate limits:** live remaining only from `anthropic-ratelimit-*` **response
  headers** on real `POST /v1/messages` calls; configured limits via
  `GET /v1/organizations/rate_limits` (admin key). The app makes neither inference
  calls nor requires an admin key by default, so rate limits are shown only when an
  admin key is present.
- **Validation:** `GET /v1/models` with `x-api-key` + `anthropic-version: 2023-06-01`
  → 200/401, no tokens billed.

Sources: platform.claude.com/docs/en/{manage-claude/usage-cost-api, api/rate-limits, api/models-list}.

## OpenAI

Project key `sk-proj-…` / legacy `sk-…`; admin key `sk-admin-…`.

- **Usage — admin key only:** `GET /v1/organization/usage/completions` (+ embeddings,
  images, audio, …) → `input_tokens`, `output_tokens`, `num_model_requests`,
  bucketed; `start_time` (unix s) required, `bucket_width` 1m/1h/1d. **Tokens/requests, not USD.**
- **Cost — admin key only:** `GET /v1/organization/costs` → `amount.value` (USD),
  daily buckets. Authoritative for spend. Auth `Authorization: Bearer sk-admin-…`.
- **Balance/credits:** none via API. The legacy `/dashboard/billing/*` routes need a
  browser **session token** (`sess-…`), not an API key — unusable here.
- **Rate limits:** `x-ratelimit-*` **response headers** on real calls only (no
  pre-flight endpoint except fine-tuning).
- **Validation:** `GET /v1/models` → 200/401.

Sources: platform.openai.com/docs/api-reference/{usage,administration}, developers.openai.com/api/docs/guides/rate-limits.

## Gemini (Google AI Studio key)

Key `AIza…` (some 2026 accounts issue `AQ.…`; validate by calling, not by prefix).
The AI Studio key is an **inference credential only**.

- **Usage:** none via API. Per-response `usageMetadata`
  (`promptTokenCount`/`candidatesTokenCount`/`totalTokenCount`) only — which this
  non-proxy app never sees. Aggregate usage is AI-Studio-web-only.
- **Cost:** none via the key. Real billing needs the GCP path (Cloud Billing /
  Cloud Monitoring APIs, a GCP project + OAuth2/service account) — out of scope.
  Cost can only be **estimated** = tokens × per-model price (static price table).
- **Balance:** none via API (Prepay balance is AI-Studio-web-only).
- **Rate limits:** none via API/headers; documented per tier (Free/1/2/3), `429`
  on exceed. Point-in-time headroom is not knowable programmatically.
- **Validation:** `GET /v1beta/models?key=…` → 200 + model list / 400 invalid.

Sources: ai.google.dev/gemini-api/docs/{rate-limits,billing,pricing,tokens}, ai.google.dev/api/models.

---

## What this means for the product

- **OpenRouter** is a first-class citizen: balance, rolling spend windows, and
  lifetime usage all render exactly, live, from one key.
- **Anthropic & OpenAI** render spend/usage **only when the user supplies an Admin
  key** (the UI offers an "admin/org key" toggle and explains why). With a standard
  key we still validate it and show that it's active; cost tiles read "needs admin key".
- **Gemini** shows validation + a clear "no analytics available for AI Studio keys"
  note; cost is offered as a local **estimate** only if the user opts in with a
  price table. Never presented as authoritative.
- **Balance** is genuinely unavailable except on OpenRouter, so the runway/projection
  headline features are most meaningful there; for postpaid providers the app shows
  spend and projected monthly instead of runway.
- **Rate limits** are surfaced where an endpoint exists (OpenRouter limit fields,
  Anthropic admin endpoint); we do not make inference calls purely to scrape headers.

Every adapter therefore reports a **capability descriptor** so the UI can show
"exact", "needs admin key", "estimated", or "unavailable" per metric rather than
implying precision that the provider does not offer.
