# Troubleshooting

Grouped by when the problem happens. Each entry gives the message you actually
see, what is really going on, and the fix.

---

## The app will not start

### Nothing happens when I launch it

The most likely cause is the **single-instance lock**. The app deliberately
allows only one copy at a time, so a second launch exits immediately and looks
like a crash.

Check Task Manager for an existing **AI Account Manager** process — or an
`electron` process if you are running from source — and close it, or just use the
window that is already open. This is also the number one cause of a failed build
or a Playwright run reporting "browser closed": `build\build.ps1` kills stray
instances for you before building for exactly this reason.

If there is genuinely no instance running:

- Check your antivirus quarantine. Unsigned installers are a common false
  positive.
- Reinstall from the Releases page.

### Running from source, `npm start` exits without a window

`ELECTRON_RUN_AS_NODE` is set in your environment. With that variable present,
`electron .` starts as plain Node, runs nothing, and exits silently. Some tools
set it and it is inherited by every new shell.

Clear it in the **same** command that launches the app, because every new shell
inherits it again:

```powershell
Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue; npm start
```

**Use `Remove-Item`, not `$env:ELECTRON_RUN_AS_NODE = $null`.** Assigning `$null`
leaves the variable defined as an empty string, which Electron still treats as
set — so the app keeps failing in a way that looks like the fix did not work.

The failure is not always silent. If the variable is set to an empty string you
may instead get a native crash with `Assertion failed:
(isolate_data->snapshot_data()) != nullptr` in `node::CreateEnvironment` and exit
code 134. Same cause, same fix.

### `npm start` fails, or `node_modules\electron\dist\electron.exe` is missing

Electron downloads its ~150 MB binary in a postinstall step, and corporate
proxies often block it silently — leaving an install that looks complete.

```powershell
node node_modules\electron\install.js
```

`setup.ps1` checks for this and retries automatically. If it still fails you are
behind a proxy: set `HTTPS_PROXY` and re-run.

### Windows says "Windows protected your PC"

Expected — the installer is not code-signed. **More info** → **Run anyway**.

### PowerShell refuses to run `setup.ps1` or `build.ps1`

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Run once in the same window, then retry. It affects only that window.

---

## The app opens but has no accounts or API keys

### It looks like a completely fresh install

If you previously ran this app under its former name, its data is in a folder
named after the old branding and the renamed build does not look there.

Nothing is lost. Close the app and copy the folder:

```powershell
Copy-Item "$env:APPDATA\ClaudeAccountManager" "$env:APPDATA\AIAccountManager" -Recurse
```

Reopen the app and everything is back. Copy rather than move until you have
confirmed it worked, then delete the old folder.

**Caveat for API keys:** the vault is encrypted with Windows DPAPI, scoped to
your Windows user on that machine. Copying it on the *same* machine and user
works. Moving it to another user or PC will not — those keys must be re-entered.

### All state lives outside the app folder

