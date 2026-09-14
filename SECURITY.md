# Security policy

AI Account Manager holds the keys to several AI provider accounts on a personal
machine. That makes its security properties the product, not a footnote.

## Reporting a vulnerability

Report privately through GitHub's
[private vulnerability reporting](https://github.com/alijabbar04/ai-account-manager/security/advisories/new).
Please do not open a public issue for anything exploitable.

Include what you did, what you observed, and the app version. A proof of concept
helps. **Do not include a real API key, OAuth token or cookie** — describe the
credential by provider and type instead.

This is a small in-house project, not a funded product. Expect a first response
within about a week, and no bug bounty.

If you believe you have exposed one of your own credentials while testing,
rotate it with that provider first; nothing in this repository can revoke it for
you.

## Supported versions

The most recent release is the supported one. Fixes land on `main` and ship in
the next tagged release.

## What the app does with secrets

| Secret | Where it lives | Who can read it |
|---|---|---|
| Claude Code OAuth tokens | Inside each account's own `CLAUDE_CONFIG_DIR` profile folder, written by Claude Code itself | Claude Code. The app reads expiry metadata to warn you about expiring sign-ins; it stores no copy |
| Provider API keys (Anthropic, OpenAI, Google Gemini, OpenRouter) | `%APPDATA%\ClaudeAccountManager\api-keys-vault.json`, encrypted with Windows DPAPI via Electron `safeStorage` | The signed-in Windows user, on that machine only |
| API key metadata (label, provider, key type, last four characters) | `%APPDATA%\ClaudeAccountManager\api-keys.json`, plaintext by design | Anyone with access to the Windows account |
| Browser session cookies for isolated Chrome/Edge profiles | The browser's own profile directory under `%APPDATA%\ClaudeAccountManager\automation\browser-profiles` | The browser |
| Code-signing certificate | Never in this repository. `electron-builder` reads `CSC_LINK` / `CSC_KEY_PASSWORD` from the environment | The release machine or CI |

Design rules the code holds to:

- **The app has no credential of its own.** There is no service to sign in to,
  no account to create, and no key baked into the build.
- **It never asks for a password.** Claude sign-in is Claude Code's own browser
  OAuth flow; provider sign-in happens in a real browser window.
- **Keys do not cross IPC.** Secrets stay in the main process and travel only to
  that provider's own API. The renderer is sandboxed, context-isolated, and its
  CSP sets `connect-src 'none'`.
- **Plaintext storage is refused, not silently accepted.** If
  `safeStorage.isEncryptionAvailable()` is false the app declines to store the
  key.
- **Logs, exports and diagnostics are redacted.** Automation audit records drop
  emails, token-like strings, URL query and fragment data, paths and long text.
  Analytics exports carry metadata only.
- **Updates are verified.** An update manifest must be HTTPS and carry a
  SHA-256 that matches the downloaded installer before the app will offer it.
- **No telemetry.** Nothing is sent anywhere except to the provider API a key
  belongs to, and to the update URL you configure.

## Where your data is

Everything is local:

```
%APPDATA%\ClaudeAccountManager     accounts, settings, usage history, key vault
%APPDATA%\AI Account Manager       Electron's own profile, incl. the DPAPI master key
```

The data directory is deliberately *not* named after the product. See
[README](README.md#why-the-data-folder-is-still-named-claudeaccountmanager-do-not-rename-it).

Nothing in either directory belongs in a bug report or a pull request.

## Known risks

- **The installer is unsigned by default.** Windows SmartScreen will warn.
  Verify the download against the `SHA256SUMS.txt` published with each release.
  To sign your own builds, set `CSC_LINK` and `CSC_KEY_PASSWORD`, or add the
  repository secrets `WINDOWS_CERTIFICATE_BASE64` and
  `WINDOWS_CERTIFICATE_PASSWORD` for the release workflow. No certificate is
  supplied here.
- **Electron 37 is outside its upstream support window.** The Electron project
  supports the latest three majors. `npm audit` therefore reports advisories
  against the bundled runtime. The app's exposure is limited — the renderer is
  sandboxed and context-isolated, loads only local files, and cannot make
  network requests — but moving to a supported Electron is the single highest
  value security change available, and it needs a full packaged-install
  regression run because the source of record is hand-edited runtime JS.
- **Automation drives real UI.** It is off by default, starts in Dry run,
  requires an explicit risk acknowledgement, refuses secure, elevated and
  unobserved surfaces, and has an emergency hotkey. It is still the most
  privileged thing in the app; read
  [docs/AUTOMATION_AND_SESSIONS.md](docs/AUTOMATION_AND_SESSIONS.md) before
  enabling it.
- **API key metadata is plaintext.** Labels and the last four characters of a
  key are readable by anything running as your Windows user. The key itself is
  not.

## Secret scanning

Every push and pull request runs Gitleaks over the working tree and the full
history, plus CodeQL for JavaScript and C#. See
[.github/workflows/security.yml](.github/workflows/security.yml).
