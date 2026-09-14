// Electron side of scripts/verify-safestorage-migration.cjs. Not part of the
// shipped app: it exercises the real continuity module against real DPAPI.
const fs = require("node:fs");
const path = require("node:path");
const {
  adoptLegacySafeStorageKey,
} = require("../app/dist-electron/safe-storage-continuity.cjs");

const [mode, userDataDir, appDataRoot, blobFile] = process.argv.slice(2);
const PROBE = "safestorage-continuity-probe";

if (mode === "adopt-then-decrypt") {
  // Exactly as main.cjs does it: before app.whenReady().
  const outcome = adoptLegacySafeStorageKey({ userDataDir, appDataRoot });
  process.stdout.write(`ADOPTION=${outcome}\n`);
}

const { app, safeStorage } = require("electron");
app.setPath("userData", userDataDir);

app
  .whenReady()
  .then(() => {
    try {
      if (mode === "encrypt") {
        fs.mkdirSync(path.dirname(blobFile), { recursive: true });
        fs.writeFileSync(blobFile, safeStorage.encryptString(PROBE));
        process.stdout.write("RESULT=encrypted\n");
      } else {
        const plain = safeStorage.decryptString(fs.readFileSync(blobFile));
        process.stdout.write(
          `RESULT=${plain === PROBE ? "decrypted" : "mismatch"}\n`,
        );
      }
    } catch {
      // The message can name the OS crypto backend; the outcome is all we need.
      process.stdout.write("RESULT=failed\n");
    }
    app.quit();
  })
  .catch(() => {
    process.stdout.write("RESULT=failed\n");
    app.quit();
  });
