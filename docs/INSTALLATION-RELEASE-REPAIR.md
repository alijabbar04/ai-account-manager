# Installation and release repair

Investigated on 12 October 2026 against `alijabbar04/ai-account-manager`, source
commit `1552624` (application 1.7.5). The separate `ai-account-manager-hub`
repository is a different rebuild and is not the target of this repair.

## Root causes and evidence

1. **Application version replacements also changed a transitive dependency.**
   The lock at `7ca3bc8` has valid `resedit@1.7.2`. Commit `424d970` changes it
   to 1.7.3, `67e2334` changes it to 1.7.4, and `1552624` changes it to 1.7.5,
   alongside the application version fields. The rest of the dependency tree
   does not change in these commits. This pattern is consistent with broad
   text replacement; Git history does not identify the external command used.
   No version-bumping script is checked into this repository. Application and
   dependency versions are unrelated.
2. **All 324 registry package entries lacked `resolved` and `integrity`.**
   The first v3 lockfile commit, `56d3122`, already lacks this metadata. The
   subsequent version commits preserve those omissions. With no tarball URL,
   npm resolves the corrupted `resedit@1.7.5` against the registry and raises
   ETARGET. Neither `npm ci` nor `npm install` can make that version exist.
3. **Setup recovered by changing the dependency tree.** It silently retried
   failed `npm ci` with `npm install`, which could rewrite the tracked lockfile
   and also fails with the same invalid version. Setup also accepted Node 20
   although the locked `@electron/rebuild` requires Node 22.12+, and did not
   check npm separately. Several native failures relied on later commands or
   file-existence checks instead of explicit exit handling.
