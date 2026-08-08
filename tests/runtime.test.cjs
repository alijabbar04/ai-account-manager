const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isNewerVersion,
  sanitizeAlertSettings,
  validateManifest,
} = require("../scripts/lib.cjs");

test("semantic version comparison is monotonic", () => {
  assert.equal(isNewerVersion("1.4.1", "1.4.0"), true);
  assert.equal(isNewerVersion("1.4.0", "1.4.0"), false);
  assert.equal(isNewerVersion("1.3.9", "1.4.0"), false);
});

test("alert settings are sorted, deduplicated, and bounded", () => {
  const settings = sanitizeAlertSettings({
    thresholds: [100, 85, 85, -1, 170, 70],
    resetReminderMinutes: 2,
    credentialExpiryHours: 999,
  });
  assert.deepEqual(settings.thresholds, [70, 85, 100]);
  assert.equal(settings.resetReminderMinutes, 5);
  assert.equal(settings.credentialExpiryHours, 168);
});

test("update manifests require HTTPS and a SHA-256 digest", () => {
  assert.equal(
    validateManifest({
      version: "1.4.1",
      downloadUrl: "https://example.com/setup.exe",
      sha256: "a".repeat(64),
    }),
    true,
  );
  assert.equal(
    validateManifest({
      version: "1.4.1",
      downloadUrl: "http://example.com/setup.exe",
      sha256: "a".repeat(64),
    }),
    false,
  );
});
