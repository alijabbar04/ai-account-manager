const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  LEGACY_USER_DATA_DIR_NAMES,
  planSafeStorageKeyAdoption,
  adoptLegacySafeStorageKey,
} = require("../app/dist-electron/safe-storage-continuity.cjs");

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aam-safestorage-"));
  return {
    root,
    appDataRoot: root,
    userDataDir: path.join(root, "AI Account Manager"),
    legacyDir: path.join(root, "Claude Account Manager"),
  };
}

function seedLocalState(dir, contents) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "Local State"), contents, "utf8");
}

test("the legacy product name is the one the app actually shipped under", () => {
  assert.deepEqual(LEGACY_USER_DATA_DIR_NAMES, ["Claude Account Manager"]);
});

test("a legacy key is adopted when the renamed directory has none", () => {
  const s = sandbox();
  seedLocalState(s.legacyDir, "legacy-master-key");

  assert.equal(adoptLegacySafeStorageKey(s), "copied");
  assert.equal(
    fs.readFileSync(path.join(s.userDataDir, "Local State"), "utf8"),
    "legacy-master-key",
  );
});

test("adoption copies rather than moves, so the old install still works", () => {
  const s = sandbox();
  seedLocalState(s.legacyDir, "legacy-master-key");

  adoptLegacySafeStorageKey(s);

  assert.ok(
    fs.existsSync(path.join(s.legacyDir, "Local State")),
    "the legacy Local State must survive - a failed upgrade must be recoverable",
  );
});

test("adoption is idempotent and never overwrites a live key", () => {
  const s = sandbox();
  seedLocalState(s.legacyDir, "legacy-master-key");
  seedLocalState(s.userDataDir, "current-master-key");

  assert.equal(adoptLegacySafeStorageKey(s), "already-present");
  assert.equal(
    fs.readFileSync(path.join(s.userDataDir, "Local State"), "utf8"),
    "current-master-key",
    "an existing key must win - overwriting it would orphan the current vault",
  );

  // Running twice in a row must also be a no-op.
  assert.equal(adoptLegacySafeStorageKey(s), "already-present");
});

test("a fresh install does nothing and reports why", () => {
  const s = sandbox();

  assert.equal(adoptLegacySafeStorageKey(s), "no-legacy-key");
  assert.equal(fs.existsSync(path.join(s.userDataDir, "Local State")), false);
});

test("a userData directory that is already the legacy one is left alone", () => {
  const s = sandbox();
  const sameDir = path.join(s.root, "Claude Account Manager");

  assert.equal(
    adoptLegacySafeStorageKey({
      appDataRoot: s.appDataRoot,
      userDataDir: sameDir,
    }),
    "no-legacy-key",
    "copying a file onto itself must not be attempted",
  );
});

test("failure is contained - startup is never blocked", () => {
  const s = sandbox();
  seedLocalState(s.legacyDir, "legacy-master-key");

  const result = adoptLegacySafeStorageKey({
    ...s,
    fs: {
      existsSync: fs.existsSync,
      mkdirSync: fs.mkdirSync,
      copyFileSync() {
        throw new Error("disk is full");
      },
    },
  });

  assert.equal(result, "failed");
  assert.ok(
    fs.existsSync(path.join(s.legacyDir, "Local State")),
    "a failed adoption must not have touched the legacy key",
  );
});

test("the plan never reads or reports the key material itself", () => {
  const s = sandbox();
  seedLocalState(s.legacyDir, "legacy-master-key");

  const plan = planSafeStorageKeyAdoption({
    userDataDir: s.userDataDir,
    appDataRoot: s.appDataRoot,
    exists: fs.existsSync,
    path,
  });

  assert.equal(plan.action, "copy");
  assert.deepEqual(Object.keys(plan).sort(), ["action", "from", "to"]);
  assert.ok(!JSON.stringify(plan).includes("legacy-master-key"));
});

test("the main process wires the adoption in before app.whenReady()", () => {
  const main = fs.readFileSync(
    path.join(__dirname, "..", "app", "dist-electron", "main.cjs"),
    "utf8",
  );

  const call = main.indexOf("adoptLegacySafeStorageKey({");
  // Match the call site, not the prose: a comment above it mentions whenReady.
  const ready = main.indexOf("app.whenReady().then(");

  assert.ok(call > 0, "main.cjs must call adoptLegacySafeStorageKey");
  assert.ok(
    call < ready,
    "the adoption must run before whenReady, or Chromium reads the wrong key",
  );
});
