"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function verifyInstalledPackages(root, lock) {
  let count = 0;
  for (const [location, entry] of Object.entries(lock.packages)) {
    if (!location || entry.link) continue;
    const file = path.join(root, location, "package.json");
    if (!fs.existsSync(file) && entry.optional) continue;
    assert.ok(
      fs.existsSync(file),
      `Dependency missing: ${location}. Run npm ci.`,
    );
    const installed = JSON.parse(fs.readFileSync(file, "utf8"));
    // npm may trust the lock's resolved URL even if someone manually changes its version.
    assert.equal(
      installed.version,
      entry.version,
      `Installed version disagrees with lockfile: ${location}`,
    );
    count++;
  }
  return count;
}
if (require.main === module) {
  const root = path.resolve(__dirname, "..");
  const lock = JSON.parse(
    fs.readFileSync(path.join(root, "package-lock.json"), "utf8"),
  );
  console.log(
    `Verified ${verifyInstalledPackages(root, lock)} installed package versions against the lockfile.`,
  );
}
module.exports = { verifyInstalledPackages };
