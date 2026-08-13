# Supported read-only usage reader

AI Account Manager 1.4.1 includes a versioned, body-only usage reader for local
automation. It is independent of the Electron UI and is the only supported
external interface for reading the app's cached Claude quota observations.

The reader is deliberately narrow:

- input is one JSON request on standard input;
- output is one JSON envelope on standard output;
- the caller supplies the absolute `ClaudeAccountManager` data directory and an
  explicit opaque profile allowlist;
- only `profiles.json` and `usage-snapshots.json` are opened, each with a 1 MiB
  ceiling;
- one requested profile is returned with normalized five-hour and weekly
  windows, each explicitly active or inactive;
- a successful provider refresh is labelled `provider-authoritative`; retained
  limits after a failed refresh are labelled `provider-cached` and low
  confidence; and
- errors contain only a finite code and fixed message. Paths, account names,
  provider bodies, credentials, cookies, sessions, prompts, and response bodies
  are never returned.

The reader never refreshes data. It has no credential, Electron, child-process,
environment-variable, HTTP, or socket capability. It rejects UNC and device
paths before filesystem access. The caller must still ensure that the supplied
directory is on a trusted local volume rather than a mapped or remotely mounted
filesystem. Running it therefore does not prove that a profile is currently
authorized. The request's ownership,
authorization, and revocation fields are explicitly labelled
`caller-allowlist`; a consuming system must independently authorize and match
them before using the observation for dispatch.

## Interface

Run from a reviewed checkout or an explicitly packed source tarball (this is
not an external executable installed by the Electron/NSIS application):

```powershell
Get-Content .\reader-request.json -Raw |
  node .\reader\usage-reader-cli.cjs
```

Request schema version 2:

```json
{
  "schemaVersion": 2,
  "dataDirectory": "C:\\Users\\example\\AppData\\Roaming\\ClaudeAccountManager",
  "requestedProfileId": "opaque-profile-id",
  "profileAllowlist": [
    {
      "profileId": "opaque-profile-id",
      "providerId": "claude-code",
      "ownership": "owned",
      "authorization": "authorized",
      "revocation": "not-revoked"
    }
  ],
  "freshnessMs": 300000
}
```

Success is an exact envelope of this form (timestamps and opaque IDs vary):

```json
{
  "schemaVersion": 2,
  "ok": true,
  "result": {
    "schemaVersion": 2,
    "reader": {
      "readerId": "ai-account-manager.usage-reader",
      "protocolVersion": 2,
      "runtimeVersion": "1.4.1",
      "repositoryUrl": "https://github.com/alijabbar04/ai-account-manager.git",
      "configurationFingerprint": "<lowercase SHA-256>"
    },
    "requestedProfileId": "opaque-profile-id",
    "profile": {
      "scopedProfileId": "opaque-profile-id",
      "providerId": "claude-code",
      "ownership": "owned",
      "authorization": "authorized",
      "revocation": "not-revoked",
      "authorityEstimate": "caller-allowlist"
    },
    "observation": {
      "observationId": "am-usage:<40 lowercase hex>",
      "sourceClass": "provider-authoritative",
      "confidence": "high",
      "timezone": "Europe/London",
      "observedAt": "2026-08-12T00:00:00.000Z",
      "freshUntil": "2026-08-12T00:05:00.000Z",
      "fiveHour": {
        "windowId": "claude-code:five-hour:<reset timestamp>",
        "status": "active",
        "usedBasisPoints": 1234,
        "remainingBasisPoints": 8766,
        "resetAt": "2026-08-12T04:00:00.000Z"
      },
      "weekly": {
        "windowId": "claude-code:weekly:<reset timestamp>",
        "status": "active",
        "usedBasisPoints": 5500,
        "remainingBasisPoints": 4500,
        "resetAt": "2026-08-17T00:00:00.000Z"
      }
    }
  }
}
```

`ownership`, `authorization`, and `revocation` retain the exact allowlist enum
supplied for that profile. A successful refresh is
`provider-authoritative`/`high`; retained limits after a failed refresh are
`provider-cached`/`low`. An active window has integer usage values from 0
through 10,000, used plus remaining equals 10,000, and its reset follows the
observation time. An inactive required window is exactly:

```json
{
  "windowId": "claude-code:five-hour:inactive",
  "status": "inactive",
  "usedBasisPoints": null,
  "remainingBasisPoints": null,
  "resetAt": null
}
```

Account Manager may cache a zero placeholder when the provider omits inactive
capacity. Protocol 2 validates any supplied placeholder but never exposes it as
usage: inactive means unavailable and non-allocatable, not zero usage. A
bounded inactive `weekly_scoped` or other unrelated kind does not replace or
invalidate the one required `weekly_all` window. Duplicate required kinds,
malformed activity flags, or active windows without exact capacity/reset data
fail closed. `freshUntil` is capped by configured freshness and the earliest
active reset; inactive windows do not invent a reset.

Failure is `{ "schemaVersion": 2, "ok": false, "error": { "code", "message" } }`
and uses a non-zero exit status. The library surface is exported as
`ai-account-manager-desktop/usage-reader` for callers that already provide a
trusted in-process boundary.

The protocol fixes `readerId` to `ai-account-manager.usage-reader`,
`protocolVersion` to `2`, `runtimeVersion` to `1.4.1`, provider to `claude-code`,
and timezone to `Europe/London`. A SHA-256 configuration fingerprint binds the
canonical store directory, full allowlist, and freshness policy without
returning the directory itself. Inputs, files, profiles, allowlist entries,
limits, identifiers, timestamps, and freshness are all bounded and malformed,
duplicate, missing, future, contradictory, linked, or oversized sources fail
closed.

This interface does not expose Codex usage, API-key analytics, profile names,
profile directories, or any account-session material.

In-process callers may use `createScopedUsageReader(configuration)`. Its frozen
result exposes the same reader identity plus
`readScopedUsage(profileId, request?): Promise<result>`, so consumers do not
need an application-specific wrapper around the supported module. Optional
`request` is exactly `{ signal: AbortSignal, deadline: ISO-8601 timestamp }`.
The implementation yields before bounded synchronous file parsing and refuses
an aborted or expired request before and after that read; it does not claim
preemptive interruption inside a synchronous handle read.

## Exact limits

- CLI standard input: 64 KiB UTF-8.
- Request and each decoded source: 4,096 structural nodes/members, depth 64.
- Data-directory string: 3–1,024 code units; UNC/device roots are refused.
- `profiles.json` and `usage-snapshots.json`: 1 MiB each, regular handle-bound
  files with stable identity; invalid UTF-8 and duplicate JSON keys are refused.
- Allowlist: 1–64 unique entries; profile store/snapshot map: at most 256
  profiles; limits for the selected snapshot: at most 64.
- Opaque IDs: at most 128 ASCII identifier characters; limit kinds and
  timestamp/deadline strings: at most 64 code units.
- Freshness: 1,000–900,000 milliseconds. Observation time may be at most one
  second ahead of the reader clock. All dates must fit the ECMAScript Date
  range and round-trip exactly to ISO-8601.
- Provider failure text accepted from the local cache: 1–256 code units and
  never returned. Public failures contain only a closed code and fixed message.
