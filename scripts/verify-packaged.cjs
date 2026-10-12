"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const asar = require("@electron/asar");
const { verifyVersion, inspectPE } = require("./release-lib.cjs");
const root = path.resolve(__dirname, "..");
const version = verifyVersion(root);
const resources = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, "release/win-unpacked/resources");
const archive = path.join(resources, "app.asar");
const packaged = JSON.parse(asar.extractFile(archive, "package.json"));
assert.equal(
  packaged.version,
  version,
  "Packaged application version mismatch",
);
// Verify that the source-of-record runtime and UI were packaged without omissions.
function verifyDirectory(relative) {
  for (const entry of fs.readdirSync(path.join(root, "app", relative), {
    withFileTypes: true,
  })) {
    const file = path.join(relative, entry.name);
    if (entry.isDirectory()) verifyDirectory(file);
    else
      assert.deepEqual(
        asar.extractFile(archive, file),
        fs.readFileSync(path.join(root, "app", file)),
        `Packaged file differs: ${file}`,
      );
  }
}
verifyDirectory("dist-electron");
verifyDirectory("dist");
for (const [source, target] of [
  ["assets/USAGE_TRACKING_GUIDE.pdf", "USAGE_TRACKING_GUIDE.pdf"],
  ["scripts/install-prerequisites.ps1", "install-prerequisites.ps1"],
  ["build/icon.ico", "icon.ico"],
  [
    "automation/selectors/automation-selectors.v1.json",
    "automation/automation-selectors.v1.json",
  ],
]) {
  assert.deepEqual(
    fs.readFileSync(path.join(resources, target)),
    fs.readFileSync(path.join(root, source)),
    `Missing or incorrect resource: ${target}`,
  );
}
inspectPE(
  path.join(resources, "automation/AIAccountManager.Automation.exe"),
  10 * 1024 * 1024,
);
console.log(
  `Packaged ${version}: runtime, UI, helper, selectors and resources verified.`,
);
