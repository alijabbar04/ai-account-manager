# Troubleshooting

Grouped by when the problem happens. Each entry gives the message you actually
see, what is really going on, and the fix. Every message quoted here is taken
from the shipped runtime.

---

## The app will not start

### Nothing happens when I launch it

Most likely the **single-instance lock**. Only one copy runs at a time, so a
second launch exits immediately and looks like a crash.

Check Task Manager for an existing **AI Account Manager** process (or `electron`
if running from source) and close it, or use the window already open. This is
also the top cause of a failed build — `build\build.ps1` closes stray instances
for you first.

If there is genuinely nothing running: check your antivirus quarantine (unsigned
installers are a common false positive), then reinstall from Releases.

### Windows says "Windows protected your PC"

Expected — the build is unsigned unless `CSC_LINK` was set at build time.
**More info** → **Run anyway**.

### PowerShell refuses to run `setup.ps1` or `build.ps1`

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Once, in the same window. Affects only that window.

### Running from source, the app exits without a window

`ELECTRON_RUN_AS_NODE` is set in your environment — with it set, Electron starts
as plain Node and exits silently. Some tools set it, and it is inherited by every
new shell. Clear it in the **same** command:

```powershell
$env:ELECTRON_RUN_AS_NODE = $null; npm run build:dir
```

### `node_modules\electron\dist\electron.exe` is missing

Electron's ~130 MB postinstall step failed. There are two distinct causes and
they need different fixes, so check which one you have:

```powershell
Get-ChildItem node_modules\electron\dist
```

**If `dist\` is missing or empty, the download was blocked** — usually a proxy.

```powershell
node node_modules\electron\install.js
```

If that still fails, set `HTTPS_PROXY` and re-run.

**If `dist\` contains only `locales\`, the download worked and the *unpacking*
silently did nothing.** On Node 24 the postinstall stops after the first entry
in the archive and exits successfully, which makes it look like it worked. The
verified zip is already cached, so finish the job yourself:

```powershell
$version = (Get-Content node_modules\electron\package.json -Raw | ConvertFrom-Json).version
$zip = Get-ChildItem "$env:LOCALAPPDATA\electron\Cache" -Recurse -Filter "electron-v$version-win32-x64.zip" | Select-Object -First 1
Remove-Item node_modules\electron\dist -Recurse -Force
Expand-Archive -LiteralPath $zip.FullName -DestinationPath node_modules\electron\dist
Set-Content node_modules\electron\path.txt "electron.exe" -NoNewline
```

`setup.ps1` does all of the above automatically, including the extraction
fallback — re-running it is the quickest fix for either cause.

---

## Account sign-in problems

### The login terminal says `The term 'claude' is not recognized`

```
claude : The term 'claude' is not recognized as the name of a cmdlet,
function, script file, or operable program.
```

The app opened a terminal to run `claude auth login` and the shell could not
find the Claude Code CLI. Since 1.7.1 the app resolves `claude.exe` to an
absolute path itself and refuses to open the terminal at all if it cannot,
telling you so in the UI — so if you are seeing the raw shell error above, you
are on an older build.

**The quickest way to find out which cause you have** is to run the diagnosis
script on the affected machine. It is read-only, needs no admin rights, and
prints the exact fix:

```powershell
irm https://raw.githubusercontent.com/alijabbar04/ai-account-manager/main/scripts/diagnose-claude-cli.ps1 | iex
```

It reports the installed app version, whether that version can resolve the CLI
by itself, where `claude.exe` actually is, and the health of your PATH.

The rest of this section is what it checks, by hand.

First, is it installed?

```powershell
Test-Path "$env:USERPROFILE\.local\bin\claude.exe"
```

**If `False`** — install Claude Code from <https://claude.com/claude-code>, then
reopen the app.

**If `True`, it is installed and PATH is the problem.** The usual cause is that
the app is running with an environment from before Claude Code was installed:
the installer adds `%USERPROFILE%\.local\bin` to your user PATH, but already
running processes keep the environment they started with, and every terminal the
app opens inherits the app's. Check what your PATH really contains:

```powershell
($env:PATH -split ';') -contains "$env:USERPROFILE\.local\bin"
(Get-ItemProperty HKCU:\Environment -Name Path).Path -split ';' |
    Where-Object { $_ -like '*\.local\bin' }
