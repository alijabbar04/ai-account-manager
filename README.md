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

Versions 1.3.0 through 1.7.1 were produced by editing the app's built output
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
3. **Install what it drives.** Claude Code is required; the Codex CLI and VS Code
   are optional. One step, no admin rights, skips anything you already have:

   ```powershell
   irm https://raw.githubusercontent.com/alijabbar04/ai-account-manager/main/scripts/install-prerequisites.ps1 | iex
   ```

   It shows you what is missing and which vendor packages it would install, and
   waits for a yes.
4. **Import the account you already have:** *+ Add account → Import existing* →
   point it at `C:\Users\<you>\.claude`.
5. **Add another:** *+ Add account → Create new* → a terminal opens running
   `claude auth login` → sign in in the browser. The card turns green by itself.
6. **Work:** **Open in VS Code** on an account card starts a session as that
   account, and the dashboard launchers — **New Claude Cowork**, **New Codex
   chat**, **New VS Code Codex** — open the installed apps. Accounts run side by
   side.

Full walkthrough: [docs/INSTALL.md](docs/INSTALL.md).

---

## What's in 1.7.0

- **Global launchers** on the dashboard — New Claude Cowork, New Codex chat,
  New VS Code Codex, Open in VS Code — validated against a fixed allowlist and
  spawned as argument arrays, never through a shell string.
- **Profile visibility**: hide accounts you are not using and bring them back
  from **Manage profile visibility**, with an Undo.
- **Other Accounts layout** as grid or full width, remembered across restarts.
- **Usage that survives a bad refresh** — a failed poll no longer wipes the
  limits already on screen, and retries back off from 30 seconds to an hour.
- **The rename is data-safe.** Electron keeps the DPAPI master key for the API
  key vault in a directory derived from the product name, so renaming the app
  would have made every stored key undecryptable. The key is now carried across
  once at startup; `npm run verify:safestorage` proves it end to end.

Retained from 1.5.0:

- A dedicated **Automation & Sessions** area with Permissions, Session launcher,
  and searchable/exportable redacted Activity views.
- A self-contained, standard-user Windows UI Automation helper with a
  current-user-only authenticated pipe, trusted package/signer validation,
  bounded event-driven recognition, Dry run, pause, and emergency hotkey.
- Persistent isolated Chrome/Edge app profiles for authorised Claude and
  ChatGPT accounts, with per-profile locks and correct-profile HTTPS login-link
  routing that never stores credentials or links.
- Provider-native, profile-scoped Claude Code and Codex permission modes;
  unobserved desktop UIA selectors remain action-blocked pending live tests.
- Tray/background monitoring, current-user startup, explicit browser-data
  cleanup, native helper packaging, Windows CI, and a documented capability
  matrix and architecture decision.

