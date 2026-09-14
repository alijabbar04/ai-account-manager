// End-to-end proof that renaming the product does not orphan the API key vault.
//
// Electron keeps the safeStorage (DPAPI) master key in "Local State" under
// userData, and userData is derived from productName. This drives real Electron
// and real Windows DPAPI through three cases:
//
//   1. encrypt under the OLD product name;
//   2. decrypt under the NEW product name WITHOUT the continuity module - must
//      fail, otherwise the test proves nothing;
//   3. decrypt under the NEW product name WITH it - must succeed.
//
// Windows-only, and not part of `npm test`: it needs a desktop session and a
// user DPAPI profile. Run it after touching safe-storage-continuity.cjs.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const probe = path.join(root, "scripts", "safestorage-probe.cjs");
const electron = path.join(
  root,
  "node_modules",
  "electron",
  "dist",
  "electron.exe",
);

if (process.platform !== "win32") {
  process.stdout.write("Skipped: Windows-only (DPAPI).\n");
  process.exit(0);
}
assert.ok(
  fs.existsSync(electron),
  "node_modules\electron is missing - run .\setup.ps1 first",
);

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "aam-safestorage-e2e-"));
const appDataRoot = path.join(sandbox, "Roaming");
const legacyDir = path.join(appDataRoot, "Claude Account Manager");
const renamedDir = path.join(appDataRoot, "AI Account Manager");
const controlDir = path.join(appDataRoot, "AI Account Manager (control)");
const blob = path.join(sandbox, "vault.bin");

function run(mode, userDataDir) {
  const env = { ...process.env };
  // Inherited by every shell this runs from; it turns electron.exe into a bare
  // Node binary and the probe would never reach app.whenReady().
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.NODE_OPTIONS;

  const out = spawnSync(
    electron,
    [probe, mode, userDataDir, appDataRoot, blob],
    { encoding: "utf8", env, timeout: 120000 },
  );
  const text = `${out.stdout || ""}${out.stderr || ""}`;
  const result = /RESULT=(\w+)/.exec(text);
  const adoption = /ADOPTION=([\w-]+)/.exec(text);
  assert.ok(result, `probe produced no result for "${mode}":\n${text}`);
  return { result: result[1], adoption: adoption && adoption[1] };
}

const cases = [];

// 1. Seal a secret under the old product name.
const sealed = run("encrypt", legacyDir);
assert.equal(sealed.result, "encrypted", "could not seal a probe secret");
assert.ok(
  fs.existsSync(path.join(legacyDir, "Local State")),
  "Electron did not write a Local State under the legacy product name",
);
cases.push("sealed a secret under the old product name");

// 2. Control: the rename really does break decryption on its own.
const control = run("decrypt", controlDir);
assert.equal(
  control.result,
  "failed",
  "the control decrypted without the legacy key - this test would prove nothing",
);
cases.push("confirmed a bare rename orphans the vault");

// 3. The continuity module repairs it.
const migrated = run("adopt-then-decrypt", renamedDir);
assert.equal(migrated.adoption, "copied", "the legacy key was not adopted");
assert.equal(
  migrated.result,
  "decrypted",
  "the vault stayed unreadable after adopting the legacy key",
);
cases.push("decrypted under the new product name after adoption");

// 4. The old install is untouched and a re-run is a no-op.
assert.ok(
  fs.existsSync(path.join(legacyDir, "Local State")),
  "the legacy key must survive so a rollback still works",
);
const rerun = run("adopt-then-decrypt", renamedDir);
assert.equal(rerun.adoption, "already-present", "adoption is not idempotent");
assert.equal(rerun.result, "decrypted");
cases.push("left the old install intact and stayed idempotent");

fs.rmSync(sandbox, { recursive: true, force: true });

for (const line of cases) process.stdout.write(`  PASS ${line}\n`);
process.stdout.write("safeStorage rename continuity verified.\n");
