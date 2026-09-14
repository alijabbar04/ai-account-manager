# Installing AI Account Manager

This guide assumes no technical background. Follow it in order.

Two routes. **Almost everyone wants Option A.**

- **Option A — just use the app.** Download an installer and run it. About five
  minutes, no admin rights.
- **Option B — run from the source code.** Only if you need to _change_ the app.

---

## Option A — Install the app (recommended)

### What you need

- A Windows 10 or Windows 11 PC (64-bit).
- **No GitHub account needed** — this repository is public.
- **No administrator rights** — everything installs per-user.

This app is a dashboard over three other programs:

| Tool | | What it is for |
|---|---|---|
| **Claude Code** | required | The accounts this app manages *are* Claude Code profiles, and signing in runs `claude auth login` |
| **Codex CLI** | optional | Powers the GPT / Codex usage panel |
| **VS Code** | optional | **Open in VS Code** launches an account into it |

**On a new machine, install them in one step.** Press the Windows key, type
`powershell`, press Enter, and run:

```powershell
irm https://raw.githubusercontent.com/alijabbar04/ai-account-manager/main/scripts/install-prerequisites.ps1 | iex
```

It lists what is missing, shows you exactly which vendor packages it would
install — Anthropic's, OpenAI's and Microsoft's own winget packages — and waits
for you to say yes. Anything already installed is skipped, so it is safe to
re-run. To see the report without installing anything, download it and run it
with `-CheckOnly`.

Prefer to do it yourself? These are the same packages:

```powershell
winget install --id Anthropic.ClaudeCode --exact          # required
winget install --id OpenAI.Codex --exact                  # optional
winget install --id Microsoft.VisualStudioCode --exact    # optional
```

> **Then close PowerShell and open a new window.** A program that is already
> running keeps the environment it started with, so it cannot see anything
> installed since — this is the single most common reason sign-in still fails
> right after installing Claude Code.

### Step 1 — Download

Go to the **Releases** page (add `/releases` to the repository address), open the
newest release, and download `AI-Account-Manager-Setup-<version>.exe` from
**Assets**.

### Step 2 — Install

Run the downloaded file.

Windows may show **"Windows protected your PC"**. Expected — the build is not
code-signed, which only means no certificate was purchased. Click **More info**,
then **Run anyway**. Your browser may warn on download too; choose **Keep**.

The installer is **per-user**, so no admin rights. It creates a Desktop shortcut
and a Start Menu entry.

### Step 3 — First run: bring in the account you already have

Open **AI Account Manager**.

Claude Code stores your current session in a folder called `.claude` in your user
folder. Register it:

1. **Add account** → **Import existing**
2. Point it at `C:\Users\<your-name>\.claude`

Your account appears with live usage — session, weekly and model-scoped limits,
each with a percentage and reset countdown.

**Nothing is moved or copied.** Importing just records the folder's location.

### Step 4 — Add a second account

1. **Add account** → **Create new**
2. Name it something you will recognise, e.g. `work`. The app creates
   `C:\Users\<you>\.claude-work`.
3. A terminal opens running `claude auth login`.
4. Sign in in the browser — Anthropic or Google login both work. **The app never
   sees your password.**
5. The card turns green on its own when the login lands.

Repeat as many times as you like.

### Step 5 — Use an account

Click **Open in VS Code** on a card. A VS Code window opens with that account's
environment already set. Several accounts can be open at once — each window
keeps its own account for as long as it lives. There is no "switching".

The dashboard also has **Start something new**: **New Claude Cowork**, **New
Codex chat** and **New VS Code Codex** open the installed apps directly. Those
use whichever account is active in Claude Desktop or ChatGPT — they are not
per-profile.

> **VS Code catch:** if VS Code is already running, Windows hands the new window
> to the existing process, which keeps _its_ environment rather than the one the
> app set. Close VS Code fully first.

### Step 6 — Optional: set a default account

**Set Default** points every _new_ terminal at that account, even outside this
app, by setting the user-level `CLAUDE_CONFIG_DIR` variable. Clear it just as
easily. Terminals already open are unaffected.

### Step 7 — Optional: GPT / Codex usage

If the Codex CLI is installed and signed in, the **GPT / Codex** panel reads your
ChatGPT plan usage from it, and the token-history view compares Claude and GPT
daily usage over 7, 30 or 90 days.

The app looks for Codex in the usual Windows locations — Codex Desktop, an npm
global install, the VS Code extension, and WindowsApps. If it reports it cannot
find Codex, check `codex --version` works in a terminal.

### Step 8 — Optional: usage alerts

**Alerts** lets you configure Windows notifications for quota thresholds, reset
reminders, and Claude sign-ins that are about to expire. Off until you set them
up.

### Step 9 — Optional: Automation & Sessions

The separate **Automation & Sessions** area can keep trusted provider permission
monitoring alive in the tray and launch isolated Claude/ChatGPT browser
profiles. It starts Off and Dry run and requires a risk acknowledgement. Read
[AUTOMATION_AND_SESSIONS.md](AUTOMATION_AND_SESSIONS.md) before enabling
monitoring; it includes the emergency stop, capability matrix, and exact steps
for logging an authorised second account into the correct profile. In 1.5.0,
all provider adapters remain detection-only and native/CLI Auto or Skip launch
is validation-locked pending an expiring trusted-session policy.

