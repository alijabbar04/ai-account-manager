# Automation & Sessions guide

Automation & Sessions is a separate top-level area for permission monitoring, launch profiles, and redacted audit history. It is available on Windows 10/11 and runs as the current user; it does not install a Windows service or require administrator rights.

## Before enabling it

Unattended operation can allow an AI agent to act on files, browser pages, desktop apps, and connected services while you are away. Provider safeguards still apply, but unattended operation is not risk-free.

AI Account Manager never automates UAC or secure-desktop prompts, Windows sign-in, credentials, SmartScreen, antivirus, password managers, purchases, financial transactions, elevated windows, unknown processes, or arbitrary browser pages. It does not bypass protected vendor actions.

The feature starts **Off** and **Dry run**. The first enable action shows a risk acknowledgement and remains in Dry run. Turning the global Dry run switch off requires a separate confirmation, but it does not promote an unvalidated provider: in 1.7.0 every production adapter is still forced to detection-only.

## First use

1. Open **Automation & Sessions → Permissions**.
2. Turn on **Unattended permissions** and read/accept the first-use warning. The state should become **Dry run**.
3. Leave the relevant Claude/ChatGPT surface open and choose **Run diagnostics**. Review the redacted table; it should contain only trusted provider candidates and selector-matching accessible labels.
4. If a real permission card is available, leave it visible and use **Inspect under cursor**. Keep Dry run on for the first capture.
5. Leave each provider on **Detection only**. A selector revision can be promoted only after its complete live checklist passes.
6. Turning Dry run off changes the requested global mode, but 1.7.0 reports **Validation required** and continues to force every unverified provider to Dry run. It cannot make an unverified selector clickable.

The persistent badge reports Off, Monitoring, Dry run, Paused, Validation required, Needs attention, or Error. Monitoring is shown only when an actionable adapter has passed its production gate. A provider-native mode may still require explicit approval for protected actions; the app reports that boundary rather than bypassing it.

## Stop and background controls

- Pause for 5, 15, or 60 minutes from Permissions.
- Press **Ctrl+Shift+Alt+P** for the emergency stop. This immediately changes helper state and invocation is rechecked immediately before every action/retry.
- Use **Resume** in the app or tray menu after an emergency stop.
- **Keep monitoring after the window closes** changes Close into Hide-to-tray while automation is enabled.
- **Start with Windows** uses the current user's login entry and launches hidden with `--background`; it does not require elevation.

If the hotkey is already registered by another application, the state becomes **Needs attention** and live automation should not be relied upon until the conflict is resolved.

Advanced settings control the post-detection approval delay, slow polling watchdog (default 5 seconds), and audit retention. The helper remains event-driven; it does not rapidly scan the desktop.

## Permission modes and the high-impact boundary

| Method                    | Meaning                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Native Auto / auto-review | Command construction is verified, but product launch is locked in 1.7.0 pending an expiring trusted-session policy.        |
| Native Skip / no prompts  | Command construction is verified, but product launch is locked in 1.7.0. This is the highest-risk mode.                    |
| UIA fallback              | Recognize a trusted, bounded Windows accessibility card. Every current selector stays detection-only.                     |
| Dry run                   | Detect and audit only; never select native Auto/Skip and never invoke a UIA control.                                       |
| Disabled                  | Do not monitor that adapter.                                                                                               |

The Claude Desktop card exposes Auto and Skip as disabled so the missing boundary is visible rather than hidden. Manual remains available as a restore action when the trusted Claude menu exposes it. Claude Code and Codex Auto/Skip intent can be saved for forward compatibility, but launch is refused; edit the profile to Manual. No global provider configuration file is overwritten.

High-impact operations—sending external messages, purchases, account/security changes, destructive actions, or broad no-prompt modes—are unavailable. A future implementation must be off by default, select one provider or profile, show a visible warning, expire after a defined period, remain immediately pausable, respect every absolute exclusion, and write a privacy-safe audit event. The current UI states this boundary next to the last successful safe action and recent redacted activity.

## Add an isolated Claude or GPT account

For a reliably separate authorized account, use an isolated web profile:

1. Open **Automation & Sessions → Session launcher → Add profile**.
2. Enter a local label such as `My Claude`, `Colleague Claude`, or `GPT Work`. The optional account label is descriptive only.
3. Choose **Claude isolated web app** or **ChatGPT isolated web app** and save.
4. Click **Launch**. Chrome or Edge opens an app window with a new directory beneath `%APPDATA%\ClaudeAccountManager\automation\browser-profiles`.
5. Complete the vendor's login in that exact window. AI Account Manager never receives or stores the password, cookies, OAuth tokens, or login code; the browser keeps its own session in that profile.

To use a colleague's account, do this only with their authorization and let them complete the provider login in that profile. Do not share or copy cookies. The same steps work for multiple profiles; each receives a different canonical data directory and an exclusive process lock.

