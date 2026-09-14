# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

Releases before 1.4.1 predate this repository; entries for them are summaries,
not full histories.

## [1.7.1] — unreleased

### Fixed

- **Signing in no longer depends on `claude` being on `PATH`.** *Add account →
  Create new* opened a terminal running a bare `claude auth login`. When the
  shell could not resolve `claude`, the user was left looking at a raw
  PowerShell `CommandNotFoundException` in a window the app had just opened —
  nothing about what was wrong or what to do.

  This is easier to hit than it looks. The native installer puts `claude.exe` in
  `%USERPROFILE%\.local\bin` and adds that to the user `PATH`, but a process
  that was already running keeps its old environment, and every terminal the app
  opens inherits the app's. So "install Claude Code, then sign in without
  restarting the app" was a broken path.

  `app/dist-electron/claude-cli-domain.cjs` now resolves the CLI to an absolute
  path — `CLAUDE_CLI_PATH`, then `PATH`, then the native, npm-global, bun,
  Store and Program Files locations — exactly as the app already did for Codex
  and VS Code. Every call site uses it: the login terminal, permission-mode
  launches, the session launcher and the version probe. When it genuinely cannot
  be found, the app says so in the UI and does not open a doomed terminal.

  A stale `CLAUDE_CLI_PATH` is ignored rather than trusted, so it cannot mask a
  working install.

## [1.7.0] — unreleased

### Added

- **Global launchers** on the dashboard: New Claude Cowork, New Codex chat,
  New VS Code Codex, and Open in VS Code. Targets are validated against a fixed
  allowlist and spawned as argument arrays with `shell: false`, never through a
  shell string.
- **Profile visibility.** Hide accounts you are not using from the dashboard and
  bring them back from **Manage profile visibility**, with an Undo.
- **Other Accounts layout control** — grid or full width — persisted across
  restarts.
- **Empty-state guidance** for the Work and Personal Claude dashboard slots, so
  a fresh install points you at adding an account instead of showing blanks.
- **Usage reliability handling** (`usage-reliability-domain.cjs`): a failed
  usage refresh no longer discards the limits already on screen, and retries
  back off between 30 seconds and an hour.
- **`npm start`** to run the app from source without packaging it first.
- **`npm run verify:safestorage`**, an end-to-end check that a product rename
  does not orphan the encrypted API key vault.

### Changed

- **The product is now "AI Account Manager"** everywhere it names itself:
  window title, installer, Start Menu and desktop shortcuts, tray menu,
  notifications, sidebar, and release artifacts
  (`AI-Account-Manager-Setup-<version>.exe`). The application id is
  `io.github.ai-account-manager`.

  Provider wording is unchanged and deliberately so: Claude, Claude Code,
  Anthropic, the Claude usage API and Claude account references all still say
  Claude, because they refer to the provider rather than to this app.
- `package-lock.json` is now committed, and CI installs with `npm ci`, so a
  clean checkout resolves exactly the same dependency tree.
- `setup.ps1` installs from the lockfile and finishes by printing the command
  that starts the app.
- `tests/vscode-launch-smoke.ps1` discovers VS Code instead of hard-coding one
  machine's install path.
- `setup.ps1` repairs a half-unpacked Electron install. On Node 24 the
  postinstall stops after the first entry in the archive and exits 0, leaving
  `node_modules\electron\dist` containing only `locales\`. Setup now extracts
  the already-cached zip itself, and says which of the two failure modes it saw
  instead of always blaming a proxy.

### Fixed

- **The rename no longer risks the API key vault.** Electron derives its
  `userData` directory from the product name, and on Windows that directory
  holds the DPAPI master key protecting `api-keys-vault.json`. Renaming the app
  would have left every stored key reporting "Stored key could not be
  decrypted". `app/dist-electron/safe-storage-continuity.cjs` adopts the key
  from the previous product name once, before `app.whenReady()`; it copies
  rather than moves, never overwrites a live key, and is safe to run repeatedly.

### Security

- Gitleaks secret scanning over the working tree and full history, plus CodeQL
  for JavaScript and C#, on every push and pull request and weekly.
- Dependabot for npm, NuGet and GitHub Actions.
- The release workflow publishes `SHA256SUMS.txt` alongside each installer and
  points the update manifest at the release asset, so the in-app updater
  verifies what it downloads.

### Note for upgraders

Your data is untouched. Accounts, settings, usage history and the encrypted key
vault stay in `%APPDATA%\ClaudeAccountManager` — that directory is deliberately
not renamed. See
[README](README.md#why-the-data-folder-is-still-named-claudeaccountmanager-do-not-rename-it).

## [1.5.0] — 2026-08-14 (built, never tagged)

### Added

- **Automation & Sessions**: Permissions, a session launcher, and a searchable,
  exportable, redacted Activity view.
- A self-contained, standard-user Windows UI Automation helper with a
  current-user-only authenticated pipe, trusted package and signer validation,
  bounded event-driven recognition, Dry run, pause, and an emergency hotkey.
- Persistent isolated Chrome/Edge app profiles for authorised Claude and ChatGPT
  accounts, with per-profile locks and correct-profile HTTPS login-link routing
  that stores neither credentials nor links.
- Provider-native, profile-scoped Claude Code and Codex permission modes.
  Unobserved desktop UIA selectors remain action-blocked pending live tests and
  report **Validation required** rather than implying a live adapter.
- Tray and background monitoring, current-user startup, explicit browser-data
  cleanup, native helper packaging, Windows CI, and a documented capability
  matrix and architecture decision record.

## [1.4.1] — 2026-08-08

First release published from this repository.

### Added

- GPT/Codex versus Claude daily token history, with 7, 30 and 90-day views.
- Reliable Windows Codex discovery across Codex Desktop, npm, VS Code and
  WindowsApps installations.
- Configurable Windows alerts for quota thresholds, reset reminders and expiring
  Claude sign-ins.
- Permission-aware API key setup that detects the key type and verifies provider
  analytics access *before* saving, so a key that cannot report spend says so at
  the point of entry.
- HTTPS update-channel checks with SHA-256 manifest validation.
- Automated runtime checks, unit tests, Windows packaging, release-manifest
  generation and an optional signed GitHub Actions build.

### Changed

- Full-width Claude and GPT dashboard cards; the redundant "View all other
  accounts" button was removed.
- The product was renamed from **Claude Account Manager** to **AI Account
  Manager**. The `%APPDATA%\ClaudeAccountManager` data root was intentionally
  kept so existing installs upgrade in place.

## Earlier

- **1.2.0** — Skills Sync: keeps a curated skill set identical across every
  Claude Code profile.
- **1.1.0** — API Key Analytics for Anthropic, OpenAI, Google Gemini and
  OpenRouter, with keys encrypted at rest via Windows DPAPI.
- **1.0.0** — Multiple Claude Code accounts on one machine, each in its own
  `CLAUDE_CONFIG_DIR` profile, launching into a terminal or VS Code.

[1.7.1]: https://github.com/alijabbar04/ai-account-manager/compare/v1.4.1...main
[1.4.1]: https://github.com/alijabbar04/ai-account-manager/releases/tag/v1.4.1
