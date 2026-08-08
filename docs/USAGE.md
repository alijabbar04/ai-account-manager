# AI Account Manager — Usage Guide

## The mental model

Every Claude Code account on your machine is just a **folder** (its
`CLAUDE_CONFIG_DIR`), containing that account's login session, settings, and history.
This app is a dashboard over those folders: it registers them as named profiles,
shows each one's live usage, and launches tools *pointed at* the right folder.
It never moves, merges, or copies credentials.

## Adding accounts

### Import the account you already have

*Add account → Import existing* → Browse to `C:\Users\<you>\.claude` → name it (e.g.
"Personal"). Your current session appears immediately with live usage. Nothing is
moved — the folder is used exactly where it is.

### Create a brand-new account

1. *Add account → Create new* → give it a name ("Work Max"). A fresh folder like
   `C:\Users\<you>\.claude-work-max` is created and registered.
2. Leave *Open the login terminal now* ticked. A terminal opens bound to the new
   profile, running `claude auth login`.
3. Your browser opens Anthropic's sign-in. Use **Continue with Google** or an
   Anthropic email login — whatever that account uses. Passwords stay in the browser;
   the app never sees them.
4. When sign-in completes, the card flips to 🟢 automatically and usage loads.

Repeat for as many accounts as you want — there is no limit.

## The dashboard

Each card shows:

| Element | Meaning |
|---|---|
| ● dot + status pill | 🟢 Active · 🟡 Usage high · 🔴 Rate limited / re-login needed · ○ Logged out |
| Identity line | email · plan (Team / Max / Pro…) · organization |
| **Session (5h)** | rolling 5-hour window usage with reset countdown |
| **Weekly · all models** | the 7-day all-model limit |
| **Weekly · Fable/Opus…** | the model-scoped weekly limit, when your plan has one |
| Extra usage | purchased-credit spend, in your billing currency |
| Meta line | last local activity · sessions this week · when usage was last fetched |

Values are **exact** — fetched from Anthropic's usage API with each account's own
token (the same numbers `/usage` shows inside Claude Code). Usage refreshes every
5 minutes, when the window regains focus, and on ↻ Refresh. If an account's token has
expired, the app refreshes it the same way the CLI does; if that fails (revoked
elsewhere), the card says **Re-login needed** — use the card menu → *Re-login…*.

When the API is unreachable (offline), cards keep the last known values with an
"updated … ago" stamp and add a clearly-labeled *local estimate* derived from your
transcript files.

## Launching things

| Button | What you get |
|---|---|
| **Open Claude** | A terminal tab (Windows Terminal when available) already bound to the account, running `claude`. |
| **PowerShell** | The same bound terminal, without starting Claude — for `claude -p`, scripts, anything. |
| **VS Code** | VS Code launched with the account's environment, so the integrated terminal and the Claude Code extension use it. ⚠ If VS Code is *already running*, Windows hands the new window to the existing process and the environment does **not** apply — close VS Code first, or prefer terminal launches. |

Launch as many accounts as you like at the same time; sessions are fully independent.
Every bound terminal prints which account it is using, and its tab is titled
`Claude — <account>`.

## Set Default

*Set Default* writes `CLAUDE_CONFIG_DIR` as a **user-level environment variable**, so
every *new* terminal (and anything else you start afterwards) uses that account even
outside this app. The card shows a `Default` badge. Clear it from the same button/menu.

Notes:
- Already-open terminals keep their old environment (Windows behavior).
- Making your original `~\.claude` profile the default simply *clears* the variable —
  that folder is what Claude Code uses when the variable is absent. (Pointing the
  variable at `~\.claude` explicitly would make Claude Code fork its config state;
  the app avoids this for you.)

## Managing accounts

- **Rename** — card menu → *Rename…* (display name only; the folder doesn't change).
- **Open config folder** — card menu, for inspecting the profile directory.
- **Remove** — card menu → *Remove…*. By default the profile is only unregistered;
  tick the checkbox to also delete the folder (that signs the account out locally and
  deletes its local history — the confirmation spells this out).
- **Export** — top bar → *Export* writes a JSON list of names + folder paths. It
  contains **no credentials**; on another machine, imported profiles start logged out
  until you run their login.
- **Search** — filters by name, email, organization, or folder path.
- **Theme** — the ◐/☀/☾ button cycles system / light / dark.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Card says *Logged out* after login finished | The watcher polls every 2 s — give it a moment, or press ↻ Refresh. |
| *Re-login needed* | Card menu → *Re-login…* and complete the browser sign-in. Happens when the session was revoked or the refresh token rotated on another machine. |
| VS Code opened with the wrong account | VS Code was already running (see caveat above). Close all VS Code windows and launch again from the card. |
| Usage shows *Offline or unreachable* | Network issue; last-known values remain. The app retries on the next poll. |
| `claude` not found in launched terminal | Ensure Claude Code is installed and on PATH (`claude --version` in a fresh terminal). |