A 2026-08-14 live test launched two Claude and two ChatGPT app windows concurrently from four distinct temporary profile directories. After closing and reopening, all four retained their separate Chrome `Local State`, Cookies store, and per-profile marker; a rename also persisted. No real accounts or credentials were entered, so two-account login/logout separation remains an account-access test rather than a claimed result.

**New Claude** and **New GPT** open or focus the discovered packaged desktop app. Vendor single-instance behavior decides whether a new window appears; these shortcuts are not account isolation. Native desktop profile start modes are saved as intent, but no unverified deep link or `--user-data-dir` flag is sent to a desktop vendor app.

Claude Code profiles can link to an account already managed by AI Account Manager and use that existing `CLAUDE_CONFIG_DIR`. Codex launch profiles use the machine's current Codex sign-in; use an isolated ChatGPT web profile when a separate web account is required.

## Open a magic/login link in the correct profile

1. Find the intended Claude/ChatGPT isolated web card.
2. Click **Open login link**.
3. Paste the ordinary `https://` link and confirm.
4. The app validates that it has no embedded username/password and passes it through a tokenized, one-use loopback redirect that expires after 30 seconds. The real link stays out of the browser command line and is never added to metadata or the Activity log.

Code-based login should be completed in the originating profile window. Native custom-protocol callbacks can be ambiguous across instances; AI Account Manager does not hijack a vendor URI handler, proxy OAuth, decrypt tokens, or claim deterministic routing. Use the isolated web profile when correct routing cannot be proven.

## Cowork boundary

Claude's cloud Cowork work may continue remotely, but local files, browser, and computer-use capabilities require Claude Desktop to remain open and connected. A second web account's cloud session is not equivalent to a second local-computer bridge. AI Account Manager keeps those claims separate.

## Activity, diagnostics, and privacy

Permissions shows the last successful non-Dry-run action time plus the three most recent privacy-safe summaries. Activity can search and filter by provider and result, export redacted JSON, or clear the history. Records contain timestamp/duration, provider/surface, sanitized process/window identity, sanitized permission/tool label, requested action/method, Dry-run/live result, confidence signals, retry count, and bounded error code.

It does **not** retain prompt bodies, page contents, typed fields, passwords, emails, magic links, URL query/fragment values, cookies, OAuth codes, or access/refresh tokens. Monthly JSONL files live under `%APPDATA%\ClaudeAccountManager\automation` and expire according to the retention setting.

Diagnostic actions:

- **Run diagnostics** enumerates trusted candidate windows and redacted selector-matching elements.
- **Inspect under cursor** hides the app for three seconds, then captures a bounded/redacted subtree under the pointer.
- **Export reviewed copy** exports the exact report shown on screen, after the main process bounds and redacts it again.
- Helper developers can use `--diagnostics`, `--inspect`, `--dry-run`, `--approve-next`, and `--performance-soak <seconds>`. `--approve-next` still respects each selector's production `liveEligible` safety gate.

Selector strings and trust metadata are centralized in `automation/selectors/automation-selectors.v1.json`. Revision `2026-08-v3` includes the observed Claude Desktop Windows-MCP label and the stable `Claude wants to use …` prefix used by connector cards. Live Dry-run detection, persistent-card duplicate suppression, disappearance/reappearance, UI pause/resume, emergency pause, application restart, helper restart with settings restoration, and unrelated-window rejection have passed. Synthetic regressions cover two cards in one window, distinct windows, complete active-set reconciliation, and exact-button revalidation. A delayed action also rejects a recycled window handle whose current PID differs, and the action path permits only one semantic invocation with no retry. The selector remains detection-only until a card-while-paused test, simultaneous live Claude windows/cards, tray pause, and one user-controlled one-shot invocation pass. Do not set `liveEligible` until every live checklist item has passed.

## Capability matrix (1.7.0)

