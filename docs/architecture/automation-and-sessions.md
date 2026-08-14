# ADR: Automation host and isolated session launcher

- Status: Accepted, with live UIA actions safety-gated
- Date: 2026-08-14
- Release: 1.5.0

## Context

AI Account Manager is an Electron application whose formatted runtime JavaScript is the current source of record. Electron is suitable for settings, navigation, launch commands, tray lifecycle, and audit presentation, but it is not a good place to own Windows UI Automation (UIA), COM apartment state, or WinEvent hooks.

The feature must prefer vendor-supported unattended controls, remain safe for a standard Windows user, handle multiple provider windows without desktop-wide clicking, preserve the existing `%APPDATA%\ClaudeAccountManager` data root, and fail closed when a provider surface has not been observed.

Vendor behavior was rechecked against the current [Claude in Chrome permissions guide](https://support.claude.com/en/articles/12902446-claude-in-chrome-permissions-guide), [Claude Code CLI reference](https://code.claude.com/docs/en/cli-usage), and [Codex approvals and security documentation](https://learn.chatgpt.com/docs/agent-approvals-security). Account and local-computer boundaries were checked against Anthropic's [account login/switching](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account), [Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork), and [computer use](https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork) documentation.

## Decision

### Process boundary

The existing Electron renderer and main process own the product UI, schema migration, provider settings, lifecycle, session metadata, launch discovery, and redacted exports. A self-contained `net8.0-windows` helper owns UIA and Win32 event hooks.

The helper is one process per Windows user, enforced by a named mutex. Electron creates a random pipe name and 256-bit one-time secret, launches the helper directly, and connects through a `NamedPipeServerStream` restricted with `CurrentUserOnly`. The helper also verifies the named-pipe client PID against the Electron parent and requires protocol version 1 plus a constant-time secret match. There is no local TCP listener.

Electron monitors the helper and restarts it using bounded exponential backoff. The client retains the last sanitized configuration in memory and reapplies it immediately after the new helper authenticates; a failed restore is treated as a failed restart rather than silently falling back to Off. Shutdown unregisters events, WinEvent hooks, the global hotkey, and the helper process and clears that remembered configuration.

### Direct UIA APIs instead of FlaUI

We evaluated direct `UIAutomationClient`/`UIAutomationTypes` APIs against adding FlaUI. Direct Microsoft UIA was selected because this host needs a small API surface—bounded snapshots, window-open events, `InvokePattern`, and `SelectionItemPattern`—and direct APIs avoid a third-party runtime dependency in the self-contained/single-file helper. They also make trimming behavior predictable and keep immutable snapshot tests independent of live COM objects.

The cost is more explicit COM/threading and tree-walking code. That code is isolated in `UiaSnapshotCapture`, runs on a dedicated STA dispatcher, has bounded depth/node limits, and is exercised through immutable snapshot tests and a clearly labelled WPF harness. Publishing disables trimming because UIA/WPF and reflection-heavy framework code are not safe assumptions for aggressive trimming.

### Native controls first

Provider-native behavior is preferred:

- Claude's Manual choice can be selected only through an explicit user action while the trusted package exposes that menu. Automatically approve and Skip all approvals are visibly disabled because their live menu behavior and an expiring trusted-session policy are not validated.
- Claude Code command construction uses the installed CLI's per-launch `--permission-mode` option. Current installed help confirms `manual`, `auto`, and `bypassPermissions`, but 1.5.0 launches only Manual and refuses saved Auto/Skip intent.
- Codex command construction uses documented per-launch `--sandbox workspace-write`, `--ask-for-approval`, and `approvals_reviewer=auto_review` options. [Official OpenAI documentation](https://learn.chatgpt.com/docs/agent-approvals-security) confirms on-request, auto-review, and no-prompt combinations; 1.5.0 launches only on-request Manual and refuses saved Auto/Skip intent.

No vendor configuration file is modified, so config backup/version-drift/restore logic is intentionally not introduced. This removes an atomic-write failure mode; the Manual native-mode action is the reversible restore path for the visible Claude control.

The product does not claim high-impact unattended approval. Native Auto/Skip and production UIA remain locked until a policy can select one provider/profile, start off, warn visibly, expire, pause immediately, preserve absolute exclusions, and emit a minimal audit record. Forcing unvalidated provider settings to `dry-run` in both migration and UI prevents a stale pre-release setting from bypassing this decision.

### UIA recognition and action

WinEvent object-show/name-change and foreground events plus UIA window-open events feed a coalescing queue. A five-second default polling watchdog runs only while a process for a configured adapter with real selectors exists. Scans are rate-limited per root window, and trusted identity is checked before UIA work begins. The normal scan performs exact-name context queries plus a bounded semantic button query, applies revisioned exact/prefix labels in memory, then keeps only the nearest unambiguous prompt/action relationship sharing a nearby non-root ancestor. It does not allocate a snapshot of the full Chromium conversation history.

Recognition requires every strong signal:

1. Package family or canonical executable plus valid Authenticode publisher.
2. Standard integrity and the default input desktop.
3. Provider context in the same bounded surface.
4. Observed provider request text.
5. An enabled, on-screen semantic action in the same bounded card ancestor.

The stable dedupe fingerprint includes provider, PID, root HWND, card/button UIA runtime IDs, and sanitized label. Recognition enumerates up to eight distinct cards per provider window. The dedupe cache reconciles the complete active fingerprint set for that scope, so two simultaneous cards cannot replace one another or alternate into event spam. A matching fingerprint remains active until a later scan confirms that specific card has disappeared; it does not expire merely because a timer elapsed. Before invocation, the helper waits the configured delay, rechecks master/pause/Dry-run state, rejects a recycled window handle whose current PID differs, captures and recognizes the exact window again, and requires the original button runtime ID even if another card is also present. It performs at most one semantic action through `InvokePattern` or `SelectionItemPattern`, then records whether the exact card disappeared; no retry, mouse coordinates, screenshots, OCR, `SendInput`, broadcast key presses, or focus stealing are used.

All production selector entries currently have `liveEligible: false`. On 2026-08-13 a trusted Claude Desktop MSIX window exposed real Gmail-draft and Windows-MCP cards with `Deny`, `Always allow`, and `Allow once`. Selector revision `2026-08-v3` records only the one-shot `Allow once` action. Dry-run recognition, a continuous-card observation, disappearance/reappearance, UI pause/resume, emergency-hotkey pause, unrelated-window rejection, app restart, and forced helper restart with configuration restoration passed. Synthetic tests cover multiple cards in one window and separate fingerprints across windows. Production invocation remains gated on a card while paused, simultaneous live Claude windows/cards, tray pause, and one user-controlled harmless one-shot invocation. ChatGPT/Codex action strings remain empty rather than guessed; the installed trusted ChatGPT/Codex window exposed no actionable permission control during inspection.

UAC, secure desktop, elevated windows, Windows sign-in, credentials, SmartScreen, antivirus, password managers, purchases, financial actions, unknown processes, and arbitrary browser pages are outside the action boundary.

### Session isolation and authentication

Session profiles store only labels, provider/surface, start mode, generated launch metadata, colour/icon, last launch, and the app-managed profile directory. Browser profiles launch Chrome or Edge directly with an argument array containing a canonical `--user-data-dir` and `--app=https://…`; the user's normal browser profile is never used and no remote-debugging port is opened.

Per-profile lock files plus tracked child processes prevent concurrent incompatible launches. A stale lock is accepted only after its owning process is no longer alive. Browser data is retained when metadata is removed and requires a second explicit confirmation for deletion.

On 2026-08-14, two Claude and two ChatGPT Chrome app windows launched concurrently with four distinct temporary `--user-data-dir` values. Each created independent `Local State` and Cookies stores. All four reopened against the same directories with their per-profile markers intact, and a rename persisted. The temporary tree was moved to the Recycle Bin after the test. Because no real accounts were entered, login persistence, logging one account out without affecting another, and completion of a real OAuth flow remain explicitly account-access tests.

HTTPS login or magic links can be pasted into the selected isolated profile. They are validated and held only in memory behind a random 256-bit, one-use loopback redirect that expires after 30 seconds; the browser command line contains only that local capability URL. The relay accepts one exact-path GET, sends `Cache-Control: no-store` and `Referrer-Policy: no-referrer`, then closes. It is not helper IPC and carries no listener beyond the launch attempt. The real link is never persisted or audited. Native custom-protocol callbacks are not intercepted because current vendor behavior does not provide a supported way to route an ambiguous callback among arbitrary native instances. The reliable multi-account fallback is an isolated browser app profile.

Native desktop quick actions are labelled best effort because vendor single-instance behavior may focus an existing window. Claude account switching documented for an individual and Team/Enterprise account tied to the same email is not represented as arbitrary native account isolation. Likewise, cloud Cowork continuation is distinct from local files/browser/computer access, which requires the desktop connection.

### Audit and privacy

Settings, profile metadata, locks, and monthly JSONL audit files live beneath `%APPDATA%\ClaudeAccountManager\automation`. Records are bounded and redact emails, token-like strings, URL query/fragment data, paths, and long text. Prompt bodies, page contents, typed values, passwords, cookies, OAuth codes, access/refresh tokens, and magic links are not collected. Retention is configurable; Activity supports search, provider/result filtering, reviewed export, and clear. The Permissions summary receives only timestamp, provider/surface, requested action, method, result, Dry-run flag, and bounded error code; it omits labels, window text, and process text.

Diagnostics expose only trusted provider candidates and selector-matching accessible names by default. The renderer must pass the report it displayed back for export, and the main process redacts and bounds it again before writing.

## Performance evidence

The initial implementation scanned unrelated event sources and measured 2.50% average CPU with a +332 handle delta. Narrow event filtering, root-window coalescing, provider prefiltering, process disposal, and process-start-time-bound identity caching reduced a warm 30-second Dry-run measurement on the development laptop to 0.52% average CPU. The original 120-second packaged-helper soak measured 0.72% average CPU, 89 MB working set, 37 MB private bytes, 21 threads, 122 bounded scans, no matches/invocations/errors, and a +7 handle delta. After the v3 targeted multi-card changes, a final 120-second interval on 2026-08-14 (five-second warmup; trusted Claude plus unrelated ChatGPT/Chrome windows open; no permission card) measured 0.413% average CPU, 88.6 MiB working set, 38.8 MiB private memory, 22 threads, 282 accepted events, 157 bounded scans, no matches/invocations/errors, and a +5 handle delta. Card-present CPU remains part of the final user-controlled live-card gate. These are measured values, not guarantees across machines.

The final NSIS lifecycle was exercised against an installed 1.4.1 copy. Upgrade persisted the fail-closed v3 settings migration and installed byte-matching ASAR, helper, and selectors. Silent uninstall removed the executable and startup entries while leaving seven account-data files and 57 Electron-profile files byte-identical to their pre-uninstall checkpoints; the final 1.5.0 reinstall also left both trees unchanged. Local artifacts remain unsigned because no signing certificate was available.

## Rejected alternatives

- In-process Electron UIA: rejected because COM apartment/event-hook lifetime would be coupled to the UI process.
- MCP server: no remote or model-facing protocol is required.
- OCR, screenshots, coordinates, global keyboard/mouse input: insufficiently scoped and unsafe.
- A second browser extension or global remote-debugging port: intrusive and expands the attack surface.
- Token/cookie copying, URI-handler hijacking, binary injection, or protocol proxying: violates vendor and Windows security boundaries.
- Pretending repeated native-app launches create isolated accounts: vendor single-instance and callback behavior does not support that claim.

## Consequences

The app gains a diagnosable, independently restartable Windows boundary and can ship without requiring a machine-wide .NET runtime. Installer size increases because the helper is self-contained. Provider UI revisions can be updated in the versioned selector catalog without rewriting the event engine, but each actionable revision still needs a real, redacted live capture and Dry-run validation before `liveEligible` may be enabled.
