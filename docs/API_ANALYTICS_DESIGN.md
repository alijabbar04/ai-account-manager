# API Key Analytics — Technical Design

**Feature:** a unified dashboard tracking usage, limits, balances, and trends for
AI API providers (Anthropic, OpenAI, Gemini, OpenRouter), added to the existing
AI Account Manager without disturbing account management.

Read [API_ANALYTICS_RESEARCH.md](API_ANALYTICS_RESEARCH.md) first — the provider
capability matrix is the premise for everything here.

## 1. Principles

1. **Keys never leave the main process.** The renderer's CSP is `connect-src
   'none'`; all provider HTTP happens in the main process. The renderer receives
   only derived, non-secret state. Secrets are DPAPI-encrypted at rest.
2. **Honesty over completeness.** Each metric carries a capability
   (`exact` / `admin` / `derived` / `estimated` / `none`); the UI shows exactly
   how a number was obtained and never fabricates precision.
3. **Snapshot-and-diff as the universal engine.** Since the app can't observe
   requests, it polls each provider's cumulative counters and differences them to
   produce windows and trends. Providers that expose direct windows (OpenRouter)
   short-circuit this for accuracy.
4. **Additive, non-breaking.** New modules live under `electron/lib/api/**` and new
   renderer views under `src/views/**`. The account dashboard becomes the
   "Accounts" view behind a new sidebar; all existing IPC channels are untouched.

## 2. Data model (shared/types.ts)

- `ProviderId` = `anthropic | openai | gemini | openrouter` (open for more).
- `ProviderMeta` — display name, key prefixes, docs URL, accent, `capabilities`,
  `supportsAdminKey`, `billingModel`.
- `ApiKeyRecord` — non-secret: `{ id, provider, nickname, maskedKey, createdAt,
  isAdminKey?, monthlyBudgetUsd? }`.
- `ProviderSnapshot` — one poll: cumulative `lifetimeCostUsd/Tokens/Requests`,
  point-in-time `balanceUsd/creditLimitUsd`, `rpmLimit/tpmLimit/rpdLimit`, and an
  optional `directCost` window block for providers that report windows themselves.
- `ApiKeyState` — everything the UI needs per key (record + meta + latest snapshot
  + `usage: Record<MetricKind, WindowUsage>` + status + balance + projection).
- `AnalyticsSummary` — cross-key roll-ups for the Analytics page.
- `ChartSeries` — `DayBucket[]` for a (metric, range) with a `sparse` flag.

## 3. Storage (main process, %APPDATA%\AIAccountManager\)

| File | Contents | Secret? |
|---|---|---|
| `api-keys.json` | `ApiKeyRecord[]` | no |
| `api-keys-vault.json` | `{ recordId: base64(DPAPI ciphertext) }` | **yes, encrypted** |
| `api-usage-snapshots.json` | `{ recordId: ProviderSnapshot[] }` (capped ~2000/key) | no |

Split secret from metadata so a leak of one file is useless. All writes are atomic
(temp + rename), matching the existing store.

### Security specifics
- `safeStorage.encryptString` (DPAPI on Windows) encrypts each secret; the OS holds
  the master key, scoped to the Windows user. If `isEncryptionAvailable()` is false,
  adding a key is refused rather than storing plaintext.
- `maskKey()` keeps the provider prefix + last 4 chars: `sk-ant-*******…**wxyz`.
- Keys are never logged: the HTTP helper takes the secret as an argument, sets it
  only on the `Authorization`/`x-api-key` header, and never stringifies it. Errors
  carry status codes, not request bodies/headers.
- Export writes records only; secrets are never exported.

## 4. Provider adapters (electron/lib/api/adapters/)

Common interface:

```ts
interface ProviderAdapter {
  meta: ProviderMeta;
  detectKeyKind(secret): { valid: boolean; isAdminKey: boolean };  // format check
  fetchSnapshot(secret, record): Promise<ProviderSnapshot>;        // the live poll
  fetchHistory?(secret, record): Promise<ProviderSnapshot[]>;      // optional backfill
}
```

- **OpenRouterAdapter** — `GET /api/v1/key` (balance via `limit_remaining`, direct
  `usage_daily/weekly/monthly`, lifetime `usage`); tries `/api/v1/credits`, falls
  back gracefully. Everything `exact`.
- **AnthropicAdapter** — standard key: validate via `GET /v1/models`, no metrics.
  Admin key: `GET /v1/organizations/cost_report` summed from a fixed origin →
  cumulative `lifetimeCostUsd`; `usage_report/messages` → tokens/requests;
  `fetchHistory` backfills daily snapshots so charts populate immediately.
- **OpenAIAdapter** — standard key: validate via `GET /v1/models`. Admin key:
  `GET /v1/organization/costs` (USD) + `/usage/completions` (tokens/requests),
  same cumulative-from-origin + history backfill.
- **GeminiAdapter** — validate via `GET /v1beta/models`; all metrics `none`/
  `estimated`; snapshot records validity + tier note only.

The registry (`adapters/index.ts`) exposes `PROVIDER_META` and `getAdapter(id)`.

All requests use a 15s `AbortController` timeout and normalize failures into
`{ ok: false, error }` snapshots (offline, 401 → "key invalid/expired", 403 →
"needs admin/management key").

## 5. Analytics engine (electron/lib/api/analytics.ts) — pure & tested

- `consumptionBetween(series, from, to)` — sum of positive deltas of a cumulative
  series in a window; **reset-safe** (a counter drop contributes 0, not negative).
- `windowUsage` — today / week / month / lifetime per metric.
- `dailyBuckets` — zero-filled per-day `{ daily, running }` for charts.
- `avgDailySpend` — averaged only over days with snapshot coverage.
- `projectSpend` — `avgDaily`, `projectedMonthly = avgDaily×30`,
  `runwayDays = balance / avgDaily`.
- `computeStatus` — green/yellow/red from runway (<7 red, <21 yellow), else balance
  floor, else budget utilization (≥100% red, ≥80% yellow).
- `runwayPhrase` — "Approximately N days remaining at the current burn rate."

The service prefers `snapshot.directCost` for the cost metric when present
(OpenRouter), else derives via the engine.

## 6. Service & scheduling (electron/lib/api/apiService.ts)

- `refreshKey(id)` / `refreshAll()` — poll adapters, append snapshots, dedupe
  near-identical consecutive readings to keep the series compact.
- On add: run `fetchSnapshot` + optional `fetchHistory` to seed charts.
- Poll every 10 min; also on window focus (shared gate with account refresh).
- `buildKeyStates()` and `buildSummary()` assemble the renderer payload;
  `buildChart(id, metric, range)` returns a `ChartSeries`.
- Emits `apikeys:changed` to the renderer, mirroring `state:changed`.

## 7. IPC surface (additions only)

```
apikeys:list · apikeys:add · apikeys:update · apikeys:remove · apikeys:export
apikeys:refresh(id?) · apikeys:validate(provider, secret)
apikeys:chart(id, metric, range) · apikeys:summary
providers:meta
                             event: apikeys:changed
```

Exposed on `window.cam` under an `apiKeys` namespace to keep the surface tidy.

## 8. Renderer

- **Sidebar** navigation with sections: **Accounts** (existing dashboard),
  **API Dashboard**, **API Keys**, **Analytics**, and per-provider **Provider**
  pages. Theme toggle + refresh move into the sidebar/topbar shell.
- **API Dashboard** — compact per-provider balance/today/week cards (the brief's
  example), plus the headline runway warning.
- **API Keys** — table of keys (masked), add/edit/remove, per-key status, validate.
- **Analytics** — top provider, most-used model, avg daily, projected monthly,
  runway; the chart panel (metric × range switcher, line/area, daily/running).
- **Provider page** — a single provider's keys, capability notes, and charts.
- **Chart** — dependency-free inline SVG (line + area, hover crosshair/tooltip),
  colored from the validated categorical palette; respects light/dark.

## 9. Non-breaking guarantees & tests

- No existing file's behavior changes except `App.tsx` (wrapped in a sidebar shell)
  and additive `ipc.ts` / `preload.ts` / `types.ts` entries.
- Tests: analytics math (windows, reset-safety, buckets, runway/projection), key
  masking, and adapter format/capability detection — all pure, run under Node.
- E2E: Playwright drives the new sidebar, adds a key (mocked provider), and asserts
  the dashboard/analytics render; existing account-view E2E remains green.

## 10. Migration

Purely additive; first launch creates the three new files lazily. No change to
`profiles.json` or existing snapshots. Documented in the README migration section.
