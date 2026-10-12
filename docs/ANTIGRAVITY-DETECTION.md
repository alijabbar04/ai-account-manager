# Antigravity detection: v1.7.7

Updated 2026-10-12. No credentials, account addresses, or token values are recorded.

## Native discovery

Opus's live observation under Ali's session is authoritative: six Antigravity processes share %LOCALAPPDATA%\Programs\antigravity\Antigravity.exe. The main window PID owns two dynamic loopback listeners (50335 and 50337 in that launch). No separate Windows language_server child was observed. agy.exe processes started days earlier and belong to VS Code extensions.

The runtime uses Get-Process names, executable paths and MainWindowTitle, then netstat -ano -p tcp. It never calls CIM, Get-NetTCPConnection or Toolhelp. Only Antigravity processes with the exact expected executable path, compared case-insensitively, qualify. Only their LISTENING 127.0.0.1 or ::1 ports are probed. Wildcard binds, remote interfaces and established connections are excluded. A matching running process can prove installation when stat is denied.

agy.exe is unconditionally excluded, including hypothetical native ancestry. Shared Gemini paths, command-line hints, branding and extension authentication cannot supply the native card. Standalone language_server processes are also excluded under this PID-owned-port policy.

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
