"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { downloadArtifact } = require("@electron/get");
const root = path.resolve(__dirname, "..");

async function ensureElectron() {
  const electronRoot = path.join(root, "node_modules/electron");
  const dist = path.join(electronRoot, "dist");
  const exe = path.join(dist, "electron.exe");
  if (process.platform !== "win32" || process.arch !== "x64")
    throw new Error("Windows x64 is required for this build.");
  if (!fs.existsSync(exe)) {
    const version = JSON.parse(
      fs.readFileSync(path.join(electronRoot, "package.json")),
    ).version;
    const options = { version, platform: "win32", arch: "x64" };
    const archive = await downloadArtifact({
      ...options,
      artifactName: "electron",
    });
    // Cached archives must also be checked before manual extraction.
    const sumsFile = await downloadArtifact({
      ...options,
      artifactName: "SHASUMS256.txt",
      isGeneric: true,
      force: true,
    });
    const name = `electron-v${version}-win32-x64.zip`;
    const lines = fs.readFileSync(sumsFile, "utf8").split(/\r?\n/);
    const matches = lines.filter(
      (line) => line.endsWith(` ${name}`) || line.endsWith(` *${name}`),
    );
    if (matches.length !== 1)
      throw new Error("Electron archive checksum is missing or ambiguous.");
    const expected = matches[0].slice(0, 64);
    const actual = crypto
      .createHash("sha256")
      .update(fs.readFileSync(archive))
      .digest("hex");
    if (actual !== expected)
      throw new Error(
        "Electron cached archive SHA-256 mismatch. Remove this archive and retry setup.",
      );
    // This path is constructed from the repository root and cannot escape node_modules.
    fs.mkdirSync(dist, { recursive: true });
    console.log(
      "Extracting the verified Electron archive with Windows PowerShell 5.1...",
    );
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Expand-Archive -LiteralPath $env:CAM_ELECTRON_ARCHIVE -DestinationPath $env:CAM_ELECTRON_DIST -Force",
      ],
      {
        env: {
          ...process.env,
          CAM_ELECTRON_ARCHIVE: archive,
          CAM_ELECTRON_DIST: dist,
        },
        stdio: "inherit",
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(
        "Electron archive extraction failed. Check free disk space and file locks.",
      );
    fs.writeFileSync(path.join(electronRoot, "path.txt"), "electron.exe");
  }
  if (!fs.existsSync(exe) || fs.statSync(exe).size < 1024 * 1024)
    throw new Error("Electron executable is missing or incomplete.");
  console.log("Electron executable is present.");
}
ensureElectron().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