```

If the registry line prints it and the first line says `False`, the app just
needs restarting — quit it fully (check the tray) and launch it again. Signing
out and back in fixes it for everything at once.

If your PATH is genuinely missing the folder, or the CLI lives somewhere
unusual, point the app straight at it:

```powershell
[Environment]::SetEnvironmentVariable(
    "CLAUDE_CLI_PATH", "$env:USERPROFILE\.local\bin\claude.exe", "User")
```

Then restart the app. `CLAUDE_CLI_PATH` takes priority over PATH, and is ignored
if it points at a file that no longer exists, so a stale value cannot mask a
working install.

> **A very long PATH is worth checking too.** Windows builds a process
> environment from the machine and user PATH combined; if yours has grown to
> thousands of characters — build tooling that appends an entry per run is the
> usual culprit — entries can stop resolving. `(Get-ItemProperty
> HKCU:\Environment -Name Path).Path.Length` tells you how big yours is; a few
> hundred characters is normal, ten thousand is not.

---

## The app opens but has no accounts or API keys

### My accounts have disappeared / it looks like a completely fresh install

**Nothing was deleted.** This almost always means the app is looking at the
wrong data directory, not that your data is gone.

All accounts, settings and API keys live in one folder, and it is **not** named
after the current app name:

```
%APPDATA%\ClaudeAccountManager
```

That is deliberate — see
[README.md § Why the data folder is still named ClaudeAccountManager](../README.md#why-the-data-folder-is-still-named-claudeaccountmanager-do-not-rename-it).
It was **not renamed** when the app was rebranded from Claude Account Manager to
AI Account Manager, precisely so upgrades keep working with zero user action.
If accounts have vanished, check:

1. **Does `%APPDATA%\ClaudeAccountManager` still exist?** Open a terminal:
   `Test-Path "$env:APPDATA\ClaudeAccountManager"`. If `False`, the folder was
   moved, renamed, or deleted outside the app — restore it from a backup.
2. **Are you running a build that was hand-modified to use a different data
   directory?** Only ever change `appDataDir()` in
   `app/dist-electron/main.cjs` alongside a real migration (see the README
   section linked above) — never as a casual rename.
3. **Did an uninstaller remove it?** Standard NSIS uninstallers do not touch
   `%APPDATA%` by default, but always decline any "remove user data" /
   "remove all user data" option if one is offered.

Everything the app persists lives in that one folder:

| File | Holds |
|---|---|
| `profiles.json` | account names and profile folder paths (no credentials) |
| `settings.json` | theme, default account |
| `usage-snapshots.json` | usage history for the account dashboard |
| `api-keys.json` | API key **metadata** — nickname, provider, budget |
| `api-keys-vault.json` | API key **secrets**, DPAPI-encrypted |
| `api-usage-snapshots.json` | API usage history for trends |

Deleting that folder resets the app completely. Nothing there is ever committed.

---

## Account problems

### "Session expired — log in again from a terminal"

The usage API returned 401/403 and the stored refresh token could not produce a
new access token — usually revoked, or rotated by signing in elsewhere.

Launch a terminal for that account from the app and run `claude auth login`.

### "The Claude sign-in has expired. Sign in again from the account card."

Same cause, surfaced by the alerts system rather than the dashboard. Same fix.

### "Account name is required." / an account already exists

Names must be unique and non-empty. Two accounts also cannot point at the same
directory — that would defeat the isolation the app exists to provide.

### A launched terminal is using the wrong account

Two causes:

1. **VS Code was already running.** Windows hands the new window to the existing
   process, which keeps its own environment. Close VS Code fully, or use a
   terminal launch.
2. **A default is set.** **Set Default** writes the user-level
   `CLAUDE_CONFIG_DIR`, which every *new* terminal inherits. Clear it, or launch
   explicitly from the app.

Terminals already open never change account — environment is fixed at start.

### The default account behaves as if signed out

The one genuine trap in the underlying mechanism. With `CLAUDE_CONFIG_DIR`
**unset**, Claude Code reads `.claude.json` from your home directory. Set it
explicitly to that same `.claude` folder and Claude Code looks *inside* the
folder, finds nothing, and forks fresh state.

**Never point `CLAUDE_CONFIG_DIR` at the default `~\.claude` directory.** The app
launches the default profile with the variable deliberately unset.

### "Could not persist the default CLAUDE_CONFIG_DIR (value did not stick)."

Setting a user-scope environment variable broadcasts a system-wide change
notification that can time out on a busy machine even when the registry write
succeeded. The app confirms by reading back, so this means the value genuinely is
not there. Retry, or set it by hand:

```powershell
[Environment]::SetEnvironmentVariable("CLAUDE_CONFIG_DIR", "C:\Users\<you>\.claude-work", "User")
```

Then open a **new** terminal.

### "VS Code ('code') was not found on PATH."

Open VS Code, `Ctrl+Shift+P`, run **Shell Command: Install 'code' command in
PATH**, then open a new terminal.

---

## GPT / Codex problems

### "Codex is not installed or is not available on PATH."

The app searches the standard Windows locations — Codex Desktop, an npm global
install, the VS Code extension, and WindowsApps. None matched.

Confirm with `codex --version` in a terminal. If that works but the app still
cannot find it, your install is somewhere unusual; the discovery paths are in
`app/dist-electron/main.cjs` (searched for `"OpenAI", "Codex", "bin"`,
`"openai.chatgpt-"` and `"codex-win32-x64"`).

### "Codex is not signed in with a ChatGPT account."

Codex is installed but has no ChatGPT session. Sign in through Codex itself; the
app only reads what Codex already knows.

### "Codex usage did not respond in time. Make sure Codex is installed and signed in."

Codex was found and started but did not answer before the timeout. Usually a slow
first run or a Codex process wedged in the background. Retry; if it persists, run
Codex once by hand to confirm it responds.

### "Codex initialization failed."

Codex was located but would not start. Run it directly in a terminal — the error
it prints there is the real one.

---

## API key problems

### "OS encryption (DPAPI) is unavailable, so the key cannot be stored securely. Aborting."

The app **refuses to store a key in plaintext** — intended behaviour.

`safeStorage` reports unavailable when the OS keyring cannot be reached, usually
a damaged, sandboxed or temporary Windows profile. Run as your normal user. Do
not work around it by putting the key somewhere else.

### "Stored key could not be decrypted"

Two causes; the common one is fixable without re-entering anything.

> **Since 1.7.0 the rename case is handled for you.** On startup the app copies
> the master key from the previous product name's userData folder if the current
> one has none — once, never overwriting a live key, and leaving the old folder
> untouched. You should only meet this error now if you moved data by hand, or
> if a fresh install had already minted its own key before the old data arrived.

**1. The `safeStorage` master key did not come with the data.** If *every* key
reports this at once, right after moving data between installs or renaming the
app, the vault is fine — the master key is missing.

Electron's `safeStorage` does not DPAPI-wrap each secret. It generates one random
master key, DPAPI-wraps that, and stores it in a `Local State` file inside
**Electron's own userData folder** (`%APPDATA%\<productName>`) — a *different*
directory from the one holding `api-keys-vault.json`. A fresh install mints a new
master key, so copied ciphertext cannot be opened. Close the app and carry the
key across:

```powershell
Copy-Item "$env:APPDATA\<old productName>\Local State" `
          "$env:APPDATA\<new productName>\Local State" -Force
```

