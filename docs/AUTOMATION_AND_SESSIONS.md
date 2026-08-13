# Automation & Sessions guide

Automation & Sessions is a separate top-level area for permission monitoring, launch profiles, and redacted audit history. It is available on Windows 10/11 and runs as the current user; it does not install a Windows service or require administrator rights.

## Before enabling it

Unattended operation can allow an AI agent to act on files, browser pages, desktop apps, and connected services while you are away. Provider safeguards still apply, but unattended operation is not risk-free.

AI Account Manager never automates UAC or secure-desktop prompts, Windows sign-in, credentials, SmartScreen, antivirus, password managers, purchases, financial transactions, elevated windows, unknown processes, or arbitrary browser pages. It does not bypass protected vendor actions.

The feature starts **Off** and **Dry run**. The first enable action shows a risk acknowledgement and remains in Dry run. Turning Dry run off requires a separate confirmation.

## First use

1. Open **Automation & Sessions → Permissions**.
2. Turn on **Unattended permissions** and read/accept the first-use warning. The state should become **Dry run**.
3. Leave the relevant Claude/ChatGPT surface open and choose **Run diagnostics**. Review the redacted table; it should contain only trusted provider candidates and selector-matching accessible labels.
4. If a real permission card is available, leave it visible and use **Inspect under cursor**. Keep Dry run on for the first capture.
5. Choose provider methods. Native provider/CLI modes are preferred; UIA is a residual fallback only for a selector revision that has passed a live test.
6. Turn Dry run off only after the displayed detections are correctly scoped. In 1.5.0 all production UIA selectors remain live-blocked pending reviewed samples, so this does not make an unverified selector clickable.

The persistent badge reports Off, Monitoring, Dry run, Paused, Needs attention, or Error. A provider-native mode may still require explicit approval for protected actions; the app reports that boundary rather than bypassing it.

## Stop and background controls

- Pause for 5, 15, or 60 minutes from Permissions.
- Press **Ctrl+Shift+Alt+P** for the emergency stop. This immediately changes helper state and invocation is rechecked immediately before every action/retry.
- Use **Resume** in the app or tray menu after an emergency stop.
- **Keep monitoring after the window closes** changes Close into Hide-to-tray while automation is enabled.
- **Start with Windows** uses the current user's login entry and launches hidden with `--background`; it does not require elevation.

If the hotkey is already registered by another application, the state becomes **Needs attention** and live automation should not be relied upon until the conflict is resolved.

Advanced settings control the post-detection approval delay, slow polling watchdog (default 5 seconds), and audit retention. The helper remains event-driven; it does not rapidly scan the desktop.

## Permission modes

| Method                    | Meaning                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Native Auto / auto-review | Use the provider or CLI's supported automatic-review mode for that explicit surface/profile.                                |
| Native Skip / no prompts  | Use the supported no-prompt mode for that explicit launch. This is the highest-risk choice.                                 |
| UIA fallback              | Detect a trusted, bounded Windows accessibility card and use its semantic action. Unverified revisions stay detection-only. |
| Dry run                   | Detect and audit only; never select native Auto/Skip and never invoke a UIA control.                                        |
| Disabled                  | Do not monitor that adapter.                                                                                                |

The Claude Desktop card offers explicit Auto, Skip, and Manual actions only when the corresponding trusted menu item is visible. Auto/Skip is unavailable while the master toggle is off or Dry run is on. Manual remains available as the one-click restore path. Claude Code and Codex modes are passed on that launch only; global configuration files are not overwritten.

## Add an isolated Claude or GPT account

For a reliably separate authorized account, use an isolated web profile:

1. Open **Automation & Sessions → Session launcher → Add profile**.
2. Enter a local label such as `My Claude`, `Colleague Claude`, or `GPT Work`. The optional account label is descriptive only.
3. Choose **Claude isolated web app** or **ChatGPT isolated web app** and save.
4. Click **Launch**. Chrome or Edge opens an app window with a new directory beneath `%APPDATA%\ClaudeAccountManager\automation\browser-profiles`.
5. Complete the vendor's login in that exact window. AI Account Manager never receives or stores the password, cookies, OAuth tokens, or login code; the browser keeps its own session in that profile.

To use a colleague's account, do this only with their authorization and let them complete the provider login in that profile. Do not share or copy cookies. The same steps work for multiple profiles; each receives a different canonical data directory and an exclusive process lock.

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

Activity can search and filter by provider and result, export redacted JSON, or clear the history. Records contain timestamp/duration, provider/surface, sanitized process/window identity, sanitized permission/tool label, requested action/method, Dry-run/live result, confidence signals, retry count, and bounded error code.

It does **not** retain prompt bodies, page contents, typed fields, passwords, emails, magic links, URL query/fragment values, cookies, OAuth codes, or access/refresh tokens. Monthly JSONL files live under `%APPDATA%\ClaudeAccountManager\automation` and expire according to the retention setting.

Diagnostic actions:

