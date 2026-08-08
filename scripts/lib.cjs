const crypto = require("node:crypto");
const fs = require("node:fs");

function semverParts(version) {
  return String(version ?? "0")
    .replace(/^v/i, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0)
    .slice(0, 3);
}

function isNewerVersion(candidate, current) {
  const a = semverParts(candidate);
  const b = semverParts(current);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] ?? 0) > (b[index] ?? 0)) return true;
    if ((a[index] ?? 0) < (b[index] ?? 0)) return false;
  }
  return false;
}

function sanitizeAlertSettings(input) {
  const thresholds = [...new Set((input?.thresholds ?? []).map(Number))]
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 100)
    .sort((a, b) => a - b);
  return {
    enabled: input?.enabled !== false,
    thresholds: thresholds.length ? thresholds : [70, 85, 100],
    resetReminders: input?.resetReminders !== false,
    resetReminderMinutes: Math.max(
      5,
      Math.min(1440, Number(input?.resetReminderMinutes) || 30),
    ),
    credentialExpiry: input?.credentialExpiry !== false,
    credentialExpiryHours: Math.max(
      1,
      Math.min(168, Number(input?.credentialExpiryHours) || 24),
    ),
  };
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function validateManifest(manifest) {
  return Boolean(
    manifest?.version &&
      String(manifest.downloadUrl ?? "").startsWith("https://") &&
      /^[a-f0-9]{64}$/i.test(manifest.sha256 ?? ""),
  );
}

module.exports = {
  isNewerVersion,
  sanitizeAlertSettings,
  sha256,
  validateManifest,
};