For reference, everything the app persists is in `%APPDATA%\AIAccountManager\`:

| File | Holds |
|---|---|
| `profiles.json` | account names and profile folder paths (no credentials) |
| `settings.json` | theme, default account |
| `usage-snapshots.json` | usage history for the account dashboard |
| `api-keys.json` | API key **metadata** — nickname, provider, budget |
| `api-keys-vault.json` | API key **secrets**, DPAPI-encrypted |
| `api-usage-snapshots.json` | API usage history for trends |

Deleting the folder resets the app completely. Nothing here is ever committed to
the repository.

---

## Account problems

### "Session expired — log in again from a terminal"

The usage API returned 401 or 403, and the stored refresh token could not
produce a new access token — usually because the refresh token was revoked, or
was rotated by signing in to the same account somewhere else.

Fix: launch a terminal for that account from the app and run:

```powershell
claude auth login
```

Sign in in the browser. The card recovers on the next refresh.

### "Not logged in"

That profile folder has no credentials file yet — the account was created but
never signed in, or the folder was cleared. Launch a terminal for it and run
`claude auth login`.

### "Offline or unreachable: ..."

A network error, not an auth problem. The app falls back to local estimates
derived from transcripts, so the card still shows something, marked as an
estimate. It corrects itself when connectivity returns.

### "Folder does not exist" when importing

The path typed or picked is not there. Import expects the profile directory
itself — for the default account that is `C:\Users\<you>\.claude`, not its
parent, and not `.claude.json`.

### "That folder is already registered as an account."

Two accounts cannot point at the same directory — that would defeat the
isolation the app exists to provide. Rename or remove the existing entry first.

### "An account named ... already exists."

Names must be unique. Rename the existing account or choose a different name.

### A launched terminal is using the wrong account

Two known causes:

1. **VS Code was already running.** Windows hands the new window to the existing
   VS Code process, which keeps *its own* environment rather than the one the app
   injected. Close VS Code completely first, or use a terminal launch.
2. **A default is set.** **Set Default** writes the user-level
   `CLAUDE_CONFIG_DIR` variable, which every *new* terminal inherits. Clear the
   default, or launch explicitly from the app.

Terminals that are already open never change account — the environment is fixed
when the process starts.

### The default account behaves as if it were signed out

This is the one genuine trap in the underlying mechanism, and the app already
handles it — but it is worth knowing if you set the variable yourself.

With `CLAUDE_CONFIG_DIR` **unset**, Claude Code reads `.claude.json` from your
home directory, as a sibling of the `.claude` folder. Set the variable explicitly
to that same `.claude` folder and Claude Code instead looks *inside* the folder,
finds nothing, and forks fresh state.

So: **never point `CLAUDE_CONFIG_DIR` at the default `~\.claude` directory.** The
app launches the default profile with the variable deliberately unset.

### "Could not persist the default CLAUDE_CONFIG_DIR (value did not stick)."

Setting a user-scope environment variable broadcasts a system-wide change
notification, which can time out on a busy machine even though the registry write
succeeded. The app confirms by reading the value back, so this message means the
value genuinely is not there.

Retry. If it keeps failing, set it by hand:

```powershell
[Environment]::SetEnvironmentVariable("CLAUDE_CONFIG_DIR", "C:\Users\<you>\.claude-work", "User")
```

Then open a **new** terminal — existing ones keep the old value.

### "VS Code ('code') was not found on PATH."

The `code` command is not installed. Open VS Code, press `Ctrl+Shift+P`, and run
**Shell Command: Install 'code' command in PATH**, then open a new terminal.

### "Refusing to delete a folder outside your home directory."

A deliberate guard. *Also delete the folder* only removes directories under your
home folder, so a mis-registered path cannot be used to delete something
elsewhere on the disk. Delete it manually if you are certain.

---

## API key problems

### "OS encryption (DPAPI) is unavailable, so the key cannot be stored securely. Aborting."

The app **refuses to store a key in plaintext** — this is intended behaviour, not
a bug.

Electron's `safeStorage` reports unavailable when the OS keyring cannot be
reached. On Windows this normally means a damaged or unusual user profile, or a
sandboxed/temporary account. Try running as your normal Windows user. Do not work
around it by storing the key elsewhere in the repo.

### "Stored key could not be decrypted"

The vault file was written by a **different Windows user or machine**. DPAPI keys
are scoped to the user that encrypted them, so the ciphertext is unreadable here —
by design.

Remove the key in the app and add it again.

### "That doesn't look like a valid key for this provider."

The key does not match that provider's expected prefix — for example an
`sk-ant-…` key pasted into the OpenAI provider. Check the provider selection and
that the whole key was copied.

### My Anthropic or OpenAI pages show no spend

**This is expected, not a fault.** Neither provider exposes cost or usage to an
ordinary API key, and neither has a balance API at all. A standard key can only
be validated.

To see spend you need an **organisation Admin key** (`sk-ant-admin…` for
Anthropic, an admin key for OpenAI), which only an organisation owner can create.

There is also a workaround that needs no special key: the **"Measured locally"**
panel on the Anthropic provider page reads a shared local ledger of real token
counts recorded by other in-house tools. Click **📖 Usage guide** on the provider
page for the full explanation, or read
[USAGE_TRACKING_GUIDE.pdf](USAGE_TRACKING_GUIDE.pdf).

For what each provider genuinely exposes, see
[API_ANALYTICS_RESEARCH.md](API_ANALYTICS_RESEARCH.md).

### Gemini shows estimates only

AI Studio keys are inference-only — there is no usage, cost or balance endpoint
to read. The app labels these figures **Estimated** rather than implying
precision it does not have.

### Charts are empty on a brand new key

The app is not a proxy, so it cannot see traffic it did not make. Trends are
derived by snapshotting each provider's cumulative counters over time and
diffing them, which needs at least two snapshots. OpenRouter is the exception —
it reports live windows immediately.

---

## Skills Sync problems

### "AIEnvironmentManager.exe not found."

Skills Sync is a front end over the separate AI Environment Manager engine — this
app never touches skill files itself. The engine is not installed, or is not in
one of the locations searched (the Desktop, `%LOCALAPPDATA%\Programs`, or a
sibling repo `dist` folder).

Install it, or use the button on the Skills Sync page to open it directly.

### "Engine returned no JSON output."

The engine ran but produced nothing parseable — usually a crash or a version
whose JSON verbs differ. Run it by hand to see the raw output:

```powershell
& "<path>\AIEnvironmentManager.exe" --skills-status --json
```

Note that engine exit code 2 means "completed with failures", which the app
handles as a partial success rather than an error.

---

## Build and test problems

### `npm run dist` fails to overwrite files

A copy of the app is running and holding a lock. Close it, or use
`.\build\build.ps1`, which kills stray instances first.

### `npm run verify` reports "browser closed" immediately

Same single-instance lock — close any running copy before starting a Playwright
run.

### `npm run verify` fails on usage assertions

`verify.mjs` expects at least one registered profile and a signed-in default
`~\.claude` for its live-usage checks. Use `npm test` instead if you only want
the pure logic tests, which need neither.

### Should I ever run a test against a real API key?

No. `npm run verify:api` runs with `CAM_FAKE_PROVIDERS=1` and mock provider data
precisely so it never needs one. Keep it that way.

---

## Still stuck

Include, when reporting a problem:

- what you clicked and what you expected;
- the exact error text from the app;
- whether you are running the installed build or from source, and the version
  from `package.json`;
- output of `claude --version` and `node --version`.

**Never paste an API key, an OAuth token, or the contents of
`api-keys-vault.json` into a bug report.**
