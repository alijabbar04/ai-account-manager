# AI Account Manager

**A Windows desktop app for running several Claude Code accounts on one machine,
plus a dashboard for tracking AI provider API keys.**

Claude Code keeps its entire session — OAuth tokens, settings, history — in one
configuration directory, and reads the `CLAUDE_CONFIG_DIR` environment variable
to decide which directory that is. One folder therefore equals one fully
isolated account. AI Account Manager turns that mechanism into a dashboard: each
account lives in its own folder, stays signed in independently, and can be
launched into a terminal or VS Code with the right environment already injected —
no repeated logins and no juggling environment variables by hand. Alongside that
it tracks your API keys for Anthropic, OpenAI, Google Gemini and OpenRouter,
showing balance, spend and usage trends where each provider's API exposes them.

> **Not affiliated with Anthropic.** This is an independent, in-house tool that
> drives the publicly documented `CLAUDE_CONFIG_DIR` mechanism and each
> provider's own public API. It is not a Claude product and is not endorsed by
> Anthropic or any other provider named here.

![Windows 10/11](https://img.shields.io/badge/Windows-10%20%7C%2011-blue) ![Electron](https://img.shields.io/badge/Electron-42-9feaf9) ![License: MIT](https://img.shields.io/badge/License-MIT-green)

---

## Quick start for users

You need Windows 10 or 11 and a GitHub account **invited to this repository** —
it is private, so the Releases page is invisible until you accept the invite.

1. **Download.** Go to the [Releases](../../releases) page, open the latest
   release, and download `AIAccountManager-Setup-<version>.exe` from **Assets**.
2. **Install.** Run it. Per-user install, no admin rights needed. Windows may
   warn that the publisher is unrecognised — the app is not code-signed; click
   **More info** → **Run anyway**.
3. **Prerequisite.** [Claude Code](https://claude.com/claude-code) must be
   installed and on your PATH. Check with `claude --version` in PowerShell.
4. **First run — import the account you already have.**
   *Add account → Import existing* → point it at `C:\Users\<you>\.claude`. Your
   current session appears immediately, with live usage.
5. **Add a second account.** *Add account → Create new* → give it a name → a
   terminal opens running `claude auth login` → sign in in the browser. The card
   turns green by itself when the login lands.
6. **Work.** Click **Open Claude** on whichever account you want to be, and
   repeat for as many accounts as you like — they run side by side.
7. **Optional — track API spend.** **API Keys** in the sidebar → *Add key* →
   pick a provider, paste the key, set a monthly budget. Keys are encrypted with
   Windows DPAPI before they touch disk.

Full detail: [docs/INSTALL.md](docs/INSTALL.md) for a zero-assumptions install
walkthrough, [docs/USAGE.md](docs/USAGE.md) for the account guide, and the
in-app **📖 Usage guide** button on any provider page.

---

## Setup for developers

```powershell
git clone https://github.com/alijabbar04/ai-account-manager.git
cd ai-account-manager
.\setup.ps1
```

`setup.ps1` checks your Node version, installs the exact dependency tree from
`package-lock.json` (`npm ci`), and type-checks the project so you know the
checkout is sound before you run anything.

Run from source:

```powershell
npm start            # build main + renderer, then launch Electron
```

Rebuild the installer:

```powershell
.\build\build.ps1    # typecheck -> build -> electron-builder --win
                     # output: release\AIAccountManager-Setup-<version>.exe
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run typecheck` | Strict TypeScript across main, preload and renderer |
| `npm test` | Analytics + launcher unit tests, no Electron needed |
| `npm run verify` | End-to-end account dashboard test (Playwright) |
| `npm run verify:api` | End-to-end API analytics test, with `CAM_FAKE_PROVIDERS=1` mock data — **never uses a real key or network call** |
| `node scripts/verify-skills.mjs` | Skills Sync test; needs the AI Environment Manager engine installed (no npm alias for this one) |
| `npm run smoke:packaged` | Launches the packaged build from `release\win-unpacked` |

### Project layout

This is an Electron + React + Vite project, so it uses that ecosystem's standard
layout rather than a single `src/` drop:

| Path | What lives there |
|---|---|
| `electron/` | Main process — `main.ts`, `preload.ts`, and `lib/` (accounts, launcher, usage, token refresh, API key store and provider adapters) |
| `src/` | React renderer — views, components, styles |
| `shared/` | TypeScript types shared across the process boundary |
| `scripts/` | Build helpers and the test/verify harnesses |
| `build/` | `icon.ico` for electron-builder, plus `build.ps1` |
| `docs/` | Architecture, usage, design and research documents |
| `electron-builder.yml` | Packaging configuration (NSIS installer) |

Start with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — it explains how
profiles, launching and usage reporting actually work.

---

## Security notes

**No secrets live in this repository.** Everything sensitive is created locally,
on the machine that runs the app, and stays there.

- **No passwords, ever.** Sign-in is Claude Code's own browser OAuth flow. The
  app never sees, prompts for, or stores a password.
- **OAuth tokens stay where Claude Code put them** — inside each profile folder.
  The app's own store holds account names and folder paths only.
- **API keys are encrypted at rest** with Windows DPAPI via Electron
  `safeStorage`; the OS holds the master key, scoped to your Windows user.
  Secrets live in a separate vault file from their metadata, and if OS
  encryption is unavailable the app **refuses to store the key** rather than
  writing it in plaintext.
- **Keys and tokens never cross into the UI.** The renderer runs under
  `connect-src 'none'`; secrets are only ever sent from the main process to that
  provider's own API, never to any third party. They are masked on screen and
  never logged. Exports contain metadata only.
- **All local state lives outside this repo**, in
  `%APPDATA%\AIAccountManager\`. Nothing there is ever committed, and
  `.gitignore` blocks those filenames anyway in case one is copied in.
- **Network access is narrow**: each provider's own API, plus Anthropic's
  `api/oauth/usage` and `platform.claude.com/v1/oauth/token` endpoints — the same
  two the Claude Code CLI itself uses.

If you are adding a feature that touches a credential, the rule is simple: it
goes through `electron/lib/api/keyStore.ts`, it never crosses IPC, and it never
gets logged.

---

## Making changes

1. **Branch.** `git checkout -b add-provider-x` — never commit straight to
   `main`.
2. **Read the relevant doc.** Account handling →
   [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). API analytics →
   [docs/API_ANALYTICS_DESIGN.md](docs/API_ANALYTICS_DESIGN.md) and the
   [research report](docs/API_ANALYTICS_RESEARCH.md), which records what each
   provider's API can and cannot actually report. Skills Sync →
   [docs/SKILLS_SYNC.md](docs/SKILLS_SYNC.md).
3. **Edit, then type-check.** `npm run typecheck` catches most mistakes across
   the process boundary before the app ever launches.
4. **Test.** `npm test` for the pure logic. `npm run verify` / `verify:api` for
   the end-to-end paths — the API one runs against mock provider data, so
   **never point a test at a real key or a real account**.
5. **Rebuild the installer** with `.\build\build.ps1` and install it once. A
   packaged build can fail on things a dev run never shows, particularly around
   `extraResources` and the guide viewer.
6. **Open a pull request** saying what changed and what you tested.

### Two things that will catch you out

- **Kill any running copy before `npm run dist` or a Playwright launch.** The app
  takes a single-instance lock, so a second instance quits immediately and the
  test harness just sees "browser closed".
- **Never point `CLAUDE_CONFIG_DIR` at the default `~\.claude` folder.** With the
  variable unset, Claude Code reads `.claude.json` from the home directory; set
  it explicitly to that same folder and Claude Code looks *inside* the folder
  instead and forks fresh state. The app already handles this — launches of the
  default profile deliberately leave the variable unset.

---

## Documentation

| Document | For |
|---|---|
| [docs/INSTALL.md](docs/INSTALL.md) | Installing from scratch, assuming no technical background |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | When something fails: what it means and how to fix it |
| [docs/USAGE.md](docs/USAGE.md) | Day-to-day account management guide |
| [docs/USAGE_TRACKING_GUIDE.pdf](docs/USAGE_TRACKING_GUIDE.pdf) | Why API usage pages can look empty and how to fix it — also the in-app 📖 guide |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How profiles, launching and usage reporting work |
| [docs/API_ANALYTICS_DESIGN.md](docs/API_ANALYTICS_DESIGN.md) | Design of the API key analytics feature |
| [docs/API_ANALYTICS_RESEARCH.md](docs/API_ANALYTICS_RESEARCH.md) | What each provider's API genuinely exposes |
| [docs/SKILLS_SYNC.md](docs/SKILLS_SYNC.md) | Keeping a skill set identical across profiles |
| [BUILDING.md](BUILDING.md) | Packaging detail beyond `build.ps1` |

---

## Features

### Account management

- **Unlimited accounts** — Anthropic-login and Google-login alike; sign-in
  happens in your browser via `claude auth login` and both produce the same
  local session.
- **One-click launch** per account into Claude Code, PowerShell or VS Code, each
  with the correct `CLAUDE_CONFIG_DIR` injected. Run as many at once as you like.
- **Exact usage dashboard** — session (5h), weekly (all models) and model-scoped
  limits with percentages, severity and reset countdowns, read from Anthropic's
  own usage API using each profile's token. Extra-usage credit spend too.
- **Automatic token refresh** so idle accounts keep reporting without re-login.
- **Local fallback estimates** from transcripts when offline.
- **Set Default** — point every *new* terminal at a chosen account via the
  user-level `CLAUDE_CONFIG_DIR` variable, and clear it just as easily.
- **Import / export**, search, rename, remove, dark and light themes.

### API key analytics

A second dashboard tracks API keys across four providers, with an adapter
architecture built to add more.

- **Per-key card** — provider, nickname, masked key, balance, spend today / this
  week / this month, lifetime usage, rate limits where exposed, and a status
  light derived from runway and budget thresholds.
- **Charts** — cost, tokens and requests over 1 / 7 / 30 days and lifetime.
- **Analytics** — top spending provider, average daily spend, projected monthly
  spend, and credit runway.

Because the app is **not a proxy**, it can only show what each provider's own API
reports; windows and trends are derived by snapshotting cumulative counters over
time and diffing them.

| Provider | Balance | Usage / cost | Notes |
|---|---|---|---|
| **OpenRouter** | ✅ exact | ✅ exact (live daily/weekly/monthly) | Best supported — one key does it all |
| **Anthropic** | ❌ none | 🔑 needs an **Admin key** | Standard keys validate only; no balance API exists |
| **OpenAI** | ❌ none | 🔑 needs an **Admin key** | Project keys validate only; no balance API exists |
| **Gemini** | ❌ none | ❌ estimate only | AI Studio keys are inference-only |

Every metric is labelled in the UI with how it was obtained — **Live / Admin key
/ Estimated / Unavailable** — so nothing implies precision the provider does not
offer.

### Skills Sync

Keeps a curated set of Claude skills identical across every profile on the
machine. It is a thin front end over the AI Environment Manager engine, which
this app shells out to — AI Account Manager never touches skill files itself.
Every change is backed up first, checksum-verified, and never overwrites a newer
or locally modified copy. See [docs/SKILLS_SYNC.md](docs/SKILLS_SYNC.md).

---

## Caveats worth knowing

- **VS Code single instance:** if VS Code is already running, a newly launched
  window is created by the *existing* process and inherits its environment.
  Close VS Code first, or use a terminal launch, which is always reliable.
- **Removing an account** only unregisters it, unless you explicitly tick *also
  delete the folder*.

## License

MIT — see [LICENSE](LICENSE).
