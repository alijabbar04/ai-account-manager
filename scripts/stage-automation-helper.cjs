"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "automation", "artifacts", "win-x64");
const executable = path.join(output, "AIAccountManager.Automation.exe");
const sourceCatalog = path.join(
  root,
  "automation",
  "selectors",
  "automation-selectors.v1.json",
);
const packagedCatalog = path.join(output, "automation-selectors.v1.json");

assert.ok(fs.existsSync(executable), "Published automation helper is missing");
assert.ok(
  fs.statSync(executable).size > 10 * 1024 * 1024,
  "Published helper is not the self-contained single-file executable",
);

const catalog = JSON.parse(fs.readFileSync(sourceCatalog, "utf8"));
assert.equal(catalog.schemaVersion, 1, "Unsupported selector schema");
assert.ok(catalog.revision, "Selector revision is required");
assert.ok(
  catalog.providers.every((provider) => provider.liveEligible === false),
  "A live-eligible selector requires separate reviewed live-test evidence",
);

fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(sourceCatalog, packagedCatalog);
assert.deepEqual(
  JSON.parse(fs.readFileSync(packagedCatalog, "utf8")),
  catalog,
  "Staged selector catalog did not round-trip",
);

process.stdout.write(
  `Staged automation helper and selector revision ${catalog.revision}.\n`,
);
