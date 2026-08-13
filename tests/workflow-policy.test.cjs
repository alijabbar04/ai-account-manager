const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function assertOnlyContentsRead(workflow) {
  const normalized = workflow.replaceAll("\r\n", "\n");
  assert.equal([...normalized.matchAll(/^\s*permissions:/gm)].length, 1);
  assert.match(normalized, /^permissions:\n  contents: read\n\njobs:/m);
}

test("workflows pin every action and retain finite read-only authority", () => {
  const testWorkflow = read(".github/workflows/test.yml");
  const releaseWorkflow = read(".github/workflows/release.yml");
  const combined = `${testWorkflow}\n${releaseWorkflow}`;
  const uses = (workflow) =>
    [...workflow.matchAll(/^\s*- uses:\s+([^\s#]+)/gm)].map(
      (match) => match[1],
    );
  const checkout =
    "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1";
  const setupNode =
    "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020";
  assert.deepEqual(uses(testWorkflow), [checkout, setupNode]);
  assert.deepEqual(uses(releaseWorkflow), [
    checkout,
    setupNode,
    "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
  ]);
  assert.equal(combined.includes("pull_request_target"), false);
  assertOnlyContentsRead(testWorkflow);
  assertOnlyContentsRead(releaseWorkflow);
  assert.match(testWorkflow, /node-version: 24/);
  assert.match(releaseWorkflow, /node-version: 24/);
  assert.match(testWorkflow, /npm ci --ignore-scripts/);
  assert.match(testWorkflow, /npm run audit/);
  assert.match(releaseWorkflow, /npm ci/);
  assert.match(releaseWorkflow, /npm run audit/);
  assert.match(releaseWorkflow, /npm run test:consumer/);
});

test("release refuses missing signing inputs and verifies one signed installer", () => {
  const workflow = read(".github/workflows/release.yml");
  const manifest = JSON.parse(read("package.json"));
  assert.match(
    workflow,
    /foreach \(\$name in 'CSC_LINK', 'CSC_KEY_PASSWORD', 'UPDATE_DOWNLOAD_URL'\)/,
  );
  assert.match(workflow, /\[string\]::IsNullOrWhiteSpace/);
  for (const name of [
    "CSC_LINK",
    "CSC_KEY_PASSWORD",
    "UPDATE_DOWNLOAD_URL",
  ]) {
    assert.ok(workflow.includes(name));
  }
  assert.match(workflow, /Get-AuthenticodeSignature/);
  assert.match(workflow, /Status -ne 'Valid'/);
  assert.match(workflow, /run: npm run package:win/);
  assert.equal(workflow.includes("run: npm run build:win"), false);
  assert.ok(
    workflow.indexOf("run: npm run test:consumer") <
      workflow.indexOf("secrets.WINDOWS_CERTIFICATE_BASE64"),
  );
  assert.match(workflow, /RELEASE_REF_TYPE: \$\{\{ github\.ref_type \}\}/);
  assert.match(workflow, /RELEASE_TAG: \$\{\{ github\.ref_name \}\}/);
  assert.match(workflow, /\$expectedTag = "v\$\(\$manifest\.version\)"/);
  assert.match(workflow, /\$env:RELEASE_REF_TYPE -cne 'tag'/);
  assert.match(workflow, /\$env:RELEASE_TAG -cne \$expectedTag/);
  assert.ok(
    workflow.indexOf("Require the exact package-version tag") <
      workflow.indexOf("npm ci"),
  );
  assert.ok(
    workflow.indexOf("Require the exact package-version tag") <
      workflow.indexOf("secrets.WINDOWS_CERTIFICATE_BASE64"),
  );
  assert.equal(
    manifest.scripts["package:win"],
    "electron-builder --win nsis --publish never",
  );
  assert.equal(
    manifest.scripts["build:win"],
    "npm run test && npm run package:win",
  );
  assert.match(workflow, /if-no-files-found: error/);
  assert.match(workflow, /retention-days: 7/);
});

test("the committed dependency graph uses the audited Electron line", () => {
  const manifest = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const readme = read("README.md");
  assert.equal(manifest.devDependencies.electron, "^43.4.0");
  assert.equal(manifest.scripts.audit, "npm audit --audit-level=high");
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages[""].devDependencies.electron, "^43.4.0");
  assert.equal(lock.packages["node_modules/electron"].version, "43.4.0");
  assert.match(readme, /Electron-43-/);
  assert.match(readme, /Node 24 is what the CI workflow uses/);
});
