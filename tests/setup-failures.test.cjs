const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
function runSetup(prefix) {
  return spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Import-Module (Join-Path $PSHOME 'Modules/Microsoft.PowerShell.Utility/Microsoft.PowerShell.Utility.psd1')\n${prefix}\n& './setup.ps1' -SkipTests`,
    ],
    { cwd: root, encoding: "utf8" },
  );
}
test(
  "setup fails clearly for missing Node, npm or SDK rather than reporting success",
  { skip: process.platform !== "win32" },
  () => {
    for (const [missing, expected] of [
      ["node.exe", /Node.js is missing/],
      ["npm.cmd", /npm.cmd is missing/],
      ["dotnet.exe", /SDK 8\+ is missing/],
    ]) {
      const result = runSetup(
        `function Get-Command { param($Name, $ErrorAction) if ($Name -eq '${missing}') { return $null }; Microsoft.PowerShell.Core\\Get-Command $Name -ErrorAction SilentlyContinue }`,
      );
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stdout, expected);
      assert.doesNotMatch(
        result.stdout,
        /completed successfully|Dependencies ready/,
      );
    }
  },
);
test(
  "setup stops on npm ci failure without npm install fallback or success",
  { skip: process.platform !== "win32" },
  () => {
    const result = runSetup(`
    function dotnet.exe { param($Action) $global:LASTEXITCODE = 0; '8.0.425 [test-sdk]' }
    function npm.cmd { param($Action)
      if ($Action -eq '--version') { $global:LASTEXITCODE = 0; '10.9.7'; return }
      Write-Output "MOCK_NPM_ACTION=$Action"
      $global:LASTEXITCODE = 1
      Write-Output 'npm error code ETARGET'
    }
  `);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /MOCK_NPM_ACTION=ci/);
    assert.doesNotMatch(
      result.stdout,
      /MOCK_NPM_ACTION=install|completed successfully|Dependencies ready/,
    );
    assert.match(result.stdout, /Setup FAILED/);
  },
);
