# Installing AI Account Manager

This guide assumes no technical background. Follow it in order.

There are two routes. **Almost everyone wants Option A.**

- **Option A — just use the app.** Download an installer and run it. About five
  minutes, no admin rights.
- **Option B — run from the source code.** Only if you need to *change* the app.

---

## Option A — Install the app (recommended)

### What you need

- A Windows 10 or Windows 11 PC (64-bit).
- **Claude Code installed**, because this app manages Claude Code accounts — it
  cannot do anything useful without it. Check by pressing the Windows key,
  typing `powershell`, pressing Enter, and running:

  ```powershell
  claude --version
  ```

  If that prints a version number you are ready. If it says the command is not
  recognised, install Claude Code first from
  <https://claude.com/claude-code>, then close and reopen PowerShell.
- **No GitHub account needed.** This repository is public, so the Releases page
  and the installer download are open to anyone.

### Step 1 — Download

1. Go to the **Releases** page of this repository (add `/releases` to its web
   address, or use the link on the right of the repository front page).
2. Open the newest release at the top.
3. Under **Assets**, click `AIAccountManager-Setup-<version>.exe`. It is about
   90 MB.

### Step 2 — Install

Run the downloaded file.

Windows may show a blue **"Windows protected your PC"** box. This is expected —
the app is not code-signed, which only means no certificate was purchased for it.
Click **More info**, then **Run anyway**. Your browser may show a similar warning
on download; choose **Keep**.

The installer is **per-user**, so it does not ask for admin rights. It creates a
Desktop shortcut and a Start Menu entry.

### Step 3 — First run: bring in the account you already have

Open **AI Account Manager** from the Desktop or Start Menu.

Claude Code stores your current session in a folder called `.claude` in your user
folder. Import it so the app can see it:

1. Click **Add account**.
2. Choose **Import existing**.
3. Point it at `C:\Users\<your-name>\.claude`.

Your existing account appears as a card, with live usage figures — session,
weekly and model-scoped limits, each with a percentage and a reset countdown.

**Nothing was moved or copied.** Importing just registers the folder's location;
your session stays exactly where Claude Code put it.

### Step 4 — Add a second account

1. Click **Add account** → **Create new**.
2. Give it a name you will recognise, such as `work` or `personal`. The app
   creates a folder like `C:\Users\<you>\.claude-work` for it.
3. A terminal window opens automatically running `claude auth login`.
4. Sign in in the browser that opens — an Anthropic login or a Google login both
   work. **The app never sees your password**; the whole sign-in happens in your
   browser, exactly as it would if you ran Claude Code yourself.
5. When the login completes, the card turns green on its own.

Repeat for as many accounts as you want.

### Step 5 — Use an account

Click **Open Claude** on whichever account you want to work as. A terminal opens
with that account's environment already set.

You can open several accounts at the same time — each terminal keeps its own
account for as long as it is open. There is no "switching"; they simply coexist.

The other launch buttons do the same thing for **PowerShell** and **VS Code**.

> **VS Code catch:** if VS Code is already running, Windows hands the new window
> to the process that is already open, and it inherits *that* environment rather
> than the one the app set. Close VS Code completely first, or use a terminal
> launch, which always works.

### Step 6 — Optional: set a default account

**Set Default** on a card points every *new* terminal you open at that account,
even outside this app. Clear it just as easily from the same menu. Terminals that
are already open are unaffected.

### Step 7 — Optional: track API key spending

This part is independent of the account features — skip it if you do not use API
keys directly.

1. Click **API Keys** in the left sidebar.
2. Click **Add key**, choose the provider, paste the key, and optionally set a
   monthly budget.
3. Click **Validate** to confirm the key works.

What you see depends entirely on what each provider's API is willing to report:

