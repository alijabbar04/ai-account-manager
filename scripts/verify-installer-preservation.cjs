"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { getMakeNsisPath } = require("app-builder-lib/out/toolsets/windows.js");

async function verifyPreservation() {
  assert.equal(
    process.platform,
    "win32",
    "NSIS preservation checks require Windows",
  );
  const root = path.resolve(__dirname, "..");
  const config = JSON.parse(fs.readFileSync(path.join(root, "package.json")));
  assert.equal(config.build.nsis.deleteAppDataOnUninstall, false);
  const originalHooks = fs.readFileSync(
    path.join(root, "build/installer.nsh"),
    "utf8",
  );
  assert.ok(
    !originalHooks.includes(
      'Delete "$APPDATA\\ClaudeAccountManager\\automation\\session-profiles.json"',
    ),
    "Uninstaller must preserve session profile metadata",
  );
  const compiler = await getMakeNsisPath(config.build.toolsets?.nsis);
  const sandbox = fs.mkdtempSync(
    path.join(os.tmpdir(), "aam-nsis-preservation-"),
  );
  const nsisPath = (value) =>
    value.replaceAll("$", "$$").replaceAll('"', '$\\"');
  try {
    for (const mode of [
      "fresh",
      "legacy-upgrade",
      "failed-upgrade",
      "uninstall",
    ]) {
      const fixture = path.join(sandbox, mode);
      const data = path.join(fixture, "ClaudeAccountManager");
      const profiles = path.join(data, "automation/session-profiles.json");
      fs.mkdirSync(path.dirname(profiles), { recursive: true });
      const expected =
        '{"profiles":[{"id":"fixture","name":"test account","provider":"claude"}]}\n';
      if (mode !== "fresh") fs.writeFileSync(profiles, expected);
      const sentinels = [
        "profiles.json",
        "settings.json",
        "usage-snapshots.json",
        "api-keys-vault.json",
        "Local State",
        "browser-profiles/fixture/session.txt",
      ];
      for (const file of sentinels) {
        fs.mkdirSync(path.dirname(path.join(data, file)), { recursive: true });
        fs.writeFileSync(path.join(data, file), `synthetic fixture ${file}\n`);
      }
      // Run the real hook code, redirecting every data/registry operation into
      // fixtures. Process termination is replaced: real sidecars must not be touched.
      const kill = /nsExec::ExecToLog[^\r\n]*/g;
      assert.equal((originalHooks.match(kill) ?? []).length, 1);
      const hooks = originalHooks
        .replaceAll("$APPDATA", nsisPath(fixture))
        .replaceAll(
          "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
          `Software\\AAM-NSIS-Test\\${path.basename(sandbox)}\\Run`,
        )
        .replace(kill, 'DetailPrint "fixture: skip real process termination"');
      const include = path.join(fixture, "hooks.nsh");
      const exe = path.join(fixture, "preservation.exe");
      const source = path.join(fixture, "preservation.nsi");
      fs.writeFileSync(include, hooks);
      const action =
        mode === "uninstall"
          ? "!insertmacro customUnInstall"
          : mode === "failed-upgrade"
            ? 'Abort "simulated extraction failure"'
            : "!insertmacro customInstall";
      fs.writeFileSync(
        source,
        [
          '!include "LogicLib.nsh"',
          '!define isUpdated "0 == 1"',
          `OutFile "${nsisPath(exe)}"`,
          "RequestExecutionLevel user",
          "SilentInstall silent",
          "Var installMode",
          `!include "${nsisPath(include)}"`,
          "!insertmacro customHeader",
          "Function .onInit",
          'StrCpy $installMode "current"',
          mode === "uninstall" ? "" : "!insertmacro customInit",
          "FunctionEnd",
          "Section",
          mode.includes("upgrade") ? `Delete "${nsisPath(profiles)}"` : "",
          action,
          "SectionEnd",
        ].join("\n"),
      );
      const compile = spawnSync(compiler.path, ["/V2", source], {
        env: { ...process.env, ...compiler.env },
        encoding: "utf8",
      });
      assert.equal(compile.status, 0, compile.stdout + compile.stderr);
      const run = spawnSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "$p = Start-Process -FilePath $env:CAM_NSIS_TEST_EXE -WindowStyle Hidden -Wait -PassThru; exit $p.ExitCode",
        ],
        {
          env: { ...process.env, CAM_NSIS_TEST_EXE: exe },
          encoding: "utf8",
          timeout: 30000,
        },
      );
      if (mode === "failed-upgrade")
        assert.notEqual(
          run.status,
          0,
          "Simulated failed install must not return success",
        );
      else assert.equal(run.status, 0, run.stdout + run.stderr);
      if (mode === "fresh")
        assert.ok(
          !fs.existsSync(profiles),
          "Fresh installation must not invent profiles",
        );
      else
        assert.equal(
          fs.readFileSync(profiles, "utf8"),
          expected,
          `Profile metadata lost in ${mode}`,
        );
      for (const file of sentinels)
        assert.equal(
          fs.readFileSync(path.join(data, file), "utf8"),
          `synthetic fixture ${file}\n`,
          `User data changed: ${file}`,
        );
      assert.ok(
        !fs.existsSync(`${profiles}.aam-upgrade-backup`),
        "Successful restoration must clean up the temporary backup",
      );
      console.log(
        `NSIS preservation passed: ${mode} (isolated synthetic paths; no real install or credentials).`,
      );
    }
  } finally {
    const relative = path.relative(os.tmpdir(), sandbox);
    assert.ok(
      !relative.startsWith("..") &&
        !path.isAbsolute(relative) &&
        path.basename(sandbox).startsWith("aam-nsis-preservation-"),
    );
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
}
verifyPreservation().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
