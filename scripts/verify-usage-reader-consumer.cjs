"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const temporaryRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "ai-account-manager-reader-consumer-"),
);
const npmCli = process.env.npm_execpath;
assert.equal(typeof npmCli, "string", "npm_execpath is required");
assert.equal(path.isAbsolute(npmCli), true, "npm_execpath must be absolute");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    windowsHide: true,
  });
  assert.equal(result.error, undefined, "Consumer command failed to start");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

try {
  const packDirectory = path.join(temporaryRoot, "pack");
  const consumerDirectory = path.join(temporaryRoot, "consumer");
  fs.mkdirSync(packDirectory);
  fs.mkdirSync(consumerDirectory);
  const packed = JSON.parse(
    run(
      process.execPath,
      [npmCli, "pack", "--json", "--pack-destination", packDirectory],
      root,
    ),
  );
  assert.equal(packed.length, 1);
  assert.equal(packed[0].entryCount, 13);
  assert.deepEqual(packed[0].bundled, []);
  assert.deepEqual(
    packed[0].files.map((file) => file.path),
    [
      "LICENSE",
      "README.md",
      "app/dist-electron/guide-viewer.html",
      "app/dist-electron/main.cjs",
      "app/dist-electron/preload.cjs",
      "app/dist/assets/index-CfQCNBzk.js",
      "app/dist/assets/index-DR09S7BQ.css",
      "app/dist/index.html",
      "app/package.json",
      "docs/USAGE_READER.md",
      "package.json",
      "reader/usage-reader-cli.cjs",
      "reader/usage-reader.cjs",
    ],
  );
  const archive = path.join(packDirectory, packed[0].filename);
  assert.equal(fs.lstatSync(archive).isFile(), true);
  fs.writeFileSync(
    path.join(consumerDirectory, "package.json"),
    JSON.stringify({ name: "usage-reader-consumer", private: true }),
  );
  run(
    process.execPath,
    [
      npmCli,
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      archive,
    ],
    consumerDirectory,
  );
  const storeDirectory = path.join(consumerDirectory, "store");
  fs.mkdirSync(storeDirectory);
  fs.writeFileSync(
    path.join(storeDirectory, "profiles.json"),
    JSON.stringify({ version: 1, profiles: [{ id: "profile-consumer" }] }),
  );
  fs.writeFileSync(
    path.join(storeDirectory, "usage-snapshots.json"),
    JSON.stringify({
      "profile-consumer": {
        fetchedAt: "2026-08-13T10:59:00.000Z",
        ok: true,
        limits: [
          {
            kind: "session",
            percent: 12,
            resetsAt: "2026-08-13T15:00:00.000Z",
          },
          {
            kind: "weekly_all",
            percent: 34,
            resetsAt: "2026-08-17T00:00:00.000Z",
          },
        ],
      },
    }),
  );
  const probe = [
    'const assert = require("node:assert/strict");',
    'const reader = require("ai-account-manager-desktop/usage-reader");',
    'assert.equal(typeof reader.createScopedUsageReader, "function");',
    'assert.equal(reader.READER_PROTOCOL_VERSION, 2);',
    'assert.match(require.resolve("ai-account-manager-desktop"), /main\\.cjs$/);',
    'const result = reader.readScopedUsage({schemaVersion:2,dataDirectory:process.argv[1],requestedProfileId:"profile-consumer",profileAllowlist:[{profileId:"profile-consumer",providerId:"claude-code",ownership:"owned",authorization:"authorized",revocation:"not-revoked"}],freshnessMs:300000},{now:()=>Date.parse("2026-08-13T11:00:00.000Z")});',
    'assert.equal(result.reader.protocolVersion, 2);',
    'assert.equal(result.observation.fiveHour.status, "active");',
    'assert.equal(result.observation.weekly.status, "active");',
  ].join("");
  run(process.execPath, ["-e", probe, storeDirectory], consumerDirectory);
  const audit = JSON.parse(
    run(process.execPath, [npmCli, "audit", "--json"], consumerDirectory),
  );
  assert.equal(audit.metadata.vulnerabilities.total, 0);
  process.stdout.write("Packed usage-reader consumer verification passed.\n");
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
