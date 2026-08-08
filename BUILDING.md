# Building AI Account Manager

## Prerequisites

| Requirement | Notes |
|---|---|
| Windows 10 or 11 (x64) | Primary target platform |
| Node.js ≥ 20 (tested on 24) | https://nodejs.org |
| npm ≥ 10 | ships with Node |
| Claude Code CLI | only needed at *runtime*, not to build |

No Visual Studio, Python, or native toolchain is required — there are no native
Node modules.

## Setup

```powershell
git clone <repo-url> ai-account-manager
cd ai-account-manager
npm install
```

> If `node_modules\electron\dist\electron.exe` is missing after install (the
> postinstall download can be skipped on some networks), run:
> `node node_modules\electron\install.js`

## Build & run (development)

```powershell
npm run start
```

This runs the two build steps and launches Electron:

- `npm run build:main` — esbuild bundles `electron/main.ts` + `electron/preload.ts`
  → `dist-electron/*.cjs` (CommonJS, `electron` external).
- `npm run build:renderer` — Vite builds the React app → `dist/`.

Iterate by re-running `npm run start`; the full build takes ~1–2 s.

> **Tip:** if you script the launch yourself, make sure `ELECTRON_RUN_AS_NODE` is not
> set in your environment (some tools set it), or `electron .` will start as plain
> Node and exit.

## Checks

```powershell
npm run typecheck                # strict TS, all three contexts
node scripts/make-icon.mjs       # regenerate build/icon.ico (deterministic)
node scripts/test-launcher.mjs   # launcher env/quoting mechanism tests
node scripts/verify.mjs          # E2E: drives the real app via Playwright,
                                 # screenshots into scripts/shots/
```

`verify.mjs` expects at least one profile registered (it will exercise import/remove
flows itself) and a signed-in default `~\.claude` for the live-usage assertions.

## Installer

```powershell
npm run dist
```

Produces `release/AIAccountManager-Setup-<version>.exe` — an NSIS, per-user
(no-admin) installer with desktop + start-menu shortcuts. On first run
electron-builder downloads its NSIS tooling; subsequent builds are fast.

The build is unsigned by default. To code-sign, configure electron-builder's standard
`win.certificateFile`/`WIN_CSC_LINK` options in `electron-builder.yml` or the
environment.

## Project layout

```
electron/          main process (TypeScript, bundled by esbuild)
  main.ts          window bootstrap, hardening
  preload.ts       contextBridge → window.cam
  lib/             profileStore · accountReader · usageService · tokenRefresh ·
                   localStats · launcher · defaultEnv · loginWatcher · ipc · paths
shared/types.ts    the typed IPC contract (single source of truth)
src/               React renderer (Vite): App, components, styles
scripts/           build-main.mjs · make-icon.mjs · test-launcher.mjs · verify.mjs
docs/              ARCHITECTURE.md · IMPLEMENTATION_PLAN.md · USAGE.md
build/             icon.ico (generated)
electron-builder.yml
```
