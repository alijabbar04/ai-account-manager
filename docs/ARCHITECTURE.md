# AI Account Manager — Technical Architecture

**Version:** 1.0 · **Target OS:** Windows 10 / 11 · **Date:** 2026-07-08

AI Account Manager is a Windows desktop application that manages multiple
Claude Code accounts on one machine. Each account is an isolated Claude Code
configuration directory (`CLAUDE_CONFIG_DIR`); the app never stores or handles passwords —
it only points tools at existing, already-authenticated Claude Code sessions.

---

## 1. Discovery findings (what the design is built on)

All findings verified empirically against Claude Code **2.1.201** (native install) on
Windows 11.

### 1.1 How Claude Code stores sessions

A Claude Code "login" is fully contained in its configuration directory
(default `%USERPROFILE%\.claude`):

| File | Contents |
|---|---|
| `.credentials.json` | `claudeAiOauth: { accessToken, refreshToken, expiresAt, scopes, subscriptionType, rateLimitTier }` — the OAuth session. On Windows this is a plain file inside the config dir (macOS uses Keychain). |
| `.claude.json` | Non-secret account state: `oauthAccount` (email, display name, organization, billing type, seat tier, rate-limit tier), onboarding flags, project history. **Note:** when `CLAUDE_CONFIG_DIR` is set, this file lives *inside* that dir (verified), not at `~/.claude.json`. |
| `projects/<slug>/*.jsonl` | Per-project session transcripts, including per-message token usage. |
| `settings.json`, `history.jsonl`, … | Settings, prompt history, caches. |

Login is a browser OAuth flow (`claude auth login`, or on first run). Google-authenticated
and Anthropic-authenticated accounts produce identical OAuth tokens — the identity
provider is only involved in the browser during login. Nothing about the Google/Anthropic
password ever touches disk.

### 1.2 How `CLAUDE_CONFIG_DIR` works

Setting `CLAUDE_CONFIG_DIR=<dir>` redirects **everything** above to `<dir>`. Verified:
running `claude auth status` with a fresh empty dir reports
`{ "loggedIn": false, "authMethod": "none" }` and materializes a new `.claude.json`
inside that dir. Therefore: **one directory = one fully isolated account**, including
its OAuth session, settings, history, and usage transcripts.

**The home-default asymmetry (verified, load-bearing):** when the variable is *unset*,
Claude Code uses `~\.claude` as the config dir but keeps `.claude.json` at the sibling
path `~\.claude.json`. Explicitly setting `CLAUDE_CONFIG_DIR=~\.claude` makes it look
for `.claude.json` *inside* the dir — not finding it, it forks fresh state (losing
account metadata/history for that session). The app therefore special-cases the home
default profile everywhere: launches it with the variable **unset**, reads identity
from the sibling file, treats "no user-level variable" as that profile being the
effective default, and *clears* (rather than sets) the variable when the user makes it
the default.

### 1.3 Concurrency

Multiple Claude Code processes run concurrently without conflict:
- Different `CLAUDE_CONFIG_DIR` values → fully independent (separate credentials, state).
- Even the *same* config dir supports multiple simultaneous sessions (Claude Code's
  normal multi-terminal behavior).

The app therefore launches any number of accounts side by side.

### 1.4 Usage statistics — exact values ARE available

Two supported surfaces were found in the CLI binary and verified live:

1. **`GET https://api.anthropic.com/api/oauth/usage`**
   Headers: `Authorization: Bearer <accessToken>`, `anthropic-beta: oauth-2025-04-20`.
   Returns exact data (verified response):
   - `limits[]`: `{ kind: session | weekly_all | weekly_scoped, percent, severity, resets_at, is_active, scope.model.display_name }` — the model-scoped entry is the
     "Fable"/"Opus" weekly limit shown in Claude Code's `/usage` panel.
   - `five_hour` / `seven_day`: `{ utilization, resets_at }`.
   - `extra_usage` / `spend`: purchased-credit balance and spend, with currency.
2. **`claude auth status --json`** — `{ loggedIn, authMethod, apiProvider }` per config dir.

Access tokens expire (`expiresAt` in credentials). The CLI refreshes via
**`POST https://platform.claude.com/v1/oauth/token`** (`grant_type=refresh_token`) with
Claude Code's public OAuth `client_id` (`9d1c250a-e61b-44d9-88ed-5944d1962f5e`, embedded
in the CLI). The app performs the same refresh so dashboards for idle accounts stay live.

**Conclusion:** the dashboard displays *exact* values. A local estimation layer
(§4.6) still exists as a fallback for offline/expired-token situations.

---

## 2. Stack decision

**Electron 42 + React 19 + TypeScript + Vite 7**, packaged with electron-builder (NSIS).