Back up the destination first if you want to be able to undo it. Reopen the app
and the keys decrypt immediately.

**2. The vault genuinely came from another Windows user or machine.** DPAPI is
scoped to the user that encrypted it, so the ciphertext is unreadable here by
design — and `Local State` will not help, because it is DPAPI-protected the same
way. Remove each key and add it again.

Telling them apart: cause 1 hits **every** key at once immediately after a move
or rename; cause 2 follows carrying files to a different user or PC.

### "Key rejected (401) — invalid or revoked"

The provider refused the key outright. Check it was pasted whole and is still
active in the provider's console.

### "Forbidden (403) — this key lacks permission (may need an admin/management key)"

The key is valid but not permitted to read the endpoint being queried. See the
admin-key entries below.

### "Requires an Anthropic admin key." / "Requires an OpenAI admin key."

Neither provider exposes cost or usage to an ordinary key, and neither has a
balance API at all. A standard key can only be validated.

Related messages, all the same underlying limitation:

- *"This key can make API requests, but organization analytics require an
  sk-ant-admin key."*
- *"Standard keys cannot read organization analytics."*
- *"Project keys cannot read organization analytics."*
- *"Anthropic does not expose key balances."*

Since 1.4.1 the app checks this **at the point you add the key**, so you learn
immediately rather than from an empty dashboard.

