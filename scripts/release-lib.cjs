"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { sha256 } = require("./lib.cjs");
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const repository = "alijabbar04/ai-account-manager";
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function verifyVersion(root, tag) {
  const pkg = readJson(path.join(root, "package.json"));
  const app = readJson(path.join(root, "app/package.json"));
  const lock = readJson(path.join(root, "package-lock.json"));
  assert.match(
    pkg.version,
    stableVersion,
    "Use a stable MAJOR.MINOR.PATCH version",
  );
  for (const [name, version] of [
    ["app/package.json", app.version],
    ["lockfile root", lock.version],
    ["lockfile application entry", lock.packages?.[""]?.version],
  ]) {
    assert.equal(
      version,
      pkg.version,
      `${name} version disagrees with package.json`,
    );
  }
  assert.equal(lock.lockfileVersion, 3, "Expected an npm v3 lockfile");
  for (const field of ["dependencies", "devDependencies"]) {
    assert.deepEqual(
      lock.packages[""][field],
      pkg[field],
      `${field} differ in lockfile`,
    );
  }
  assert.deepEqual(
    app.dependencies,
    pkg.dependencies,
    "App runtime dependencies differ",
  );
  for (const [location, entry] of Object.entries(lock.packages)) {
    if (!location || entry.link) continue;
    assert.match(
      entry.resolved ?? "",
      /^https:\/\//,
      `Missing HTTPS resolution: ${location}`,
    );
    assert.match(
      entry.integrity ?? "",
      /^sha(512|384|256|1)-[A-Za-z0-9+/]+={0,2}$/,
      `Missing integrity: ${location}`,
    );
  }
  if (tag)
    assert.equal(
      tag,
      `v${pkg.version}`,
      "Release tag must match the application version",
    );
  return pkg.version;
}

function inspectPE(file, minimumSize = 1024 * 1024) {
  const stat = fs.statSync(file);
  assert.ok(
    stat.isFile() && stat.size >= minimumSize,
    "Installer is missing or implausibly small",
  );
  const fd = fs.openSync(file, "r");
  try {
    const header = Buffer.alloc(64);
    assert.equal(fs.readSync(fd, header, 0, 64, 0), 64);
    assert.equal(
      header.toString("ascii", 0, 2),
      "MZ",
      "Installer is not a Windows executable",
    );
    const offset = header.readUInt32LE(60);
    assert.ok(offset >= 64 && offset + 24 <= stat.size, "Invalid PE offset");
    const pe = Buffer.alloc(24);
    fs.readSync(fd, pe, 0, 24, offset);
    assert.equal(pe.toString("ascii", 0, 4), "PE\0\0", "Invalid PE signature");
    assert.ok(
      [0x14c, 0x8664].includes(pe.readUInt16LE(4)),
      "Unexpected installer architecture",
    );
    assert.ok(pe.readUInt16LE(22) & 2, "PE file is not executable");
  } finally {
    fs.closeSync(fd);
  }
}
const installerName = (version) => `AI-Account-Manager-Setup-${version}.exe`;
const officialUrl = (version) =>
  `https://github.com/${repository}/releases/download/v${version}/${installerName(version)}`;

function generateArtifacts(root, installer, url) {
  const version = verifyVersion(root);
  assert.equal(
    path.basename(installer),
    installerName(version),
    "Installer filename/version mismatch",
  );
  inspectPE(installer);
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "https:", "Download URL must use HTTPS");
  assert.ok(
    !parsed.username && !parsed.password,
    "Download URL must not contain credentials",
  );
  const output = path.dirname(installer);
  const manifest = {
    version,
    downloadUrl: url,
    sha256: sha256(installer),
    publishedAt: new Date().toISOString(),
    notes: process.env.RELEASE_NOTES ?? "See the release notes for details.",
  };
  fs.copyFileSync(
    path.join(root, "scripts/install.ps1"),
    path.join(output, "install.ps1"),
  );
  fs.writeFileSync(
    path.join(output, "latest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(output, "SHA256SUMS.txt"),
    [installerName(version), "install.ps1"]
      .map((name) => `${sha256(path.join(output, name))}  ${name}\n`)
      .join(""),
    "ascii",
  );
  return manifest;
}

function verifyArtifacts(root, output, { tag, official = false } = {}) {
  const version = verifyVersion(root, tag);
  const name = installerName(version);
  const installer = path.join(output, name);
  inspectPE(installer);
  const manifest = readJson(path.join(output, "latest.json"));
  assert.equal(manifest.version, version, "Manifest version mismatch");
  assert.equal(
    manifest.sha256,
    sha256(installer),
    "Manifest checksum mismatch",
  );
  const url = new URL(manifest.downloadUrl);
  assert.equal(url.protocol, "https:");
  assert.ok(!url.username && !url.password);
  assert.ok(
    Number.isFinite(Date.parse(manifest.publishedAt)),
    "Manifest publication time is invalid",
  );
  assert.equal(typeof manifest.notes, "string");
  if (official)
    assert.equal(
      manifest.downloadUrl,
      officialUrl(version),
      "Release must use the official versioned asset URL",
    );
  const expected = [name, "install.ps1"]
    .map((file) => `${sha256(path.join(output, file))}  ${file}\n`)
    .join("");
  assert.equal(
    fs
      .readFileSync(path.join(output, "SHA256SUMS.txt"), "ascii")
      .replace(/\r\n/g, "\n"),
    expected,
    "Published checksums disagree with artifacts",
  );
  assert.deepEqual(
    fs.readFileSync(path.join(output, "install.ps1")),
    fs.readFileSync(path.join(root, "scripts/install.ps1")),
    "Installer bootstrap differs from the reviewed source",
  );
  return version;
}
module.exports = {
  stableVersion,
  repository,
  verifyVersion,
  inspectPE,
  installerName,
  officialUrl,
  generateArtifacts,
  verifyArtifacts,
};