- **Run diagnostics** enumerates trusted candidate windows and redacted selector-matching elements.
- **Inspect under cursor** hides the app for three seconds, then captures a bounded/redacted subtree under the pointer.
- **Export reviewed copy** exports the exact report shown on screen, after the main process bounds and redacts it again.
- Helper developers can use `--diagnostics`, `--inspect`, `--dry-run`, `--approve-next`, and `--performance-soak <seconds>`. `--approve-next` still respects each selector's production `liveEligible` safety gate.

Selector strings and trust metadata are centralized in `automation/selectors/automation-selectors.v1.json`. Do not set `liveEligible` until a real card has passed identity, context, relationship, disappearance, duplicate-window, pause, and Dry-run checks.

## Capability matrix (1.5.0)

| Provider/surface                 | Capability                                                                     | Status                | Honest boundary                                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Desktop / Cowork          | Discover trusted MSIX windows and explicit native Auto/Skip/Manual menu action | Needs live test       | Installed package identity is verified; the current menu structure still needs a visible live sample.                                                       |
| Claude Desktop / Cowork          | Residual permission-card UIA                                                   | Needs live test       | Recognition/dedupe/action pipeline is implemented, but production invocation is safety-gated off.                                                           |
| Claude in Chrome                 | Extension discovery and bounded Dry-run diagnostics                            | Best effort           | Google-signed Chrome plus Claude context is required; arbitrary pages are never actionable. Exact side-panel structure needs a live sample.                 |
| Claude Code                      | Per-launch Manual/Auto/Skip permission mode                                    | Verified              | Installed CLI help and automated argument tests passed; no global settings rewrite.                                                                         |
| ChatGPT unified + legacy desktop | Package discovery and redacted diagnostics                                     | Verified              | Both installed package families are recognized.                                                                                                             |
| ChatGPT desktop Chat/Work/Codex  | Permission-card UIA                                                            | Needs live test       | No action labels were invented; selector arrays and live invocation remain empty/off.                                                                       |
| ChatGPT browser                  | Permission-card approval                                                       | Unsupported           | An exact trusted permission surface has not been established safely.                                                                                        |
| Codex CLI                        | Per-launch on-request, auto-review, or no-prompt policy                        | Verified              | Installed CLI help and automated argument tests passed; workspace-write sandbox remains selected.                                                           |
| Claude/ChatGPT web               | Persistent isolated Chrome/Edge app profile, lock, and HTTPS link routing      | Best effort           | Command construction, canonical paths, lock/recovery, and secret-free process arguments are automated-tested; a real two-account login remains a live test. |
| Native desktop apps              | Same-account quick open/focus                                                  | Best effort           | Packaged app discovery is verified; vendor single-instance behavior controls the resulting window.                                                          |
| Claude native desktop            | Arbitrary isolated `--user-data-dir` and callback routing                      | Experimental          | Deliberately disabled because update, Cowork, and OAuth callback behavior are not proven. Use isolated web.                                                 |
| Native desktop apps              | Arbitrary multi-account OAuth callback routing                                 | Unsupported by vendor | No protocol hijack/token proxy is attempted.                                                                                                                |
| Cowork                           | Cloud continuation versus local-computer bridge distinction                    | Verified              | Local files/browser/computer still require the connected desktop app.                                                                                       |

“Verified” describes the exact row, not every future vendor release. “Best effort” uses supported discovery but depends on vendor single-instance/UI behavior. “Experimental” is disabled by default and not represented as reliable. “Needs live test” stays non-actionable. “Unsupported” has no unsafe fallback.

## Troubleshooting

- **Automation host is not built:** developers should run `npm run automation:publish`. Installed builds include the self-contained helper.
- **Needs attention / hotkey conflict:** close the app using the conflicting shortcut, then toggle automation off/on. Keep Dry run on until the badge clears.
- **No diagnostic elements:** open the provider window/card, confirm the provider is enabled, and retry. ChatGPT action labels are intentionally absent until a real capture is reviewed.
- **A managed profile says it is running:** close that isolated browser window. Stale lock files are discarded only when their owner process is no longer alive.
- **Login opened in the default browser:** use the profile card's **Open login link**, not the link in email/chat.
- **High idle resource use:** run `npm run automation:soak`, close unrelated provider windows, and attach the redacted JSON result to a bug report.

## Performance and uninstall

On the development laptop, a warm 30-second Dry-run reached 0.52% average helper CPU. The final 120-second packaged-helper soak with provider apps open measured 0.72% average CPU, about 89 MB working set, 37 MB private bytes, 21 threads, 122 bounded scans, no matches/invocations/errors, and +7 handles. Values vary by provider window count; the result is slightly above the aspirational 0.5% CPU target but below roughly 100 MB, with no sustained scan storm or linear resource growth.

The installer bundles a self-contained win-x64 helper, so end users do not need a separate .NET runtime. Uninstall stops the helper, removes the user startup entry, launcher metadata, and stale locks. It intentionally retains `%APPDATA%\ClaudeAccountManager\automation\browser-profiles` because those directories contain vendor-owned signed-in sessions. To delete one, use **Remove → also delete browser data** before uninstalling; that destructive choice has a separate confirmation. Other longstanding app/account data is retained for reinstall unless the user deletes it manually.
