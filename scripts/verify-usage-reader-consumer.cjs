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
  const probe = [
    'const assert = require("node:assert/strict");',
    'const reader = require("ai-account-manager-desktop/usage-reader");',
    'assert.equal(typeof reader.createScopedUsageReader, "function");',
    'assert.match(require.resolve("ai-account-manager-desktop"), /main\\.cjs$/);',
  ].join("");
  run(process.execPath, ["-e", probe], consumerDirectory);
  const audit = JSON.parse(
    run(process.execPath, [npmCli, "audit", "--json"], consumerDirectory),
  );
  assert.equal(audit.metadata.vulnerabilities.total, 0);
  process.stdout.write("Packed usage-reader consumer verification passed.\n");
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