Retained from 1.4.1:

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
npm start
```

`setup.ps1` is idempotent and safe to re-run. It checks Node 20+ and a .NET 8+
SDK, installs dependencies from the lockfile with `npm ci`, repairs the Electron
binary if a proxy silently blocked its download, and runs the JavaScript and
native helper suites so you know the checkout is sound before you touch
anything. It never asks for or writes a credential.

End users do not need .NET or Node at all — release builds bundle a
self-contained helper. See [docs/INSTALL.md](docs/INSTALL.md).

Build the installer:

```powershell
.\build\build.ps1     # output: release\AI-Account-Manager-Setup-1.7.1.exe
```

| Command | What it does |
|---|---|
| `npm start` | Run the app from source |
| `npm test` | Unit tests **and** runtime verification — run this before every commit |
| `npm run verify` | Runtime verification only |
| `npm run verify:safestorage` | Prove a product rename cannot orphan the API key vault |
| `npm run automation:test` | Native recognition, trust, IPC, audit and settings tests |
| `npm run automation:publish` | Self-contained win-x64 helper used by packaging |
| `npm run automation:soak` | Measure helper CPU, working set, handles, threads and events |
| `npm run build:dir` | Unpacked build into `release\win-unpacked` |
| `npm run build:win` | NSIS installer |
| `npm run release:manifest` | Generate `release/latest.json` for the update channel |
| `npm run format` | Prettier across `app`, `scripts`, `tests`, `.github` |
| `npm run format:check` | The formatting check CI runs |

CI runs Node 22 on `windows-latest` and installs with `npm ci`, so
`package-lock.json` is committed and must stay in step with `package.json`.

Before opening a pull request, read [CONTRIBUTING.md](CONTRIBUTING.md) — this
repository has one genuinely unusual property, described there and below.

### Layout

| Path | What lives there |
|---|---|
| `app/dist-electron/main.cjs` | Electron main process — accounts, launcher, usage, Codex discovery, alerts, updates |
| `app/dist-electron/preload.cjs` | The context-bridge surface exposed to the renderer |
| `app/dist-electron/automation-*.cjs` | Automation settings, redaction, helper client and session launcher |
| `app/dist-electron/launcher-domain.cjs` | Allowlisted launcher targets and project-path validation |
| `app/dist-electron/usage-reliability-domain.cjs` | Retry backoff and snapshot merging for usage polls |
| `app/dist-electron/safe-storage-continuity.cjs` | Carries the DPAPI master key across a product rename |
| `app/dist/assets/` | React renderer runtime and styles |
| `automation/` | .NET 8 Windows UIA helper, selector catalog, tests and synthetic harness |
| `assets/USAGE_TRACKING_GUIDE.pdf` | The in-app 📖 guide, shipped as an unpacked extra resource |
| `scripts/` | Runtime verification and release-manifest tooling |
| `tests/` | Regression tests for alerts, update manifests and required runtime surfaces |
| `build/icon.ico` | Application icon |
| `build/installer.nsh` | NSIS uninstall hooks — stops the helper, clears startup entries |
| `.github/workflows/ci.yml` | Format, test and package on every push and pull request |
| `.github/workflows/security.yml` | Gitleaks secret scan, dependency audit, CodeQL |
| `.github/workflows/release.yml` | Tagged build, sign, checksum and GitHub Release |

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
- **The rename cannot orphan your keys.** Electron keeps the `safeStorage`
  master key in a directory derived from the product name. The app carries that
  key across once at startup — copying, never moving, and never overwriting a
  live one — so an upgrade from a Claude-Account-Manager-branded install keeps
  its vault readable. `npm run verify:safestorage` proves it against real DPAPI.
- **Automation is fail-closed.** It starts Off and Dry run, requires a risk
  acknowledgement, never drives secure/elevated/unknown surfaces, and keeps
  unverified provider selectors detection-only. Version 1.5.0 also refuses
  native/CLI Auto and Skip until an expiring selected provider/profile trust
  policy exists; the UI reports **Validation required** instead of implying a
  live adapter.
- **Isolated web sessions belong to their browser profile.** The app stores
  profile labels and generated paths, never passwords/cookies/tokens, and does
  not open a remote-debugging port.

First use, safety boundaries, exact profile/login-link steps, emergency stop,
diagnostics, uninstall behavior, measured performance, and the provider matrix
are in [docs/AUTOMATION_AND_SESSIONS.md](docs/AUTOMATION_AND_SESSIONS.md).

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

The full loop — per-area test requirements, what must not change casually, and
what never belongs in a commit — is in [CONTRIBUTING.md](CONTRIBUTING.md). The
short version:

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

## Releasing

Versions are semantic, and `package.json` is the single source of truth — the
app, the installer, the artifact name and the update manifest all read from it.

1. Bump `version` in `package.json` **and** `app/package.json`, and add a
   `CHANGELOG.md` entry.
2. `npm test`, then `.\build\build.ps1`, then install the result once. A
   packaged build fails on things a dev run never exercises.
3. Commit, then tag: `git tag v1.7.1 && git push origin main --tags`.

The tag starts [`release.yml`](.github/workflows/release.yml), which refuses to
build if the tag and `package.json` disagree, runs the full suite, packages the
installer, writes `SHA256SUMS.txt`, generates `latest.json` pointing at the
release asset, and publishes a GitHub Release with all three attached.

**Code signing is optional and nothing is bundled here.** Without a certificate
the installer is unsigned and SmartScreen warns; users can verify the download
against `SHA256SUMS.txt`. To sign, add two repository secrets:
`WINDOWS_CERTIFICATE_BASE64` (base64 of a `.pfx`) and
`WINDOWS_CERTIFICATE_PASSWORD`. `electron-builder` picks them up as `CSC_LINK`
and `CSC_KEY_PASSWORD` automatically.

### Self-hosted update channel

If you host installers yourself rather than on GitHub Releases:

```powershell
npm run release:manifest -- 'release/AI-Account-Manager-Setup-1.7.1.exe' 'https://downloads.example.com/AI-Account-Manager-Setup-1.7.1.exe'
```

Host `release/latest.json` over HTTPS and paste that URL into
**Dashboard → Updates**. The app validates the manifest shape and requires both
an HTTPS download and a published SHA-256 checksum before offering an update.

## Documentation

| Document | For |
|---|---|
| [docs/INSTALL.md](docs/INSTALL.md) | Installing from scratch, assuming no technical background |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | When something fails: what it means and how to fix it |
| [docs/AUTOMATION_AND_SESSIONS.md](docs/AUTOMATION_AND_SESSIONS.md) | Permission safety, session profiles, diagnostics, capability matrix and uninstall behavior |
| [docs/architecture/automation-and-sessions.md](docs/architecture/automation-and-sessions.md) | Native helper, UIA, trust, IPC and authentication-routing ADR |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setting up, the edit/test loop, and what must not change casually |
| [SECURITY.md](SECURITY.md) | Where every secret lives, reporting a vulnerability, known risks |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each version |
| [assets/USAGE_TRACKING_GUIDE.pdf](assets/USAGE_TRACKING_GUIDE.pdf) | Why API usage pages can look empty — also the in-app 📖 guide |

## License

MIT — see [LICENSE](LICENSE).
