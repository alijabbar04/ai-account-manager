# AI Account Manager

**A Windows desktop app for running several Claude Code accounts on one machine,
tracking GPT/Codex usage beside them, and monitoring your AI provider API keys.**

Claude Code keeps its entire session — OAuth tokens, settings, history — in one
configuration directory, and reads the `CLAUDE_CONFIG_DIR` environment variable
to decide which directory that is. One folder therefore equals one fully isolated
account. AI Account Manager turns that mechanism into a dashboard: each account
lives in its own folder, stays signed in independently, and launches into a
terminal or VS Code with the right environment already injected. Alongside it
sits a **GPT / Codex** panel that reads your ChatGPT plan usage from the locally
installed Codex CLI, a daily token history comparing the two, configurable
Windows quota alerts, and an API-key dashboard for Anthropic, OpenAI, Google
Gemini and OpenRouter.

> **Not affiliated with Anthropic or OpenAI.** This is an independent, in-house
> tool that drives the publicly documented `CLAUDE_CONFIG_DIR` mechanism, the
> local Codex CLI, and each provider's own public API. It is not a Claude or
> ChatGPT product and is not endorsed by any provider named here.

![Windows 10/11](https://img.shields.io/badge/Windows-10%20%7C%2011-blue) ![Electron](https://img.shields.io/badge/Electron-37-9feaf9) ![License: MIT](https://img.shields.io/badge/License-MIT-green)

---

## ⚠️ Read this before you change anything

> ### This repository's source of record is *formatted runtime JavaScript*, not TypeScript.

Versions 1.3.0 through 1.4.1 were produced by editing the app's built output
directly and repacking it — the original TypeScript/React project for those
releases no longer exists. What you see in `app/` is that runtime, recovered and
formatted: readable, tested and reproducible, but not the original sources.

Two consequences that will bite you if you miss them:

1. **Edit `app/dist-electron/main.cjs` and `app/dist/assets/*.js` directly.**
   There is no build step that regenerates them. Nothing compiles into `app/`.
2. **`npm test` is your safety net, and it is stricter than it looks.**
   `scripts/verify-runtime.cjs` asserts that specific IPC channels, Codex
   discovery paths, preload bridges and UI strings are still present. It also
   asserts the renderer bundle is at its exact filename
   (`index-CfQCNBzk.js`) — **do not rename the asset files.**

A future refactor can progressively move named runtime sections back into
standalone TypeScript modules without changing packaged behaviour. Until then,
treat `app/` as source.

---

## Quick start for users

You need Windows 10 or 11. No GitHub account is required — the Releases page is
public.

1. **Download** `AI-Account-Manager-Setup-<version>.exe` from the
   [Releases](../../releases) page.
2. **Install.** Per-user, no admin rights. Windows will warn that the publisher
   is unrecognised because the build is unsigned — **More info** → **Run anyway**.
3. **Prerequisite:** [Claude Code](https://claude.com/claude-code) on your PATH
   (`claude --version`). The Codex CLI is optional — without it the GPT/Codex
   panel simply reports it cannot find Codex.
4. **Import the account you already have:** *Add account → Import existing* →
   point it at `C:\Users\<you>\.claude`.
5. **Add another:** *Add account → Create new* → a terminal opens running
   `claude auth login` → sign in in the browser. The card turns green by itself.
6. **Work:** click **Open Claude** on whichever account you want to be. They run
   side by side.

Full walkthrough: [docs/INSTALL.md](docs/INSTALL.md).

---

## What's in 1.4.1

- **GPT/Codex vs Claude daily token history**, with 7, 30 and 90-day views.
- **Reliable Windows Codex discovery** across Codex Desktop, npm, VS Code and
  WindowsApps installations.
- **Configurable Windows alerts** for quota thresholds, reset reminders and
  expiring Claude sign-ins.
- **Permission-aware API-key setup** that detects the key type and verifies
  provider analytics access *before* saving — so a key that cannot report spend
  tells you at the point of entry rather than showing an empty dashboard later.
- **Full-width Claude and GPT dashboard cards**; the redundant "View all other
  accounts" button was removed.
- **HTTPS update-channel checks** with SHA-256 manifest validation.
- **Automated runtime checks, unit tests, Windows packaging**, release-manifest
  generation, and an optional signed GitHub Actions build.

---

## Setup for developers

```powershell
git clone https://github.com/alijabbar04/ai-account-manager.git
cd ai-account-manager
.\setup.ps1
```

`setup.ps1` checks your Node version, installs dependencies, and runs the test
suite so you know the checkout is sound before you touch anything.

Run from source:

```powershell
npm run build:dir     # package to release\win-unpacked, then launch it
```

Build the installer:

```powershell
.\build\build.ps1     # output: release\AI-Account-Manager-Setup-1.4.1.exe
```

| Command | What it does |
|---|---|
| `npm test` | Unit tests **and** runtime verification — run this before every commit |
| `npm run verify` | Runtime verification only |
| `npm run build:dir` | Unpacked build into `release\win-unpacked` |
| `npm run build:win` | NSIS installer |
| `npm run release:manifest` | Generate `release/latest.json` for the update channel |
| `npm run format` | Prettier across `app`, `scripts`, `tests`, `.github` |

Node 22 is what the CI workflow uses. The workflow uses pnpm; the npm scripts
work equally well locally.

### Layout

| Path | What lives there |
|---|---|
| `app/dist-electron/main.cjs` | Electron main process — accounts, launcher, usage, Codex discovery, alerts, updates |
| `app/dist-electron/preload.cjs` | The context-bridge surface exposed to the renderer |
| `app/dist/assets/` | React renderer runtime and styles |
| `assets/USAGE_TRACKING_GUIDE.pdf` | The in-app 📖 guide, shipped as an unpacked extra resource |
| `scripts/` | Runtime verification and release-manifest tooling |
| `tests/` | Regression tests for alerts, update manifests and required runtime surfaces |
| `build/icon.ico` | Application icon |
| `.github/workflows/release.yml` | Windows build / sign / release workflow |

---

## Security notes

**No secrets live in this repository.** Everything sensitive is created locally
and stays on the machine that runs the app.

- **No passwords, ever.** Sign-in is Claude Code's own browser OAuth flow.
- **OAuth tokens stay where Claude Code put them** — inside each profile folder.
  The app's own store holds account names and folder paths only.
- **API keys are encrypted at rest** with Windows DPAPI via Electron
  `safeStorage`. If OS encryption is unavailable the app **refuses to store the
  key** rather than writing plaintext.
- **Keys and tokens never reach the UI.** Secrets go from the main process to
  that provider's own API and nowhere else. They are masked on screen and never
  logged; exports contain metadata only.
- **Update manifests must be HTTPS and carry a published SHA-256** before the app
  will offer an update.
- **Code-signing certificates are never committed.** `electron-builder` reads
  `CSC_LINK` / `CSC_KEY_PASSWORD` from the environment; the CI workflow reads
  them from encrypted repository secrets.
- **All local state lives outside this repo**, in `%APPDATA%\ClaudeAccountManager`
  (see the note below).

### Why the data folder is still named ClaudeAccountManager (do not rename it)

> **The app is branded AI Account Manager. Its data directory is not, and that
> is intentional.** All accounts, settings, usage history, and the
> DPAPI-encrypted API key vault live in:
>
> ```
> %APPDATA%\ClaudeAccountManager
> ```
>
> This is the app's pre-rename identity, kept as-is so every existing install
> upgrades in place with zero user action. **If this string is ever changed in
> `appDataDir()` (`app/dist-electron/main.cjs`) without a migration, every
> existing install will silently look freshly installed** — no accounts, no
> settings, no API keys. Nothing is actually deleted, but nothing loads either.

If a rename is ever genuinely needed, it requires two things, not one:

1. **Copy the app data folder itself** — `%APPDATA%\ClaudeAccountManager` →
   the new name.
2. **Copy the separate Electron `Local State` file**, which holds the
   `safeStorage` master key, from Electron's own userData folder
   (`%APPDATA%\<old productName>\Local State`) to
   `%APPDATA%\<new productName>\Local State`. Skipping this step is the
   subtle failure: the app data folder copies perfectly, the app looks like it
   migrated, and then **every API key reports "Stored key could not be
   decrypted"** because the vault's ciphertext was sealed with a master key
   that no longer exists anywhere.

Full detail and recovery steps: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## Making changes

1. **Branch.** `git checkout -b fix-codex-discovery`.
2. **Edit the runtime directly** — `app/dist-electron/main.cjs` for main-process
   behaviour, `app/dist/assets/index-*.js` for UI. Remember nothing compiles into
   `app/`.
3. **`npm test`.** Both the unit tests and the runtime verification must pass.
   If verification fails it is usually telling you that you removed a string or
   channel something else depends on.
4. **`npm run format`** to keep the runtime consistently formatted — this is what
   makes hand-editing bundles tolerable.
5. **Build and install once** with `.\build\build.ps1`. A packaged build can fail
   on things a dev run never exercises, particularly the bundled PDF guide.
6. **Open a pull request** describing what changed and what you tested.

### Two things that will catch you out

- **Kill any running copy before building.** The app takes a single-instance
  lock; a second instance quits immediately.
- **Never point `CLAUDE_CONFIG_DIR` at the default `~\.claude` folder.** With the
  variable unset Claude Code reads `.claude.json` from the home directory; set it
  explicitly to that folder and Claude Code looks *inside* it instead and forks
  fresh state. The app already handles this.

---

## Update channel

Host the installer over HTTPS, then generate the manifest:

```powershell
$env:UPDATE_DOWNLOAD_URL='https://downloads.example.com/AI-Account-Manager-Setup-1.4.1.exe'
npm run release:manifest -- 'release/AI-Account-Manager-Setup-1.4.1.exe'
```

Host `release/latest.json` over HTTPS and paste that URL into
**Dashboard → Updates**. The app validates the manifest shape and requires both
an HTTPS download and a published SHA-256 checksum before offering an update.

## Documentation

| Document | For |
|---|---|
| [docs/INSTALL.md](docs/INSTALL.md) | Installing from scratch, assuming no technical background |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | When something fails: what it means and how to fix it |
| [assets/USAGE_TRACKING_GUIDE.pdf](assets/USAGE_TRACKING_GUIDE.pdf) | Why API usage pages can look empty — also the in-app 📖 guide |

## License

MIT — see [LICENSE](LICENSE).