4. **CI did catch the problem, but did not prevent it reaching `main`.**
   [The 1.7.5 Windows CI run](https://github.com/alijabbar04/ai-account-manager/actions/runs/37675462421)
   fails at `npm ci` with `resedit@1.7.5`, alongside cleanup EPERM warnings.
   The local original checkout reproduces that failure. GitHub's branch
   protection API reports **Branch not protected** for `main`; a failing check
   therefore cannot prevent a direct push. Required CI is an administrative
   setting, not something this patch silently changes.
5. **Source updates did not trigger installer releases.** The release workflow
   only publishes on a `v*` tag. A manual dispatch uploads artifacts but does
   not publish. No tags or release runs exist for 1.7.2–1.7.5. The latest
   public installer is [1.7.1](https://github.com/alijabbar04/ai-account-manager/releases/tag/v1.7.1),
   published 14 September 2026. Its release workflow succeeded. There was no
   automatic release for the October source commits.
6. **Release validation was incomplete.** Only the root application version
   was checked against a tag, checksums used an EXE wildcard, and installer
   existence, PE structure, embedded version, packaged feature files and
   manifest/checksum consistency were not all checked before upload.

## Dependency repair method

The valid 1.7.2 lock was used as a seed, and `npm install --package-lock-only
--ignore-scripts` synchronized the application version with the existing
1.7.5 manifests. npm's registry resolver (`pacote`) fetched the exact manifest
for every pinned package, and npm's lockfile writer (Arborist) regenerated the
v3 lock with registry tarball URLs and integrity digests. This was a one-time
repair in a scratch script, not a new project dependency-management system.

Comparison against `main` proves the only package-version change is
`resedit: 1.7.5 -> 1.7.2`. All 324 exact versions exist in the npm registry;
every package now has resolution and integrity metadata. Other dependency
versions, ranges and relationships are preserved. Actual `npm ci`, `npm install`
and `npm ls --all` succeed. A post-install check also compares installed
package manifests with locked versions, catching a manual version edit even
when its old resolved tarball URL still downloads successfully.

Future application versions use `npm run version:set -- <MAJOR.MINOR.PATCH>`.
The tool delegates the root/lock update to
[`npm version --no-git-tag-version`](https://docs.npmjs.com/cli/v11/commands/npm-version/),
updates only `app/package.json`'s version, checks every nested lock entry is
unchanged, and rolls the three files back if validation fails. It makes no
commit, tag or release. npm remains responsible for dependency resolution and
tarball integrity verification; no custom semantic dependency resolver is added.

## Setup and release behavior

- Setup works from its own directory even when invoked elsewhere, checks Node
  22.12+, `npm.cmd` and an actual .NET SDK 8+, requires the tracked lock, and
  runs only `npm ci`. All native commands have explicit exit checks. Failures
  report recovery steps for ETARGET, EPERM/EBUSY, proxy/TLS and execution policy.
  `-SkipTests` explicitly reports that the checkout has not been validated.
- A missing Electron executable is repaired only after checking its cached
  archive against the published SHA-256. No unchecked archive is expanded and
  no unrelated app is terminated by the build script.
- CI builds the actual NSIS installer, runs the JavaScript/native tests, checks
  packaged source and resources byte for byte, checks the installer's Windows
  product version, and smoke-tests the bootstrap with mocked network/process
  calls and the actual built EXE. It uploads reviewable artifacts and failure
  diagnostics from the configured npm cache directory.
- Release builds check root, app and both lockfile application versions against
  the release tag. A manifest and exact SHA-256 entries are generated from the
  installer and bootstrap; corruption, wrong URLs or missing files stop upload.
  Existing annotated-tag notes and optional signing are preserved.
- Tag builds prepare a **draft release** with the installer, `latest.json`,
  `SHA256SUMS.txt` and `install.ps1`. They never publish publicly by themselves.
  Manual dispatch prepares artifacts without a tag or release. Already public
  release versions cannot be overwritten through this workflow.

## Installation instructions

After the PR is merged, users can run:

```powershell
irm https://raw.githubusercontent.com/alijabbar04/ai-account-manager/main/scripts/install.ps1 | iex
```

The script selects the official latest published stable release, requires the
exact versioned official asset URLs, rejects missing/duplicate checksum entries,
decodes GitHub's binary-served text assets correctly under PowerShell 5.1,
validates the manifest, SHA-256, size and embedded installer version, preserves
the Internet-zone marker, and starts the normal interactive installer. It
checks the registered installation and installed executable version before
reporting success. Download errors, cancellation and verification failures do
not report successful installation. Network reads have bounded retries.

Users do not need Git, Node.js or .NET to install this self-contained application.
Provider tools remain separate and optional/required as documented. No account
storage paths, sign-in mechanisms, settings or encrypted credentials change.
The bootstrap and checksums are trusted through the official GitHub repository
over HTTPS, not an independent signing authority. Defender and SmartScreen stay
enabled. Optional code signing remains supported.

The command installs 1.7.1 until a newer stable release is explicitly approved
and published. The generated local 1.7.5 manifest points to a future release URL;
that URL is not live and is not claimed to be a published release.

## Validation actually executed

Environment: Windows 11 Pro 10.0.26200, Windows PowerShell 5.1.26100.9549,
Node 22.23.3/npm 10.9.9, .NET SDK 8.0.425. Node and the SDK were prepared as
temporary workspace toolchains; system installations were not replaced.

| Check | Result |
|---|---|
| Original clean dependency install | Reproduced ETARGET for `resedit@1.7.5` |
| Exact registry validation | All 324 packages validated; only resedit's version repaired |
| Repaired `npm ci` and full `setup.ps1` | Passed on Windows 11 and PowerShell 5.1 |
| `npm install`; `npm ls --all` | Passed; valid dependency tree |
| `verify:dependencies` | All 324 installed versions match their lock entries |
| Final JavaScript/PowerShell suite | 109 passed, zero failed or skipped |
| Runtime verification | Passed |
| Native automation tests | 18/18 passed |
| Native harness build | Passed, zero warnings/errors |
| Self-contained native helper publication | Passed |
| Windows NSIS installer build | Passed; embedded ProductVersion 1.7.5 |
| Packaged runtime, UI, Antigravity assets and resources | Byte-for-byte checks passed |
| Installer smoke with actual 1.7.5 EXE | Passed; mocked GitHub/network/process and cancellation |
| Live official GitHub bootstrap, download-only | Passed for 1.7.1; real SHA-256 and ProductVersion checked; not installed |
| Real Electron renderer smoke | Dashboard passed, including Antigravity, provider launch actions and plan updates; mocked provider data |
| Real Windows DPAPI/safeStorage continuity | All four end-to-end cases passed in isolated test directories |
| Electron recovery from a missing executable | Verified archive extracted; recovered executable matches original SHA-256 |
| Formatting and `git diff --check` | Passed |
| actionlint 1.7.12 | CI, release and security workflows passed |
| Public release/tag creation | Not performed |
| Interactive NSIS installation on a fresh PC | Not performed; required before publication |

During development, a transient live-download connection failure was observed;
the corrected bootstrap later verified the real release. A Windows path-separator
error in the new package checker and a PowerShell mock/module-loading issue in
the new test harness were corrected; the final build and tests pass.

## Files changed

| File(s) | Purpose |
|---|---|
| `package-lock.json` | Restore resedit and all registry/integrity metadata |
| `package.json` | Add verification/version commands and checked package builds |
| `setup.ps1` | Deterministic install, prerequisite/exit checks and diagnostics |
| `build/build.ps1` | Avoid unrelated process termination; reject stale output; verify installer and bootstrap |
| `scripts/ensure-electron.cjs` | Verified Windows Electron extraction recovery |
| `scripts/verify-dependencies.cjs` | Compare installed versions against locked versions |
| `scripts/set-version.cjs` | npm-backed application version updates without dependency edits or tags |
| `scripts/release-lib.cjs`, `scripts/verify-release.cjs`, `scripts/make-manifest.cjs` | Version, PE, manifest, URL and checksum generation/validation |
| `scripts/verify-installer.ps1`, `scripts/verify-packaged.cjs` | Embedded Windows version and complete packaged-resource checks |
| `scripts/install.ps1` | Standalone official stable-release installation |
| `.github/workflows/ci.yml`, `.github/workflows/release.yml` | Build/review actual installers and prepare approval-gated drafts |
| `tests/release-tooling.test.cjs`, `tests/setup-failures.test.cjs`, `tests/install-smoke.ps1`, `tests/powershell-compat.test.cjs` | Regression tests and actual PowerShell 5.1 parsing |
| `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/INSTALL.md`, `docs/TROUBLESHOOTING.md`, this report | Installation, versioning, release approval and repair documentation |

`app/package.json` and all application runtime, UI and authentication/storage
code are unchanged. Packaging checks verify that the current 1.7.5 runtime,
including Antigravity integration, reaches the installer intact.

## Remaining limits and publication checklist

### Release-readiness review follow-up

Independent review of PR #16 found two remaining issues before merge:

1. The existing v1.7.1 uninstaller deletes `automation/session-profiles.json`
   even on upgrade. The new installer now preserves that metadata in a durable
   backup beside the original before invoking the legacy uninstaller, restores
   it only if removed, and attempts restoration if installation fails. Future
   uninstallers preserve durable profile metadata; only transient locks are
   removed. App-data deletion is explicitly disabled and upgrade cleanup retains
   start-at-login registration. Other account, credential, settings and vault
   files are not copied or changed by these hooks.
2. The built application has Windows ProductVersion `1.7.5.0`, equivalent to
   npm version `1.7.5`. The standalone script's exact comparison would reject
   installation success. It now accepts only the expected version or its zero
   revision form; other versions and nonzero revisions still fail.

Build validation now extracts the actual NSIS EXE's application payload and
compares its full runtime, UI and resources with source, including application
identity and version. Four compiled NSIS hook scenarios use only isolated
synthetic data/registry paths: fresh setup, legacy upgrade, failed upgrade, and
uninstall preservation. These are actual hook executions, not full application
installations. The installer script also tests real built application version
resources with mocked registry metadata.

Windows Sandbox, VirtualBox and QEMU were unavailable during this review. A
complete isolated interactive installation/launch/uninstall on a fresh Windows
profile is therefore not claimed. No production install was attempted on the
developer's real profile, and no real account credentials were used.

- Require the Windows CI `test-and-package` status on `main` through repository
  branch protection. No repository administration setting was changed here.
- The installer is unsigned in this environment; SmartScreen behavior and signing
  with repository secrets were not tested. Electron 37 remains an older runtime;
  unrelated dependency upgrades are deliberately outside this focused repair.
- `npm audit` reports 16 build-toolchain findings (8 moderate, 8 high).
  `npm audit --omit=dev` reports zero production dependency findings. The npm
  audit does not certify the Electron runtime or the complete shipped application.
- A real fresh-PC interactive installation, upgrade with real user accounts,
  real provider logins/quota calls, notification delivery, proxy-specific setups
  and certificate signing remain to be tested. Existing isolated automated
  checks pass; those unperformed real-world checks are not represented as passed.
- Run the reviewed release workflow after merge to inspect artifacts. Only
  after explicit approval, create the version tag for the reviewed commit,
  smoke-test the draft installer on a fresh PC, confirm all four assets and
  their checksums, and explicitly publish the draft. No tag, draft release or
  public release is created by this task.
