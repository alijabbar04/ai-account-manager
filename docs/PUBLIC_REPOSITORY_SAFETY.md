# Public repository safety checkpoint

Date: 2026-08-13

The repository became public before this checkpoint. A read-only,
content-aware scan covered every blob reachable from the two public branches
and tag `v1.4.1`, the current trees, both workflow files, and the published
Windows release asset. Candidate values were classified without printing them.

## Result

- No committed credential, private key, refresh/session token, private profile
  or usage store, local database, environment file, raw Account Manager state,
  or user-specific private path was found.
- Historical token-shaped strings are non-live test/UI canaries. The UUID in
  the runtime and architecture documentation is a public OAuth client
  identifier. Windows paths in documentation and UI are generic examples.
- The two PDF revisions contain no high-confidence secret or private-path
  finding.
- The `v1.4.1` installer is 92,755,146 bytes and matched GitHub's published
  SHA-256 digest
  `e0e2b709bd42843cfb2294d327000bbacc28559e164fae7b20938657a8d74432`.
  Its complete archive and ASAR inventories were extracted without execution;
  no local-record filename or credential pattern was found. The installer is
  not Authenticode-signed.
- The reserved reader workflow rerun `31549101139`, attempt 2, acquired a
  Windows runner and passed at exact head
  `5279113728a344a87a7e49c4222741a618b67dd5`: 15/15 tests and the packed
  fresh-consumer check succeeded.

The scan is static and bounded to reachable repository objects and the one
published release asset. It does not prove that unrelated forks, caches, local
machines, or future settings are safe, and it is not a provider-side credential
validity check. No history rewrite was needed or performed.

## Workflow and repository hardening

At scan time, default workflow token permissions were read-only and the test
workflow used pinned actions. The repository had no configured Actions secrets,
variables, or environments. However, `main` had no branch protection; Actions
allowed every action without required SHA pinning; and secret scanning, push
protection, validity checks, Dependabot alerts/updates, and code scanning were
disabled.

This branch pins the test and release actions to exact current revisions,
migrates the release job to a committed npm lockfile, gives the release workflow
explicit read-only repository permissions, bounds artifact retention, upgrades
Electron past the reported high-severity advisories, and enforces a high-severity
audit gate. Repository settings are intentionally unchanged because they require
separate operator authorization. Recommended settings are:

1. enable secret scanning, push protection, and validity checks;
2. enable Dependabot alerts/security updates and code scanning;
3. require action SHA pinning and restrict allowed actions to reviewed sources;
4. protect `main` with required exact CI and review; and
5. configure signing/update secrets only after the release workflow and
   protected environment are reviewed.
