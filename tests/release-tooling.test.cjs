const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const {
  verifyVersion,
  inspectPE,
  generateArtifacts,
  verifyArtifacts,
  officialUrl,
} = require("../scripts/release-lib.cjs");
const { setVersion } = require("../scripts/set-version.cjs");
const {
  verifyInstalledPackages,
} = require("../scripts/verify-dependencies.cjs");
const root = path.resolve(__dirname, "..");

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cam-release-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "app"));
  fs.mkdirSync(path.join(dir, "scripts"));
  fs.mkdirSync(path.join(dir, "release"));
  for (const file of [
    "package.json",
    "package-lock.json",
    "app/package.json",
    "scripts/install.ps1",
  ])
    fs.copyFileSync(path.join(root, file), path.join(dir, file));
  for (const file of ["package.json", "app/package.json"])
    mutateJson(path.join(dir, file), (pkg) => (pkg.version = "1.7.5"));
  mutateJson(path.join(dir, "package-lock.json"), (pkg) => {
    pkg.version = "1.7.5";
    pkg.packages[""].version = "1.7.5";
  });
  const exe = path.join(dir, "release/AI-Account-Manager-Setup-1.7.5.exe");
  const bytes = Buffer.alloc(1024 * 1024);
  bytes.write("MZ");
  bytes.writeUInt32LE(128, 60);
  bytes.write("PE\0\0", 128);
  bytes.writeUInt16LE(0x14c, 132);
  bytes.writeUInt16LE(2, 150);
  fs.writeFileSync(exe, bytes);
  return { dir, exe, output: path.join(dir, "release") };
}
function mutateJson(file, fn) {
  const value = JSON.parse(fs.readFileSync(file));
  fn(value);
  fs.writeFileSync(file, JSON.stringify(value));
}

test("installed tarball versions catch corrupted lock versions even when URLs still work", (t) => {
  const { dir } = fixture(t);
  fs.mkdirSync(path.join(dir, "node_modules/resedit"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "node_modules/resedit/package.json"),
    JSON.stringify({ name: "resedit", version: "1.7.2" }),
  );
  const lock = { packages: { "node_modules/resedit": { version: "1.7.2" } } };
  assert.equal(verifyInstalledPackages(dir, lock), 1);
  lock.packages["node_modules/resedit"].version = "1.7.5";
  assert.throws(
    () => verifyInstalledPackages(dir, lock),
    /Installed version disagrees/,
  );
});

