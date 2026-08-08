# Skills Sync

Skills Sync keeps a curated set of Claude Code **skills** identical across every
Claude profile on this machine (`~/.claude` and every `~/.claude-*`).

It is a thin, safe front-end over the **AI Environment Manager** engine
(`AIEnvironmentManager.exe`) — AI Account Manager never touches skill files
itself; it asks the engine to, so all the safety guarantees live in one place.

## The curated skill set

| Skill | What it does |
|---|---|
| superpowers | Workflow orchestrator — plan → delegate → verify for multi-step tasks |
| claude-mem | Persistent project memory across sessions (`.claude-mem/`) |
| find-skills | Discover, validate and install skills |
| task-observer | Track execution and detect drift from the original request |
| code-review | Systematic defect-first code review |
| security-review | Security review by attack surface with exploit scenarios |
| test-generator | Behaviour-focused automated tests in the project's framework |
| architecture-review | Boundaries, dependencies, failure modes, evolution risk |
| documentation-writer | READMEs, guides, API refs, changelogs — verified against code |
| git-release-assistant | Clean commits, SemVer, changelogs, tagging, release packaging |

## Using it

1. Open **Skills Sync** in the sidebar (under *Claude Code*).
2. The **deployment matrix** shows each skill × each profile:
   - **up to date** — identical to the library copy
   - **missing** — not installed in that profile
   - **outdated** — an older version is installed
   - **newer here** / **modified** — the profile has a newer or locally changed copy (protected)
3. **Install all skills to all profiles** deploys/updates everywhere. Or use a row's **Sync**
   button to push one skill to every profile.
4. **Run audit** triggers a full environment audit (writes `AI_ENVIRONMENT_REPORT.md`).
5. **Open full app** launches AI Environment Manager for backups, restore, MCP and CLAUDE.md tools.

## Safety

Every operation goes through the AI Environment Manager engine, which:
- backs up any existing copy before overwriting it,
- verifies every copied file by SHA-256 after writing,
- **never** overwrites a profile's newer or locally modified skill unless you explicitly force it,
- rolls back automatically if a copy fails verification.

## Requirements

Skills Sync needs **AI Environment Manager** installed. It is auto-detected at:

- `Desktop\AI Environment Manager\AIEnvironmentManager.exe`
- `%LOCALAPPDATA%\Programs\AI Environment Manager\AIEnvironmentManager.exe`

If it isn't found, the section shows an install prompt with a retry button.

## How it works (for maintainers)

- `electron/lib/skillsSync.ts` locates the engine and calls its JSON CLI verbs
  (`--skills-status --json`, `--install-skills --json`, `--audit`), parsing the results.
- IPC handlers (`skills:overview`, `skills:install`, `skills:audit`, `skills:openApp`) are
  registered in `electron/lib/ipc.ts` and exposed on `window.cam.skills` via `electron/preload.ts`.
- `src/views/SkillsSyncView.tsx` renders the matrix and actions using the shared theme tokens.