Tauri was preferred by the brief and was evaluated first. Electron was chosen because:

1. **No Rust toolchain on the target machine** — Tauri requires Rust + MSVC Build Tools
   (~4 GB install) before the first compile; Node 24 is already present.
2. **Proven pipeline on this machine** — two production Electron apps are already built
   here with the exact electron-42/vite-7/electron-builder combination, including a
   known-good NSIS installer configuration.
3. Identical security posture for this app's threat model: all secrets stay in the main
   process; the renderer is sandboxed with `contextIsolation` and no `nodeIntegration`.

The renderer/business-logic split is Tauri-shaped (thin typed IPC boundary, all
privileged work in the backend), so a future Tauri port would keep the React app intact.

---

## 3. Process architecture

```
┌────────────────────────────────────────────────────────────┐
│ Main process (Node)                                        │
│                                                            │
│  ProfileStore      profiles.json in the app-data folder    │
│  AccountReader     identity from <dir>\.claude.json        │
│  UsageService      oauth/usage + token refresh + cache     │
│  LocalStats        last-active & estimates from *.jsonl    │
│  Launcher          wt/pwsh/claude/VS Code with env         │
│  DefaultEnv        HKCU\Environment CLAUDE_CONFIG_DIR      │
│  LoginWatcher      watches .credentials.json after login   │
│         │ typed IPC (invoke/handle + push events)          │
├─────────┼──────────────────────────────────────────────────┤
│ Preload │ contextBridge → window.cam.* (allowlisted)       │
├─────────┼──────────────────────────────────────────────────┤
│ Renderer│ React dashboard (sandboxed, CSP, no Node)        │
└────────────────────────────────────────────────────────────┘
```

### 3.1 Modules (main process)

- **ProfileStore** — CRUD over `profiles.json`
  (`{ id, name, configDir, createdAt }[]` — metadata only, never secrets).
  Import registers any existing directory; export writes the same metadata as JSON.
- **AccountReader** — derives non-secret identity per profile: email, display name,
  organization, billing/seat tier, rate-limit tier (from `.claude.json`),
  subscription type and token expiry (from `.credentials.json`). **Tokens are read in
  the main process only and never cross the IPC boundary.**
- **UsageService** — per profile: read token at call time → refresh if expired
  (atomic write-temp-then-rename, `.bak` of the original kept once) → GET usage →
  normalize to `UsageSnapshot`. Snapshots cached in memory and persisted (per profile)
  so the dashboard renders last-known data instantly on startup with a staleness stamp.
  Polling: on demand, on window focus, and every 5 minutes.
- **LocalStats** — scans `<dir>\projects\**\*.jsonl` file stats (bounded) for
  last-active time and session counts in the 5-hour/7-day windows; reads recent
  transcripts' `usage` fields for token totals (fallback estimation, §4.6).
- **Launcher** — spawns processes with `CLAUDE_CONFIG_DIR` injected (§4.4).
- **DefaultEnv** — sets/clears the *user-level* `CLAUDE_CONFIG_DIR` environment variable
  (HKCU) so new shells default to a chosen account; broadcasts `WM_SETTINGCHANGE`.
- **LoginWatcher** — after "Add account → Login", polls that profile's
  `.credentials.json` (2 s, 10 min timeout) and pushes a state update when login lands.

### 3.2 IPC surface

`ipcMain.handle` channels, mirrored by a typed `window.cam` API in the preload:

```
profiles:  list · create · import · rename · remove · export
default:   get · set · clear
state:     get (full ProfileState[])            events: state:changed (push)
usage:     refresh(profileId | all)
launch:    claude · vscode · powershell · login (profileId)
sys:       revealProfileFolder · openExternal · pickFolder
ui:        getTheme · setTheme
```

`ProfileState` (everything the renderer sees):

```ts
{ profile: Profile,
  identity: { loggedIn, email?, displayName?, orgName?, billingType?, seatTier?,
              rateLimitTier?, subscriptionType?, tokenExpired? },
  usage:    UsageSnapshot | null,     // limits[], extraUsage, fetchedAt, error?
  activity: { lastActiveAt?, sessions5h, sessions7d, estTokens5h?, estTokens7d? },
  isDefault: boolean }
```

---

## 4. Key behaviors

### 4.1 Account model

A profile is a **pointer to a directory** — e.g. `C:\Users\me\.claude-max1`. The app creates
new dirs as `%USERPROFILE%\.claude-<slug>` or imports any existing one (including the
default `~\.claude`, which can be registered as a profile without moving it).
Unlimited profiles; removal only unregisters by default (optional checkbox to also
delete the directory, with an explicit confirm — that erases that account's local
session).