### Step 10 — Optional: track API key spending

Independent of the account features — skip if you do not use API keys directly.

1. **API Keys** in the sidebar → **Add key**
2. Choose the provider, paste the key, optionally set a monthly budget.

The app **detects the key type and verifies analytics access before saving**, so
if a key cannot report spend you find out immediately rather than staring at an
empty dashboard later.

What each provider actually exposes:

| Provider       | What you get                                                                        |
| -------------- | ----------------------------------------------------------------------------------- |
| **OpenRouter** | Everything — balance plus live daily / weekly / monthly spend from one ordinary key |
| **Anthropic**  | A standard key validates only. Spend needs an organisation **Admin key**            |
| **OpenAI**     | Same — a project key validates only; spend needs an **Admin key**                   |
| **Gemini**     | Validation only; usage can be estimated, not measured                               |

If your Anthropic pages look empty that is expected, not broken. Click
**📖 Usage guide** on the provider page, or read
[USAGE_TRACKING_GUIDE.pdf](../assets/USAGE_TRACKING_GUIDE.pdf).

**Your keys are encrypted** with Windows DPAPI before touching disk, and are only
ever sent to that provider's own API.

---

## Option B — Run from the source code (developers)

### Step 1 — Install Node.js and the .NET SDK

Download the **LTS** build from <https://nodejs.org> (22.x is what CI uses; 20 or
newer required) and accept the defaults. Then, in a **new** PowerShell window:

```powershell
node --version
npm --version
```

No Visual Studio, Python or C++ toolchain is needed — no native modules.

Install the [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (or
newer) as well. It builds the Windows UI Automation helper; release installers
already bundle that helper, so this SDK is for source development only.

```powershell
dotnet --list-sdks
```

### Step 2 — Install Git and the GitHub CLI

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
```

**Close PowerShell and open a new window** afterwards. The repository is public,
so cloning needs no sign-in — run `gh auth login --web` only if you intend to
push.

### Step 3 — Clone

```powershell
cd $env:USERPROFILE
mkdir repos -Force
cd repos
gh repo clone alijabbar04/ai-account-manager
cd ai-account-manager
```

### Step 4 — Run setup

```powershell
.\setup.ps1
```

Checks your Node version, installs dependencies, repairs the Electron binary if
its download was skipped, and runs the tests.

If PowerShell refuses with a message about execution policies:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Step 5 — Run it

```powershell
npm start
```

To test the packaged layout instead — `extraResources`, the bundled PDF guide,
the automation helper — build it:

```powershell
npm run build:dir
```

That packages into `release\win-unpacked`; launch
`release\win-unpacked\AI Account Manager.exe`.

> **Close any installed copy first.** The app takes a single-instance lock, so a
> second copy exits immediately and looks like a crash.

### Step 6 — Understand what you are editing

**This project has no TypeScript build step.** Versions 1.3.0–1.7.0 were made by
editing the app's built output directly; the original TypeScript for those
releases no longer exists. `app/` _is_ the source:

- `app/dist-electron/main.cjs` — main process
- `app/dist-electron/preload.cjs` — the context-bridge surface
- `app/dist/assets/index-*.js` — React renderer

Edit those directly, then **always** run `npm test`. It runs unit tests _and_
`scripts/verify-runtime.cjs`, which asserts required IPC channels, Codex
discovery paths, preload bridges and UI strings are still present — including
that the renderer bundle keeps its exact filename. **Do not rename the asset
files.**

`npm run format` keeps everything Prettier-formatted, which is what makes editing
bundles by hand tolerable.

### Step 7 — Build the installer

```powershell
.\build\build.ps1
```

Output: `release\AI-Account-Manager-Setup-<version>.exe`. Install and launch it
once before giving it to anyone — packaged builds can fail on the bundled PDF
guide, which ships as an unpacked extra resource.

Signing happens automatically if `CSC_LINK` and `CSC_KEY_PASSWORD` are set.
Certificates are never stored in the repository.

---

## Upgrading from "Claude Account Manager"

The app was renamed, but its **data directory deliberately was not** — it is
still `%APPDATA%\ClaudeAccountManager`. So an upgrade Just Works: your accounts,
settings, usage history and API keys all carry over with no action from you.

The old and new builds install to separate folders, so both can sit on the
machine at once. Uninstall the old one from **Settings → Apps** when you are
happy.

Your API keys come across too. There are in fact _two_ folders involved, not
one: Electron's `safeStorage` master key lives in a `Local State` file inside
Electron's own userData folder (`%APPDATA%\<productName>`), separate from the app
data folder holding `api-keys-vault.json`. Since 1.7.0 the app carries that key
over itself on first launch — it copies rather than moves, never overwrites a key
that is already there, and leaves the old install able to run.

> **If you ever move data by hand**, remember both folders. Copy only the vault
> and every API key reports _"Stored key could not be decrypted"_ despite the
> vault having copied perfectly. See
> [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Something went wrong?

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
