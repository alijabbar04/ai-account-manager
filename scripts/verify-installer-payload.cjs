"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { getPath7za } = require("app-builder-lib/out/toolsets/7zip.js");
const {
  inspectPE,
  verifyVersion,
  installerName,
} = require("./release-lib.cjs");

async function verifyPayload() {
  const root = path.resolve(__dirname, "..");
  const version = verifyVersion(root);
  const installer = path.resolve(
    process.argv[2] ?? path.join(root, "release", installerName(version)),
  );
  inspectPE(installer);
  const payload = fs.mkdtempSync(
    path.join(os.tmpdir(), "aam-installer-payload-"),
  );
  try {
    // Electron-builder embeds its 7z application payload in the NSIS executable.
    // Extract only application resources and its executable, without installing.
    const extraction = spawnSync(
      await getPath7za(),
      [
        "x",
        installer,
        `-o${payload}`,
        "-y",
        "resources\\*",
        "AI Account Manager.exe",
      ],
      { encoding: "utf8" },
    );
    const text = extraction.stdout + extraction.stderr;
    assert.ok(
      extraction.status === 0 ||
        (extraction.status === 1 &&
          text.includes("There are data after the end of archive")),
      text,
    );
    assert.match(
      text,
      /Everything is Ok/,
      "Installer payload extraction did not complete",
    );
    const contents = spawnSync(
      process.execPath,
      [
        path.join(root, "scripts/verify-packaged.cjs"),
        path.join(payload, "resources"),
      ],
      { encoding: "utf8" },
    );
    assert.equal(contents.status, 0, contents.stdout + contents.stderr);
    process.stdout.write(contents.stdout);
    const identity = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "$info = (Get-Item -LiteralPath $env:CAM_PAYLOAD_EXE).VersionInfo; if (($info.ProductVersion -ne $env:CAM_EXPECTED_VERSION -and $info.ProductVersion -ne ($env:CAM_EXPECTED_VERSION + '.0')) -or $info.ProductName -ne 'AI Account Manager') { throw 'Packaged Windows identity/version mismatch' }",
      ],
      {
        env: {
          ...process.env,
          CAM_PAYLOAD_EXE: path.join(payload, "AI Account Manager.exe"),
          CAM_EXPECTED_VERSION: version,
        },
        encoding: "utf8",
      },
    );
    assert.equal(identity.status, 0, identity.stdout + identity.stderr);
    console.log(
      `Actual NSIS payload verified: AI Account Manager ${version}, complete current runtime/UI and automation resources.`,
    );
  } finally {
    const relative = path.relative(os.tmpdir(), payload);
    assert.ok(
      !relative.startsWith("..") &&
        !path.isAbsolute(relative) &&
        path.basename(payload).startsWith("aam-installer-payload-"),
    );
    fs.rmSync(payload, { recursive: true, force: true });
  }
}
verifyPayload().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
