# API Usage Tracking — why it's empty, and every way to make it work

*Written 2026-07-15 after investigating why the API Key Analytics pages show
no usage for most keys. Short version: for most providers this is a
**provider-side restriction, not an app bug** — and there are two real
fixes, both described below.*

## Why the pages show nothing

The app asks each provider's billing/usage API for your spend. What each
provider actually allows:

| Provider | Normal key | What's needed for real usage data |
|---|---|---|
| **Anthropic** | ❌ validate-only, no metrics | **Admin key** (`sk-ant-admin…`) for `/v1/organizations/cost_report` + `usage_report` |
| **OpenAI** | ❌ validate-only, no metrics | **Admin key** (`sk-admin-…`) for `/v1/organization/costs` + `usage` |
| **Gemini (AI Studio)** | ❌ no usage/billing API exists at all | Impossible via API key (only GCP Cloud Billing export + OAuth) |
| **OpenRouter** | ✅ works fully | Nothing — normal `sk-or-…` key reports spend + balance |

A standard Anthropic/OpenAI key can prove it's *valid* (the app checks
`/v1/models`), but the usage endpoints respond 401/403 — the data simply
isn't offered to normal keys. That's why the cards say
*"standard key — add an admin key for cost/usage"*.

## Fix 1 (recommended, already wired in): locally measured usage

Several in-house desktop tools write to a shared usage ledger: each one
records the **exact `usage` block returned by the API on every call** into

```
%APPDATA%\LiftedPDFTools\api_usage*.jsonl
```

These are real token counts straight from Anthropic — not estimates — and
the **"Measured locally" panel on the Anthropic provider page** now reads
them: past 24 h / 7 days / 30 days / lifetime spend, per app.

What it covers: every call made *through those apps on this machine*.
What it can't see: calls made with the same key from other machines/tools.
For single-PC workflows (this setup) it is effectively complete.

## Fix 2: get an Anthropic Admin key (organization accounts only)

If your key belongs to an Anthropic **organization** (console.anthropic.com
→ your org must have Admin role available):

1. Go to **console.anthropic.com → Settings → Organization → API keys**.
2. Create a key with the **Admin** role — it will start `sk-ant-admin…`.
   (If you never see an Admin option, your account is an individual account
   and Anthropic does not offer admin keys for it — use Fix 1.)
3. In this app: **API Keys → Add key**, paste the admin key and tick
   **"This is an admin key"** (or it's auto-detected from the prefix).
4. Refresh — cost & usage now come from Anthropic's own
   `cost_report`/`usage_report` endpoints (org-wide, all keys, all machines).

Treat an admin key like a password: it can read org-wide billing. Prefer a
spend-capped, analytics-only workflow and never paste it into other tools.

For **OpenAI**: same idea — create an Admin key (`sk-admin-…`) from
platform.openai.com → Settings → Organization → Admin keys, add it with the
admin toggle.

For **Gemini**: no key-based option exists. Track spend via Google Cloud
Billing budgets/exports, or route Gemini calls through OpenRouter (whose
key reports usage properly).

## Which numbers should I trust?

- **Admin key numbers** = authoritative org-wide billing (all machines).
- **Locally measured numbers** = exact for everything done through the
  desktop apps on this PC, blind to anything else.
- If both are present they will differ exactly by usage from outside this
  machine — that difference is itself useful information.

## Known gap that remains (future work)

Even with an admin key, charts backfill only from the moment a key is
added — the adapters don't implement history backfill (`fetchHistory`), so
day-one charts start sparse and fill as snapshots accumulate.