test("checked-in versions and complete lockfile metadata agree", () => {
  const version = JSON.parse(
    fs.readFileSync(path.join(root, "package.json")),
  ).version;
  assert.equal(verifyVersion(root, `v${version}`), version);
});
test("tag, app and lockfile mismatches fail before releasing", (t) => {
  const { dir } = fixture(t);
  assert.throws(() => verifyVersion(dir, "v1.7.4"), /tag/i);
  mutateJson(
    path.join(dir, "app/package.json"),
    (pkg) => (pkg.version = "1.7.4"),
  );
  assert.throws(() => verifyVersion(dir), /disagrees/);
});
test("lockfile metadata omissions and dependency drift fail", (t) => {
  const { dir } = fixture(t);
  const lock = path.join(dir, "package-lock.json");
  mutateJson(
    lock,
    (pkg) => delete pkg.packages["node_modules/resedit"].integrity,
  );
  assert.throws(() => verifyVersion(dir), /integrity/);
  fs.copyFileSync(path.join(root, "package-lock.json"), lock);
  mutateJson(lock, (pkg) => (pkg.packages[""].dependencies.react = "*"));
  assert.throws(() => verifyVersion(dir), /dependencies/);
});
test("version updates through npm preserve every nested dependency and metadata", (t) => {
  const { dir } = fixture(t);
  const before = JSON.parse(
    fs.readFileSync(path.join(dir, "package-lock.json")),
  ).packages;
  setVersion(dir, "1.7.6");
  const after = JSON.parse(
    fs.readFileSync(path.join(dir, "package-lock.json")),
  ).packages;
  delete before[""];
  delete after[""];
  assert.deepEqual(after, before);
  assert.equal(
    after["node_modules/resedit"].version,
    before["node_modules/resedit"].version,
  );
  assert.equal(verifyVersion(dir, "v1.7.6"), "1.7.6");
  assert.throws(() => setVersion(dir, "1.7.7-beta.1"), /MAJOR/);
});
test("missing, truncated, HTML and malformed PE installers are rejected", (t) => {
  const { exe } = fixture(t);
  assert.throws(() => inspectPE(`${exe}.missing`), /ENOENT/);
  fs.writeFileSync(exe, "<html>not an installer</html>");
  assert.throws(() => inspectPE(exe), /small/);
  fs.writeFileSync(exe, Buffer.alloc(1024 * 1024));
  assert.throws(() => inspectPE(exe), /Windows executable/);
});
test("manifest and checksum validation rejects corruption, stale versions and wrong URLs", (t) => {
  const { dir, exe, output } = fixture(t);
  generateArtifacts(dir, exe, officialUrl("1.7.5"));
  assert.equal(
    verifyArtifacts(dir, output, { tag: "v1.7.5", official: true }),
    "1.7.5",
  );
  const manifest = path.join(output, "latest.json");
  mutateJson(manifest, (data) => (data.version = "1.7.4"));
  assert.throws(() => verifyArtifacts(dir, output), /version mismatch/);
  generateArtifacts(dir, exe, "https://example.com/setup.exe");
  assert.throws(
    () => verifyArtifacts(dir, output, { official: true }),
    /official/,
  );
  generateArtifacts(dir, exe, officialUrl("1.7.5"));
  fs.appendFileSync(path.join(output, "SHA256SUMS.txt"), "duplicate\n");
  assert.throws(() => verifyArtifacts(dir, output), /checksums disagree/);
  generateArtifacts(dir, exe, officialUrl("1.7.5"));
  fs.appendFileSync(exe, "tampered");
  assert.throws(() => verifyArtifacts(dir, output), /checksum mismatch/);
});

test(
  "Windows PowerShell 5.1 rejects duplicate checksums, foreign assets and hash mismatches",
  { skip: process.platform !== "win32" },
  () => {
    const script = `
    $ErrorActionPreference = 'Stop'
    . './scripts/install.ps1'
    function Must-Fail([scriptblock]$Action) { $failed = $false; try { & $Action } catch { $failed = $true }; if (-not $failed) { throw 'Expected rejection' } }
    $name = 'AI-Account-Manager-Setup-1.7.5.exe'
    $sum = ('a' * 64) + '  ' + $name
    if ((Get-InstallerDigest $sum $name) -ne ('a' * 64)) { throw 'Checksum parser failed' }
    Must-Fail { Get-InstallerDigest ($sum + "\n" + $sum) $name }
    Must-Fail { Get-InstallerDigest ('broken  ' + $name) $name }
    $release = @{ tag_name = 'v1.7.5'; assets = @(@{ name = $name; size = 1048576; browser_download_url = 'https://example.com/setup.exe' }) }
    Must-Fail { Get-OfficialAssetUrl $release $name }
    $temp = [IO.Path]::GetTempFileName()
    try {
      [IO.File]::WriteAllBytes($temp, (New-Object byte[] 1048576))
      $manifest = @{ version = '1.7.5'; downloadUrl = 'https://github.com/test'; sha256 = ('a' * 64) }
      Must-Fail { Assert-InstallerDownload $temp ('a' * 64) $manifest '1.7.5' 'https://github.com/test' 1048576 }
    } finally { Remove-Item -LiteralPath $temp }
    Write-Output 'Installer rejection checks passed.'
  `;
    const result = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { cwd: root, encoding: "utf8" },
    );
    assert.match(result, /rejection checks passed/);
  },
);
