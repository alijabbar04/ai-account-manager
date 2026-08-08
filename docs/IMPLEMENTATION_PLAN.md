# AI Account Manager — Implementation Plan

Phased plan used to build the MVP. Each phase ends in a verifiable state.

## Phase 0 — Discovery (done first, drives everything)
- [x] Inspect `%USERPROFILE%\.claude` layout and `.credentials.json` / `.claude.json` schemas.
- [x] Verify `CLAUDE_CONFIG_DIR` isolates *all* state (including `.claude.json`).
- [x] Confirm concurrent sessions are supported.
- [x] Locate and live-test the usage API (`api/oauth/usage`) and token refresh endpoint.
- [x] Confirm `claude auth login` / `claude auth status --json` for per-profile auth.
- [x] Toolchain audit → Electron justified (no Rust on machine; proven Electron pipeline).

## Phase 1 — Skeleton
- Scaffold package.json, tsconfigs, Vite config, esbuild script.
- Electron main: create hardened BrowserWindow, load renderer, single-instance lock.
- Preload: typed `window.cam` bridge; `shared/types.ts` as the IPC contract.
- Verify: window opens with hot-built renderer.

## Phase 2 — Profile core
- ProfileStore (profiles.json CRUD, import/export, validation, atomic writes).
- AccountReader (identity from `.claude.json` + credential presence/expiry — no tokens out).
- LocalStats (last active, session counts from projects/*.jsonl stats).
- IPC: profiles:*, state:get, state:changed push.
- Verify: register real `~/.claude` as a profile; identity renders in UI.

## Phase 3 — Usage
- tokenRefresh (platform.claude.com/v1/oauth/token, atomic credential write, .bak once).
- UsageService (fetch, normalize, in-memory + on-disk snapshot cache, 5-min poll,
  focus-triggered refresh, per-profile error states).
- Estimation fallback from transcripts when API unreachable.
- Verify: live percentages match `/usage` in Claude Code for the same account.

## Phase 4 — Launch & switching
- Launcher: wt.exe detection, PowerShell/Claude/VS Code/login-terminal launches,
  env injection + ELECTRON_* stripping, paths-with-spaces quoting.
- DefaultEnv: get/set/clear HKCU CLAUDE_CONFIG_DIR + WM_SETTINGCHANGE broadcast.
- LoginWatcher: poll credentials file after login launch; push state on arrival.
- Verify: each button spawns the right thing with the right env (checked via
  `$env:CLAUDE_CONFIG_DIR` in the spawned shell).

## Phase 5 — UI polish
- Dashboard: account cards (status dot, usage meters, resets, credits, last active),
  search, add/import wizards, rename/remove dialogs, export.
- Dark + light themes (system-aware default, manual toggle, persisted).
- Empty states, loading, error banners, staleness stamps.

## Phase 6 — Package & docs
- electron-builder NSIS (x64, per-user). Icon.
- Smoke-test installed build.
- README, BUILDING.md, docs/USAGE.md.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Credential write during refresh corrupts a login | Atomic temp+rename, preserve unknown JSON fields, one-time `.bak`, refresh only when expired |
| VS Code single-instance ignores env | Documented caveat in UI + guide; terminal launches are authoritative |
| Usage endpoint shape drifts | Normalizer tolerates missing/renamed fields; falls back to `five_hour`/`seven_day` blocks, then to estimation |
| wt.exe quoting edge cases | Env also set inside the command line; direct console fallback |
| Hidden/locked credential files on Windows | Write-temp-then-rename instead of in-place writes |
