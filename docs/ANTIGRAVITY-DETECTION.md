# Antigravity detection: v1.7.8

Updated 2026-10-12. No credentials, account addresses, or token values are recorded.

## Native discovery

Opus's live observation under Ali's session is authoritative: six Antigravity processes share %LOCALAPPDATA%\Programs\antigravity\Antigravity.exe. The main window PID owns two dynamic loopback listeners (50335 and 50337 in that launch). No separate Windows language_server child was observed. agy.exe processes started days earlier and belong to VS Code extensions.

The runtime uses Get-Process names, executable paths and MainWindowTitle, then netstat -ano -p tcp. It never calls CIM, Get-NetTCPConnection or Toolhelp. Only Antigravity processes with the exact expected executable path, compared case-insensitively, qualify. Only their LISTENING 127.0.0.1 or ::1 ports are probed. Wildcard binds, remote interfaces and established connections are excluded. A matching running process can prove installation when stat is denied.

agy.exe is unconditionally excluded, including hypothetical native ancestry. Shared Gemini paths, command-line hints, branding and extension authentication cannot supply the native card. The bundled resources\bin\language_server.exe is accepted only at the exact path inside the verified native installation; unrelated language servers remain excluded. This is the working v1.7.7 usage path observed by Opus. The sections below preserve the earlier endpoint investigation as historical evidence.

## Authentication evidence from the installed app

The installed resources/app.asar was readable through Node and inspected without extraction or modifications outside this repo. package.json identifies Antigravity 2.22.0. Source locations below refer to that archive:

- dist/main.js generates the language-server CSRF token with crypto.randomUUID() each launch, then passes it to startAndMonitorLanguageServer. dist/languageServer.js passes --csrf_token to the server. The app uses HTTPS loopback (dist/constants.js). Existing account RPCs use Connect JSON at /exa.language_server_pb.LanguageServerService/{method} with x-codeium-csrf-token. When a native-owned account page exposes window.__APP_CONFIG__, the runtime reads its csrfToken in memory and verifies HasAuthToken before selecting that port. Tokens never cross the renderer IPC boundary or enter logs.
- dist/hostBridgeServer.js creates a DIFFERENT per-launch token with crypto.randomBytes(32), accepts Authorization: Bearer, enforces loopback/Host checks, and returns its token to the main process. It exposes GetUpdateStatus and ApplyUpdate, not account RPCs. No persisted bearer-token file was found in the inspected source; this token is unavailable from the readable installation files. It must not be reused or guessed for account detection.
- dist/main.js also enables an ephemeral remote-debugging-port. Its source supports WSL language-server launches. Therefore two native-PID listeners do not prove that either is an account RPC endpoint. The live listeners may be bridge/debugger ports; that mapping and any WSL forwarding require live verification. We did not use debugging APIs to extract credentials.

The earlier extension hubs expose __APP_CONFIG__ and accept the existing account RPCs. That is protocol evidence only; none qualifies for the native card. If neither native-owned listener serves the account page/config, account detection remains unavailable. The in-memory host-bridge token cannot fix that because its API has no account methods.

## Stability

Each status request revalidates PID/path/port ownership. The last port that answered HasAuthToken is tried first if ownership still matches. A branded page without a working account RPC cannot displace a working port. Discovery failure does not erase the preferred port; a cached port transferred to an extension is never probed.

A verified signed-in result survives transient discovery, authentication and metadata failures for three minutes. Retained results keep their original updatedAt and report stale=true plus a user-facing message. Failures never renew this grace period. A new successful refresh replaces the result; explicit native sign-out clears it immediately. Concurrent status calls share one in-flight operation.

## Validation

Antigravity tests: 22/22 passed, including fake six-process Get-Process/netstat discovery, both native listeners, loopback filtering, agy/foreign/missing-path isolation, preferred-port refresh, PID/port reuse, changed launch ports, success/failure/missing-process/recovery/expiry, partial metadata failures, explicit sign-out, and concurrent requests.

npm run test:runtime: 131/132 passed. Only the pre-existing lockfile metadata omissions/dependency drift test failed (its fixture expects an older root version). scripts/verify-runtime.cjs passed separately. Git safe.directory and PowerShell execution policy were configured only in the test process environment.

The exact requested npx electron-builder --win nsis --publish never encountered a blocked Electron download. The fallback uses --config.electronDist=node_modules/electron/dist, the existing matching Electron 37.10.3, with no dependency changes.

## Opus live checks

Identify each current native PID-owned port using harmless GET responses; determine whether it serves the account app/config, host bridge, or debugger. Do not print tokens. Check account email/plan after Refresh with VS Code extensions signed into a different account, app restart with new ports, transient failure under three minutes, expiry after three minutes, and explicit sign-out. If both listeners are only host bridge/debugger, report the account endpoint as inaccessible under this policy; do not claim live detection is resolved.

Installer rebuilt successfully with the local-Electron fallback: release/AI-Account-Manager-Setup-1.7.7.exe (142801644 bytes). scripts/verify-packaged.cjs and scripts/verify-installer-payload.cjs both passed, including exact runtime/UI bytes and Windows executable identity/version. No installation, commit or push was performed.

## Background Antigravity: v1.7.8

The default-on Settings switch, "Run Antigravity quietly in the background for usage", starts the executable returned by existing install discovery only when a path-verified native process is absent. If process identity discovery is denied, launch fails closed. OFF preserves manual-launch detection. No npm dependencies were added.

The testable controller is app/dist-electron/antigravity-background.cjs. Its Windows layer starts app/dist-electron/antigravity-background.ps1 with execFile/windowsHide and a private standard-input/output JSON channel, with no listening port. The script is unpacked beside app.asar because PowerShell cannot read a -File inside an archive. Standard Windows PowerShell Add-Type compiles the small Win32 adapter without a .NET SDK.