### 4.2 Adding an account (no passwords, ever)

1. The app creates + registers the directory.
2. "Open login terminal" launches PowerShell with `CLAUDE_CONFIG_DIR=<dir>` running
   `claude auth login` — the browser handles Anthropic *or* Google sign-in.
3. LoginWatcher sees `.credentials.json` appear → dashboard flips to 🟢 and usage loads.

### 4.3 Switching / launching

All launches inject `CLAUDE_CONFIG_DIR` into the child environment (and strip
`ELECTRON_RUN_AS_NODE`/`ELECTRON_*` so Electron-based children like VS Code behave):

| Action | Mechanism |
|---|---|
| Open PowerShell | Windows Terminal `wt.exe new-tab` when available, else a new `pwsh`/`powershell` console; the env var is also set inside the command line so it holds regardless of which terminal process spawns the shell. The inner script travels as `-EncodedCommand` (base64 UTF-16LE), sidestepping cmd/wt quoting entirely — verified with paths containing spaces and apostrophes. Detection note: `wt.exe` is a zero-length app-execution-alias reparse point that `fs.stat`/`existsSync` report as missing; `lstat` is required. |
| Open Claude | Same, with `claude` executed after the env is set. |
| Open VS Code | `code` launched with the env var; the integrated terminal and the Claude Code extension inherit it. *Caveat:* if a VS Code instance is already running, new windows are created by the existing process and inherit *its* environment — documented in the UI and usage guide. |
| Set Default | Writes `CLAUDE_CONFIG_DIR` to `HKCU\Environment` (user scope) so every new shell uses that account; "Clear" removes it. |

Any number of accounts may be launched simultaneously (§1.3).

### 4.4 Usage dashboard

Per account card: status dot (🟢 normal · 🟡 warning/elevated usage · 🔴 limited or
logged out · ⚪ unknown), session %, weekly %, model-scoped ("Fable") %, reset
countdowns, extra-usage credits, last active, staleness stamp. Severity mirrors the
API's `severity` field, with thresholds as fallback.

### 4.5 Token refresh safety

Refresh only when the access token is expired/near expiry; the new credentials file is
written atomically (temp + rename) preserving unknown fields; a one-time `.bak` of the
pre-existing file is kept. On refresh failure the account shows "re-login needed" and the app
never retries in a loop.

### 4.6 Estimation fallback (offline / expired token)

When the usage API is unreachable, the card shows the last persisted snapshot with its
age, plus locally derived signals: sessions and estimated tokens in the current 5-hour
and 7-day windows from transcript JSONL (`message.usage` fields). Clearly labeled
"estimated" in the UI; never mixed silently with exact data.

---

## 5. Security model

- **No passwords** — login happens exclusively in the user's browser via Claude Code.
- **No secret storage by the app** — OAuth tokens live where Claude Code put them (inside
  each profile dir). the app's own store (`profiles.json`) holds names and paths only, so
  there is nothing requiring Windows Credential Manager; if the app ever needs a secret of
  its own, DPAPI/Credential Manager is the designated home.
- **Tokens never leave the main process** — not over IPC, not in exports, not in logs.
- **Renderer hardening** — `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`, strict CSP, no remote content; external links open via `shell.openExternal` allowlisted to `https:`.
- **Network** — exactly two HTTPS endpoints, both Anthropic's own
  (`api.anthropic.com/api/oauth/usage`, `platform.claude.com/v1/oauth/token`).
- **Export** contains profile metadata only — safe to share; importing it on another
  machine yields logged-out profiles awaiting `claude auth login`.
- **Isolation** — profiles are independent directories; the app never copies or merges
  credentials between them.

---

## 6. Repository layout

```
ai-account-manager/
├─ electron/            main-process TypeScript (bundled with esbuild)
│  ├─ main.ts           app bootstrap, window, wiring
│  ├─ preload.ts        contextBridge API
│  └─ lib/              profileStore · accountReader · usageService ·
│                       tokenRefresh · localStats · launcher · defaultEnv ·
│                       loginWatcher · ipc · paths
├─ shared/types.ts      IPC types shared by main & renderer
├─ src/                 React renderer (Vite)
│  ├─ App.tsx, components/, hooks/, styles/
├─ docs/                ARCHITECTURE.md · IMPLEMENTATION_PLAN.md · USAGE.md
├─ build/               packaging resources (icon)
├─ electron-builder.yml NSIS installer config
└─ README.md · BUILDING.md
```

Build pipeline: `esbuild` bundles `electron/` → `dist-electron/`; Vite builds `src/` →
`dist/`; electron-builder wraps both into an NSIS installer (x64, per-user install,
no admin required).
