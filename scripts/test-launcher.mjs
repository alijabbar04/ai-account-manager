/**
 * Exercises the real launcher pipeline (envFor → innerCommand → EncodedCommand)
 * without opening persistent windows:
 *  1. runs the encoded command through pwsh with output piped, asserting the
 *     profile env var lands correctly (including spaces/quotes in paths);
 *  2. asserts the home-default profile launches with the variable UNSET;
 *  3. launches one real `wt new-tab` that writes a probe file and exits,
 *     proving Windows Terminal forwards our arguments intact.
 */
import { build } from "esbuild";
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "scripts", ".test-launcher-bundle.cjs");

// electron is imported transitively via paths.ts -> shim app.getPath (unused here).
await build({
  entryPoints: [path.join(ROOT, "electron", "lib", "launcher.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: OUT,
  external: ["electron"],
  banner: {
    js: `require.cache[require.resolve && 'electron'] = undefined;
const Module = require('module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'electron') return 'electron-shim';
  return origResolve.call(this, request, ...rest);
};
require.cache['electron-shim'] = { id: 'electron-shim', filename: 'electron-shim', loaded: true, exports: { app: { getPath: () => require('os').tmpdir() } } };`
  }
});

const launcher = await import(`file://${OUT}`);
let failures = 0;
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
};

// --- 1. Named profile with hostile characters: env + banner through real pwsh ---
const trickyDir = path.join(os.tmpdir(), "cam test", "o'brien profile", ".claude-work");
fs.mkdirSync(trickyDir, { recursive: true });
const profile = { id: "t1", name: "Work O'Brien", configDir: trickyDir, createdAt: "" };

const inv = launcher.buildTerminalInvocation(profile);
const encIdx = inv.args.indexOf("-EncodedCommand");
check("invocation uses -EncodedCommand", encIdx > 0);
check("child env has CLAUDE_CONFIG_DIR", inv.env.CLAUDE_CONFIG_DIR === trickyDir);
check("child env strips ELECTRON_RUN_AS_NODE", !("ELECTRON_RUN_AS_NODE" in inv.env));

// Run the encoded payload directly in pwsh (piped, no window), replacing -NoExit.
const probe = spawnSync(
  "pwsh",
  ["-NoLogo", "-NonInteractive", "-EncodedCommand", inv.args[encIdx + 1]],
  { encoding: "utf8", env: { ...process.env, CLAUDE_CONFIG_DIR: undefined }, timeout: 30000 }
);
check("encoded command runs cleanly", probe.status === 0, probe.stderr?.trim());
check(
  "banner shows exact profile dir (quotes/spaces intact)",
  probe.stdout.includes(`CLAUDE_CONFIG_DIR = ${trickyDir}`),
  probe.stdout.trim().split("\n").pop()
);

// --- 2. Home-default profile must launch with the variable UNSET ---
const homeProfile = { id: "t2", name: "Personal", configDir: path.join(os.homedir(), ".claude"), createdAt: "" };
const invHome = launcher.buildTerminalInvocation(homeProfile);
check("home-default: env omits CLAUDE_CONFIG_DIR", !("CLAUDE_CONFIG_DIR" in invHome.env));
const encHome = invHome.args[invHome.args.indexOf("-EncodedCommand") + 1];
const probeHome = spawnSync("pwsh", ["-NoLogo", "-NonInteractive", "-EncodedCommand", encHome], {
  encoding: "utf8",
  env: { ...process.env, CLAUDE_CONFIG_DIR: "C:\\should-be-removed" },
  timeout: 30000
});
check(
  "home-default: inner command clears any inherited value",
  probeHome.status === 0 && probeHome.stdout.includes("machine default profile"),
  probeHome.stdout.trim().split("\n").pop()
);

// --- 3. Real Windows Terminal pass-through (tab opens, writes probe, exits) ---
const probeFile = path.join(os.tmpdir(), `cam-wt-probe-${Date.now()}.txt`);
const wtProfile = { id: "t3", name: "WT Probe", configDir: trickyDir, createdAt: "" };
const invWt = launcher.buildTerminalInvocation(
  wtProfile,
  `Set-Content -Path '${probeFile.replace(/'/g, "''")}' -Value $env:CLAUDE_CONFIG_DIR`
);
if (path.basename(invWt.exe).toLowerCase().startsWith("wt")) {
  // Drop -NoExit so the tab closes itself after writing the probe.
  const args = invWt.args.filter((a) => a !== "-NoExit");
  spawn(invWt.exe, args, { env: invWt.env, cwd: invWt.cwd, detached: true, stdio: "ignore" }).unref();
  const deadline = Date.now() + 20000;
  let content = null;
  while (Date.now() < deadline) {
    try {
      content = fs.readFileSync(probeFile, "utf8").trim();
      if (content) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  check("wt.exe forwards args; shell got exact CLAUDE_CONFIG_DIR", content === trickyDir, String(content));
  fs.rmSync(probeFile, { force: true });
} else {
  console.log("SKIP: wt.exe not found, fallback path would be used");
}

fs.rmSync(OUT, { force: true });
console.log(failures === 0 ? "LAUNCHER TESTS PASSED" : `${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
