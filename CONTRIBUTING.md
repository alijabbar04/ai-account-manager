# Contributing

Thanks for looking. This is a small Windows-only desktop app, and it has one
unusual property you need to know before you change anything.

## Read this first: `app/` is the source, not build output

Versions 1.3.0 through 1.7.0 were produced by editing the app's built output
directly and repacking it. The original TypeScript/React project for those
releases no longer exists. What you see in `app/` is that runtime, recovered and
Prettier-formatted.

So:

- **Edit `app/dist-electron/main.cjs` and `app/dist/assets/index-*.js`
  directly.** Nothing compiles into `app/`. There is no build step that
  regenerates them.
- **Do not rename the renderer asset files.** `scripts/verify-runtime.cjs`
  asserts `index-CfQCNBzk.js` by name.
- **Run `npm run format` after editing.** Consistent formatting is what makes
  hand-editing a bundle tolerable at all.
- **`npm test` is the safety net.** `scripts/verify-runtime.cjs` asserts that
  specific IPC channels, Codex discovery paths, preload bridges, UI strings and
  product identifiers are still present. When it fails it is usually telling you
  that you deleted something another part of the app depends on.

New logic is better placed in a small, separately requirable `*.cjs` module
beside the bundle — `automation-domain.cjs`, `launcher-domain.cjs`,
`safe-storage-continuity.cjs` are the pattern — because those can be unit
tested normally. Moving named sections out of the bundle that way, one at a
time, is welcome.

## Getting set up

```powershell
git clone https://github.com/alijabbar04/ai-account-manager.git
cd ai-account-manager
.\setup.ps1
npm start
```

`setup.ps1` checks Node 20+ (22 is what CI uses) and a .NET 8+ SDK, installs
dependencies from the lockfile, repairs a missing Electron binary, and runs the
full suite so you know the checkout is sound before you touch it.

You also need [Claude Code](https://claude.com/claude-code) on your PATH for the
app to do anything useful at runtime. The Codex CLI is optional.

## The loop

1. **Branch.** `git checkout -b fix-codex-discovery`.
2. **Edit.** See above.
3. **`npm test`.** Unit tests, runtime verification, and the native helper
   suite. All three must pass.
4. **`npm run format:check`.** CI fails on formatting.
5. **Build and install once** with `.\build\build.ps1` if you touched packaging,
   `extraResources`, the PDF guide viewer, the installer, or anything
   version-related. A packaged build fails on things a dev run never exercises.
6. **Open a pull request.** Say what you changed and what you actually ran.

### Extra checks for particular areas

| If you touched | Also run |
|---|---|
| The product name, `userData`, or the API key vault | `npm run verify:safestorage` |
| The automation helper (`automation/`) | `npm run automation:test`, and `npm run automation:soak` for anything long-running |
| The session launcher | `pwsh tests/vscode-launch-smoke.ps1` |
| The installer or `extraResources` | `.\build\build.ps1`, then install it |

## Environment variables

There is no `.env` file and no `.env.example`, because the app does not read
one — it has no configuration to supply and no credential of its own. What
exists are a few optional process-environment overrides:

| Variable | Used by | For |
|---|---|---|
| `CLAUDE_CLI_PATH` | app | Point at a `claude.exe` when PATH does not carry it. Ignored if the path does not exist, so a stale value cannot mask a working install |
| `VSCODE_CLI_PATH` | app | Point at a `Code.exe` when discovery misses your install |
| `CODEX_CLI_PATH` | app | Same for the Codex CLI |
| `CAM_FAKE_PROVIDERS=1` | app | Serve mock provider data so the API views can be exercised without a real key or network call |
| `CAM_OPEN_GUIDE=1` | app | Open the bundled PDF guide window on launch |
| `CSC_LINK`, `CSC_KEY_PASSWORD` | `electron-builder` | Code-signing certificate and its password. Never committed; CI reads them from repository secrets |
| `UPDATE_DOWNLOAD_URL`, `RELEASE_NOTES` | `release:manifest` | Alternative to passing them as arguments |

Note that `CLAUDE_CONFIG_DIR` is something the app *sets* for the processes it
launches, not something it reads for itself.

## Two things that will catch you out

- **Kill any running copy before building or launching.** The app takes a
  single-instance lock, so a second instance quits immediately — which looks
  exactly like a crash.
- **Never point `CLAUDE_CONFIG_DIR` at the default `~\.claude` folder.** With
  the variable unset, Claude Code reads `.claude.json` from the home directory;
  set it explicitly to that folder and Claude Code looks *inside* it instead and
  forks fresh state. The app already handles this — don't undo it.

## Things that must not change casually

- **`%APPDATA%\ClaudeAccountManager` is the data root.** It is deliberately not
  named after the product. Renaming it makes every existing install look freshly
  installed: no accounts, no settings, no API keys. Nothing is deleted, but
  nothing loads either.
- **The safeStorage key adoption in `safe-storage-continuity.cjs` runs before
  `app.whenReady()`.** Move it later and Chromium has already initialised OSCrypt
  with the wrong key, and every stored API key becomes undecryptable.
- **"Claude" is usually the provider, not the app.** `Anthropic (Claude)`,
  "Claude Code usage" and "Claude account" are correct as written. Only strings
  naming *this application* are branded "AI Account Manager".

## Never commit

Credentials of any kind — API keys, OAuth or refresh tokens, cookies, session
values, certificates, private keys — plus your own account data, real
screenshots showing account names or usage figures, local databases, and
absolute paths containing your username. `.gitignore` covers the usual
locations, and Gitleaks runs on every push and pull request, but neither is a
substitute for looking at your own diff.

If a real secret does reach a commit, say so in the pull request rather than
quietly force-pushing over it, and rotate the credential with the provider. See
[SECURITY.md](SECURITY.md).

## Style

Prettier decides formatting; `npm run format` applies it. Beyond that, match the
surrounding code. Comments should explain why something is the way it is —
especially anything that looks wrong but is deliberate. Several of the sharpest
edges in this codebase are documented exactly that way, and they are the reason
it still works.
