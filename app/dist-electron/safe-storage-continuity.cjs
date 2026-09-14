"use strict";

// safeStorage master-key continuity across a product rename.
//
// Electron derives its userData directory from productName, and on Windows the
// safeStorage (DPAPI) master key lives in the "Local State" file inside that
// directory. This product was renamed from "Claude Account Manager" to "AI
// Account Manager", which moves userData.
//
// Account data itself is unaffected: it lives in the pinned
// %APPDATA%\ClaudeAccountManager root (see appDataDir() in main.cjs). But
// api-keys-vault.json was sealed with the master key held in the OLD userData
// directory, so without this step every stored API key would report "Stored key
// could not be decrypted" after an upgrade.
//
// Contract:
//   * idempotent - acts only when the current userData has no "Local State"
//     and a legacy directory does;
//   * non-destructive - copies, never moves, so a failure leaves the previous
//     install exactly as it was;
//   * silent about contents - the file is never read, parsed, or logged.
//
// It must run before app.whenReady(). That ordering is what makes it work:
// Chromium reads "Local State" when it initialises OSCrypt, which happens after
// the main script has been evaluated.

const LEGACY_USER_DATA_DIR_NAMES = Object.freeze(["Claude Account Manager"]);

/**
 * Decide whether a legacy "Local State" should be adopted, without touching the
 * disk. Exported separately so the decision is unit-testable.
 *
 * @returns {{ action: "copy", from: string, to: string }
 *          | { action: "skip", reason: string }}
 */
function planSafeStorageKeyAdoption({
  userDataDir,
  appDataRoot,
  legacyNames = LEGACY_USER_DATA_DIR_NAMES,
  exists,
  path,
}) {
  const target = path.join(userDataDir, "Local State");
  if (exists(target)) return { action: "skip", reason: "already-present" };

  for (const legacyName of legacyNames) {
    const source = path.join(appDataRoot, legacyName, "Local State");
    // A rename that leaves userData where it was needs no work.
    if (path.resolve(source) === path.resolve(target)) continue;
    if (!exists(source)) continue;
    return { action: "copy", from: source, to: target };
  }
  return { action: "skip", reason: "no-legacy-key" };
}

/**
 * Perform the adoption. Never throws: a failure here must not stop the app from
 * starting, and nothing is deleted either way.
 *
 * @returns {"copied" | "already-present" | "no-legacy-key" | "failed"}
 */
function adoptLegacySafeStorageKey({
  userDataDir,
  appDataRoot,
  legacyNames = LEGACY_USER_DATA_DIR_NAMES,
  fs = require("node:fs"),
  path = require("node:path"),
} = {}) {
  try {
    const plan = planSafeStorageKeyAdoption({
      userDataDir,
      appDataRoot,
      legacyNames,
      exists: (file) => fs.existsSync(file),
      path,
    });
    if (plan.action === "skip") return plan.reason;
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.copyFileSync(plan.from, plan.to);
    return "copied";
  } catch {
    return "failed";
  }
}

module.exports = {
  LEGACY_USER_DATA_DIR_NAMES,
  planSafeStorageKeyAdoption,
  adoptLegacySafeStorageKey,
};