The helper launches the exact executable with SW_HIDE through ProcessStartInfo.WindowStyle, then enumerates every top-level window for the owned Antigravity and bundled language-server processes. ShowWindow(SW_HIDE) removes them from the taskbar. The helper repeats hiding every 100 ms for 60 seconds, follows children through Toolhelp parent PIDs, and applies Idle (BelowNormal fallback) plus EcoQoS for three minutes. PID and creation-time identities must match before every operation; a kernel process handle is pinned before validation so termination cannot reopen a reused numeric PID. agy.exe and unrelated/pre-existing processes never enter ownership. Failure in hiding or scheduling switches to visible but minimised; unsupported APIs cannot crash Account Manager.

EcoQoS uses ProcessPowerThrottling (information class 4), version 1, and PROCESS_POWER_THROTTLING_EXECUTION_SPEED (mask 1), as described by [Microsoft's QoS documentation](https://learn.microsoft.com/en-us/windows/win32/procthread/quality-of-service). [ShowWindow's return value](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showwindow) describes previous visibility, so it is not treated as a success flag.

Open Antigravity/Sign in first restore and hand over the owned copy instead of spawning another. External launches at the same native path and foreground activation accompanied by recent keyboard/mouse input also restore windows and release ownership. Priority and execution throttling are restored for foreground use, including children that inherited the parent's background settings. External activation is necessarily inferred from Windows process/window/input observations; the shortcut-reuse checks below need live confirmation.

Normal quit and switching OFF send WM_CLOSE to owned top-level windows, wait five seconds, then force-close only still-live owned identities. The PowerShell helper also watches Account Manager's PID and creation time plus stdin EOF. Thus forced termination by the existing NSIS updater/uninstaller triggers the same cleanup independently, with no blanket Antigravity taskkill. The NSIS template stops Account Manager by executable/path, without a process-tree kill; the guardian survives it. A handover removes all ownership before quit, so the user's copy survives.

Usage still comes only from antigravity-runtime.cjs and its existing path/port-verified RPC. The card polls every two seconds for its first minute, then once a minute; startup shows "Starting Antigravity in the background…". Existing last-good results survive transient RPC failures for three minutes, with an explicit stale message; explicit sign-out still clears them. IPC exceptions also preserve the renderer's last good result. No tokens enter the background helper, renderer response or logs.

### Exact live verification for Opus

1. Install release/AI-Account-Manager-Setup-1.7.8.exe. Start with native Antigravity closed and VS Code's agy.exe running. Open Account Manager with the setting ON. Check that only the native install exe is launched, that no window/taskbar entry appears during the full first 60 seconds (including Electron re-shows), that the startup message appears, and that usage becomes visible promptly once the existing language-server RPC answers.
2. Record only PIDs/creation times and paths, not command lines or credentials. In Task Manager, inspect Idle/BelowNormal and Efficiency mode for every owned Antigravity process and the resources/bin/language_server.exe child. Check newly appearing children during the first three minutes. Confirm agy.exe and unrelated language servers retain their prior scheduling.
3. Click the card's Open Antigravity (also Sign in when signed out). Confirm the existing windows are restored, no second native copy is launched, scheduling returns to foreground defaults, and that copy survives quitting Account Manager.
4. Repeat with the native desktop/Start-menu shortcut while the background copy runs: during the first few seconds, around 30 seconds, and after 60 seconds. Confirm single-instance reuse, window restoration, no immediate re-hide, released priority/EcoQoS, and survival on Account Manager quit. This verifies the foreground/recent-input and short-lived second-process handover heuristics.
5. Start native Antigravity yourself BEFORE Account Manager. Confirm its window, priority and Efficiency mode are untouched and that it survives quit, setting changes, update and uninstall. Repeat with an extension signed into a different account; the card must retain the native account.
6. With an owned background copy, turn the setting OFF: graceful close first, any remaining owned processes gone about five seconds later, user/extension processes preserved. Restart Account Manager with OFF and verify there is no launch. Turn ON again and verify a fresh background copy starts.
7. Repeat cleanup through normal Quit, force-stopping Account Manager, an upgrade, and uninstall while the background copy runs. Check the guardian and all owned app/server PIDs disappear after the five-second grace period. Then repeat after handover: the user's Antigravity must survive. If testing the installer while CIM is denied, verify the existing NSIS running-app check actually closes Account Manager before expecting the watchdog to run.
8. Check transient RPC failure/recovery: last good quota/plan remains with the stale message for the existing three-minute grace period; expiry and explicit sign-out behave as before. On a machine where hiding/EcoQoS is denied or unavailable, confirm visible-but-minimised fallback and no Account Manager crash.

### Build and sandbox validation

43/43 Antigravity tests passed with fake process, window, launch and stdio layers. The full npm run test:runtime suite passed 152/153; only the known lockfile fixture-version failure remained. Runtime verification and formatting passed separately. Windows PowerShell 5.1 parsed the script and compiled the P/Invoke C# without invoking live native actions.

The exact requested npx electron-builder --win nsis --publish never hit a blocked Electron download. The build uses --config.electronDist=node_modules/electron/dist with the existing matching Electron 37.10.3. Live app/window, installation, update and uninstall checks were not run in the sandbox. No commit or push was performed.

Installer completed successfully: release/AI-Account-Manager-Setup-1.7.8.exe (142809090 bytes). scripts/verify-packaged.cjs and scripts/verify-installer-payload.cjs passed; the unpacked PowerShell helper was also compared byte-for-byte with its source.
