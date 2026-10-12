"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");
const { stableVersion, verifyVersion } = require("./release-lib.cjs");
function setVersion(root, version) {
  assert.match(
    version ?? "",
    stableVersion,
    "Pass an explicit MAJOR.MINOR.PATCH version",
  );
  verifyVersion(root);
  const files = ["package.json", "package-lock.json", "app/package.json"];
  const original = files.map((file) => fs.readFileSync(path.join(root, file)));
  const oldLock = JSON.parse(original[1]);
  try {
    const cli = process.env.npm_execpath;
    assert.ok(cli, "Run this script with npm run version:set -- <version>");
    const result = spawnSync(
      process.execPath,
      [
        cli,
        "version",
        version,
        "--no-git-tag-version",
        "--ignore-scripts",
        "--allow-same-version",
      ],
      { cwd: root, stdio: "inherit" },
    );
    if (result.error) throw result.error;
    assert.equal(result.status, 0, "npm version failed");
    const app = JSON.parse(original[2]);
    app.version = version;
    fs.writeFileSync(
      path.join(root, files[2]),
      `${JSON.stringify(app, null, 2)}\n`,
    );
    const newLock = JSON.parse(fs.readFileSync(path.join(root, files[1])));
    const dependencies = (lock) =>
      Object.fromEntries(
        Object.entries(lock.packages).filter(([location]) => location),
      );
    assert.deepEqual(
      dependencies(newLock),
      dependencies(oldLock),
      "Version update changed dependency metadata",
    );
    verifyVersion(root);
  } catch (error) {
    files.forEach((file, index) =>
      fs.writeFileSync(path.join(root, file), original[index]),
    );
    throw error;
  }
  console.log(
    `Application version set to ${version}; dependencies unchanged. No commit or tag created.`,
  );
}
if (require.main === module)
  setVersion(path.resolve(__dirname, ".."), process.argv[2]);
module.exports = { setVersion };