| Provider | What you get |
|---|---|
| **OpenRouter** | Everything — balance and live daily / weekly / monthly spend, from one ordinary key |
| **Anthropic** | A standard key validates but reports nothing. Spend needs an organisation **Admin key** |
| **OpenAI** | Same — a project key validates only; spend needs an **Admin key** |
| **Gemini** | Validation only; usage can be estimated but not measured |

If your Anthropic pages look empty, that is expected rather than broken — click
the **📖 Usage guide** button on the provider page for the full explanation and
the workarounds.

**Your keys are encrypted** with Windows DPAPI before they touch the disk, and
are only ever sent to that provider's own API.

---

## Option B — Run from the source code (developers)

### Step 1 — Install Node.js

1. Go to <https://nodejs.org> and download the **LTS** version for Windows
   (24.x is what this project is tested on; 20 or newer is required).
2. Run the installer and accept the defaults. It adds itself to your PATH.

Check it worked — open a **new** PowerShell window and run:

```powershell
node --version
npm --version
```

You want `v20` or higher, and npm `10` or higher.

No Visual Studio, Python or C++ toolchain is needed — this project has no native
modules.

### Step 2 — Install Git and the GitHub CLI

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
```

**Close PowerShell and open a new window** so the new commands are found.

The repository is public, so cloning needs no sign-in. Sign in only if you intend
to push changes or open a pull request — a browser window opens:

```powershell
gh auth login --web
```

### Step 3 — Clone the repository

```powershell
cd $env:USERPROFILE
mkdir repos -Force
cd repos
gh repo clone alijabbar04/ai-account-manager
cd ai-account-manager
```

### Step 4 — Run the setup script

```powershell
.\setup.ps1
```

This checks your Node version, installs the exact dependency tree pinned in
`package-lock.json`, repairs the Electron binary if its download was skipped, and
type-checks the project. It takes a couple of minutes on a first run.

If PowerShell refuses to run the script with a message about execution policies,
run this once in the same window and try again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Step 5 — Run the app

```powershell
npm start
```

This builds the main process and the renderer, then launches Electron. The whole
build takes a second or two, so just re-run it after each change.

From here, first-run setup is the same as Option A — continue from **Step 3**
above.

> **Close any installed copy of the app first.** It takes a single-instance lock,
> so a second copy exits immediately and looks like a crash.

> If you script the launch yourself, make sure `ELECTRON_RUN_AS_NODE` is not set
> in your environment — some tools set it, and with it set `electron .` starts as
> plain Node and exits without a window. Clear it in the **same** command, and use
> `Remove-Item Env:\ELECTRON_RUN_AS_NODE` rather than assigning `$null`, which
> leaves the variable defined as an empty string and does not fix it.

### Step 6 — Build the installer (only when you have changed the code)

```powershell
.\build\build.ps1
```

Output: `release\AIAccountManager-Setup-<version>.exe`. The first build downloads
electron-builder's NSIS tooling, so it is slower than later ones.

**Install and launch the result once before giving it to anyone.** A packaged
build can fail on things a development run never exercises — particularly the
bundled PDF guide, which ships as an unpacked extra resource.

---

## Upgrading from "Claude Account Manager"

If you previously ran the app under its old name, its data lives in a folder
under the old name and the renamed app will not find it — it will look like a
fresh install with no accounts and no API keys.

Nothing is lost. Close the app and copy the folder across in PowerShell:

```powershell
Copy-Item "$env:APPDATA\ClaudeAccountManager" "$env:APPDATA\AIAccountManager" -Recurse
```

Then reopen the app: your accounts, default, theme and API keys are all back.

Two notes:

- **Copy, do not move**, until you have confirmed everything is present. The old
  folder is then safe to delete.
- **The API key vault is encrypted with Windows DPAPI, scoped to your Windows
  user account.** Copying it on the *same* machine and user works fine. Copying
  it to a different user or PC will not — those keys must be re-entered.

The old and new builds install to separate folders, so both can sit on the
machine at once. Uninstall the old one from **Settings → Apps** when you are
happy.

---

## Something went wrong?

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