| Provider/surface                 | Capability                                                                | Status                  | Honest boundary                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Desktop / Cowork          | Trusted package discovery and native Manual restore                       | Partial live validation | Package/signer checks and real card detection passed. Native Auto/Skip lacks live menu and expiring-trust validation, so it is disabled.                            |
| Claude Desktop / Cowork          | Residual permission-card UIA                                              | Partial live validation | Real Gmail and Windows-MCP cards passed Dry run and persistent dedupe. Card-while-paused, simultaneous live windows/cards, tray pause, and one-shot invoke remain.  |
| Claude in Chrome                 | Extension discovery and bounded Dry-run diagnostics                       | Needs live test         | Installed Claude extension IDs were discovered, but no real side-panel permission card was captured. Arbitrary pages are never actionable.                         |
| Claude Code                      | Profile-scoped Manual permission launch                                   | Verified                | Installed `--permission-mode` choices and argument construction passed. Saved Auto/Skip intent is refused pending expiring trust; global settings are untouched.  |
| ChatGPT unified + legacy desktop | Package discovery and redacted diagnostics                                | Verified                | Both installed package families are recognized.                                                                                                                  |
| ChatGPT desktop Chat/Work/Codex  | Permission-card UIA                                                       | Needs live test         | The current trusted window exposed no actionable permission control. No labels were invented; selector arrays and invocation remain empty/off.                    |
| ChatGPT browser                  | Permission-card approval                                                  | Unsupported             | Browser profile, origin, tab/window, session, and genuine-card scoping cannot all be guaranteed.                                                                  |
| Codex CLI                        | Profile-scoped on-request launch                                          | Verified                | Current official docs and installed help confirm `workspace-write` plus `on-request`. Auto-review/no-prompt construction is tested but product launch is locked.   |
| Claude/ChatGPT web               | Persistent isolated Chrome/Edge app profile and HTTPS link routing        | Needs account test      | Four concurrent/reopened live windows passed distinct storage and persistence checks. Real two-account login/logout and OAuth completion still require account access. |
| High-impact approvals            | Expiring selected provider/profile trusted session                        | Unavailable             | No such production policy exists yet, so native Auto/Skip and live UIA are locked.                                                                                 |
| Native desktop apps              | Same-account quick open/focus                                             | Best effort             | Packaged app discovery is verified; vendor single-instance behavior controls whether a new window appears.                                                       |
| Claude native desktop            | Arbitrary isolated `--user-data-dir` and callback routing                 | Experimental            | Deliberately disabled because update, Cowork, and OAuth callback behavior are not proven. Use isolated web.                                                      |
| Native desktop apps              | Arbitrary multi-account OAuth callback routing                            | Unsupported by vendor   | No protocol hijack or token proxy is attempted.                                                                                                                   |
| Cowork                           | Cloud continuation versus local-computer bridge distinction               | Verified                | Current Anthropic guidance says local files, browser, and computer use still require the connected desktop app.                                                  |

“Verified” describes only the exact row, not every future vendor release. “Partial live validation” remains non-actionable. “Best effort” depends on vendor single-instance/UI behavior. “Needs account test” requires a user-controlled login without exposing credentials. “Experimental” is disabled. “Unavailable” and “Unsupported” have no unsafe fallback.

## Troubleshooting

- **Automation host is not built:** developers should run `npm run automation:publish`. Installed builds include the self-contained helper.
- **Needs attention / hotkey conflict:** close the app using the conflicting shortcut, then toggle automation off/on. Keep Dry run on until the badge clears.
- **No diagnostic elements:** open the provider window/card, confirm the provider is enabled, and retry. ChatGPT action labels are intentionally absent until a real capture is reviewed.
- **A managed profile says it is running:** close that isolated browser window. Stale lock files are discarded only when their owner process is no longer alive.
- **Login opened in the default browser:** use the profile card's **Open login link**, not the link in email/chat.
- **High idle resource use:** run `npm run automation:soak`, close unrelated provider windows, and attach the redacted JSON result to a bug report.

## Performance and uninstall

On the development laptop, the original warm 30-second Dry-run reached 0.52% average helper CPU, and the original 120-second packaged-helper soak measured 0.72% average CPU, about 89 MB working set, and 37 MB private bytes. After the v3 targeted multi-card changes, a final 120-second interval on 2026-08-14 (after five seconds of warmup, with trusted Claude and unrelated ChatGPT/Chrome windows open but no card) used 0.413% average CPU, 88.6 MiB working set, 38.8 MiB private memory, 22 threads, 282 accepted events, 157 bounded scans, no matches/invocations/errors, and +5 handles. This is close to the earlier 120-second memory result while improving CPU and handle growth. Card-present CPU still needs the final user-controlled permission-card run. Values vary by provider-window count, but no sustained scan storm or linear resource growth appeared.

The installer bundles a self-contained win-x64 helper, so end users do not need a separate .NET runtime. An installed 1.4.1 → 1.5.0 upgrade, silent uninstall, and final 1.5.0 reinstall were exercised on 2026-08-14. Upgrade persisted the fail-closed v3 settings migration. Uninstall removed the executable and startup entries while producing zero added, removed, or changed files across the seven-file account-data tree and 57-file Electron profile checkpoint; reinstall also left both checkpoints byte-identical. Uninstall stops the helper, removes the user startup entry, launcher metadata, and stale locks. It intentionally retains `%APPDATA%\ClaudeAccountManager\automation\browser-profiles` because those directories contain vendor-owned signed-in sessions. To delete one, use **Remove → also delete browser data** before uninstalling; that destructive choice has a separate confirmation. Other longstanding app/account data is retained for reinstall unless the user deletes it manually.