There is also a workaround needing no special key: the **"Measured locally"**
panel on the Anthropic provider page reads a shared local ledger of real token
counts recorded by other in-house tools. Click **📖 Usage guide** on that page,
or read [USAGE_TRACKING_GUIDE.pdf](../assets/USAGE_TRACKING_GUIDE.pdf).

### "The key is recognized as an admin key, but one or more organization permissions are missing."

The right *kind* of key, but its role lacks a permission the analytics endpoints
need. Grant the missing organisation permissions in the provider console.

### "The key can be validated, but Google does not expose billing or usage totals for AI Studio keys."

Gemini AI Studio keys are inference-only. Figures are labelled **Estimated**
rather than implying precision that does not exist.

### Charts are empty on a brand new key

The app is not a proxy and cannot see traffic it did not make. Trends come from
snapshotting each provider's cumulative counters over time and diffing them,
which needs at least two snapshots. OpenRouter is the exception — it reports live
windows immediately.

---

## Update problems

### "Update manifest is missing a version, HTTPS download URL, or SHA-256 checksum."

Deliberate refusal. The app will not offer an update unless the manifest carries
all three, and the download URL is HTTPS.

Regenerate it properly:

```powershell
npm run release:manifest -- 'release/AI-Account-Manager-Setup-1.7.1.exe' 'https://downloads.example.com/AI-Account-Manager-Setup-1.7.1.exe'
```

Plain HTTP, a missing digest, or a hand-edited manifest will always be rejected.

---

## Skills Sync problems

### "AIEnvironmentManager.exe not found."

Skills Sync is a front end over the separate AI Environment Manager engine — this
app never touches skill files itself. Install the engine, or use the button on
the Skills Sync page to open it directly. Engine exit code 2 means "completed
with failures" and is handled as a partial success, not an error.

---

## Build and test problems

### "Automation host is not built"

From a source checkout, publish the self-contained helper before launching a
packaged directory:

```powershell
npm run automation:publish
```

If `dotnet` is missing, install a .NET 8 SDK or newer. End-user installers do
not need a separate .NET installation. For permission detection, hotkey,
profile-lock, and diagnostics issues, see
[AUTOMATION_AND_SESSIONS.md](AUTOMATION_AND_SESSIONS.md).

**Validation required** is not a helper failure. It means the global live mode
was requested but no provider selector has passed every production invocation
gate. Keep Detection only selected; the capability matrix lists the exact
remaining live or account-access test for each surface. Native/CLI Auto and
Skip are also refused until an expiring selected provider/profile trust policy
is implemented and validated.

### `npm test` fails after I edited something in `app/`

That is the runtime verification doing its job. `scripts/verify-runtime.cjs`
asserts that required IPC channels, Codex discovery paths, preload bridges and UI
strings are still present. Read which assertion failed — it names exactly what
went missing.

Most common self-inflicted causes:

- Renaming `app/dist/assets/index-CfQCNBzk.js`. The test asserts that exact
  filename. **Do not rename the asset files.**
- Deleting an IPC channel string (`account/usage/read`, `claude:history`,
  `alerts:get`, `alerts:set`, `updates:check`).
- Reintroducing the removed `"View all other accounts →"` button, which is
  asserted *absent*.

### electron-builder cannot overwrite files

A copy of the app is running and holding a lock. Close it, or use
`.\build\build.ps1`, which does that first.

### The installer built but is unsigned

Expected unless `CSC_LINK` and `CSC_KEY_PASSWORD` are set in the environment.
`build.ps1` prints which mode it used. Certificates are never stored in the
repository; CI reads them from encrypted repository secrets.

---

## Still stuck

Include:

- what you clicked and what you expected;
- the exact error text;
- installed build or from source, and the version from `package.json`;
- output of `claude --version`, `codex --version` and `node --version`.

**Never paste an API key, an OAuth token, or the contents of
`api-keys-vault.json` or `Local State` into a bug report.**
