import { spawn, execFile } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { Profile } from "../../shared/types";
import { isHomeDefaultDir } from "./paths";
import { linkSharedState } from "./sharedState";

/**
 * Child environment for a profile: CLAUDE_CONFIG_DIR injected, Electron
 * launch variables stripped (they confuse Electron-based children like
 * VS Code, and ELECTRON_RUN_AS_NODE would break `code`). The machine-default
 * ~\.claude profile is launched with the variable UNSET instead — pointing
 * it explicitly at ~\.claude would fork Claude Code's .claude.json state.
 */
function envFor(profile: Profile): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("ELECTRON_") || k === "NODE_OPTIONS" || k === "CLAUDE_CONFIG_DIR") continue;
    env[k] = v;
  }
  if (!isHomeDefaultDir(profile.configDir)) {
    env.CLAUDE_CONFIG_DIR = profile.configDir;
  }
  return env;
}

function psSingleQuote(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

/**
 * Store-app launchers (wt.exe) are zero-length app-execution-alias reparse
 * points: fs.stat/existsSync report them as missing. lstat sees them.
 */
function fileExists(p: string): boolean {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function findOnPath(exe: string): string | null {
  const pathext = [".exe", ".cmd", ".bat", ""];
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of pathext) {
      const candidate = path.join(dir, exe + ext);
      if (fileExists(candidate)) return candidate;
    }
  }
  return null;
}

const wtPath = () =>
  findOnPath("wt") ?? // Windows Terminal usually lives behind an app-execution alias:
  [path.join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WindowsApps", "wt.exe")].find(fileExists) ??
  null;

const shellExe = () => (findOnPath("pwsh") ? "pwsh" : "powershell");

/**
 * Builds the PowerShell that runs inside the new terminal. The env var is set
 * *inside* the shell too, so it holds even when Windows Terminal reuses an
 * existing window process (whose environment we don't control).
 */
function innerCommand(profile: Profile, run?: string): string {
  const isDefault = isHomeDefaultDir(profile.configDir);
  const lines = [
    isDefault
      ? `Remove-Item Env:CLAUDE_CONFIG_DIR -ErrorAction SilentlyContinue`
      : `$env:CLAUDE_CONFIG_DIR=${psSingleQuote(profile.configDir)}`,
    `$Host.UI.RawUI.WindowTitle='Claude — ' + ${psSingleQuote(profile.name)}`,
    `Write-Host ('Claude account: ' + ${psSingleQuote(profile.name)}) -ForegroundColor Cyan`,
    isDefault
      ? `Write-Host 'Using the machine default profile (~\\.claude)' -ForegroundColor DarkGray`
      : `Write-Host ('CLAUDE_CONFIG_DIR = ' + $env:CLAUDE_CONFIG_DIR) -ForegroundColor DarkGray`
  ];
  if (run) lines.push(run);
  return lines.join("; ");
}

/** -EncodedCommand sidesteps every layer of cmd/wt quoting. */
function encodePs(command: string): string {
  return Buffer.from(command, "utf16le").toString("base64");
}

export interface TerminalInvocation {
  exe: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  cwd: string;
}

/** Pure builder for the terminal launch (separated so it can be exercised in tests). */
export function buildTerminalInvocation(profile: Profile, run?: string): TerminalInvocation {
  const encoded = encodePs(innerCommand(profile, run));
  const shell = shellExe();
  const env = envFor(profile);
  const cwd = os.homedir();
  const wt = wtPath();

  if (wt) {
    return {
      exe: wt,
      args: ["new-tab", "--title", `Claude — ${profile.name}`, shell, "-NoLogo", "-NoExit", "-EncodedCommand", encoded],
      env,
      cwd
    };
  }
  // Fallback: classic console window via cmd's `start`.
  return {
    exe: "cmd.exe",
    args: ["/d", "/s", "/c", `start "Claude" ${shell} -NoLogo -NoExit -EncodedCommand ${encoded}`],
    env,
    cwd
  };
}

function openTerminal(profile: Profile, run?: string): void {
  linkSharedState(profile.configDir);
  const inv = buildTerminalInvocation(profile, run);
  spawn(inv.exe, inv.args, {
    env: inv.env,
    cwd: inv.cwd,
    detached: true,
    stdio: "ignore",
    windowsVerbatimArguments: inv.exe === "cmd.exe"
  }).unref();
}

export function openPowerShell(profile: Profile): void {
  openTerminal(profile);
}

export function openClaude(profile: Profile): void {
  openTerminal(profile, "claude");
}

export function openLoginTerminal(profile: Profile): void {
  openTerminal(
    profile,
    "Write-Host 'Complete the sign-in in your browser (Anthropic or Google).' -ForegroundColor Yellow; claude auth login"
  );
}

/**
 * Launches VS Code with the profile environment. Note: if a VS Code instance
 * is already running, the new window is created by the existing process and
 * inherits *its* environment instead — surfaced to the user in the UI/docs.
 */
export function openVSCode(profile: Profile): { ok: boolean; error?: string } {
  const code = findOnPath("code");
  if (!code) {
    return { ok: false, error: "VS Code ('code') was not found on PATH." };
  }
  linkSharedState(profile.configDir);
  spawn("cmd.exe", ["/c", "code", "-n"], {
    env: envFor(profile),
    cwd: os.homedir(),
    detached: true,
    stdio: "ignore",
    windowsHide: true
  }).unref();
  return { ok: true };
}

/** Runs `claude auth status --json` for a profile (on-demand verification). */
export function authStatus(profile: Profile): Promise<{ loggedIn?: boolean; authMethod?: string } | null> {
  return new Promise((resolve) => {
    execFile(
      "claude",
      ["auth", "status", "--json"],
      { env: envFor(profile), windowsHide: true, timeout: 15000, shell: true },
      (_err, stdout) => {
        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve(null);
        }
      }
    );
  });
}

export function claudeCliVersion(): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile(
      "claude",
      ["--version"],
      { windowsHide: true, timeout: 15000, shell: true },
      (_err, stdout) => resolve(stdout?.trim() || undefined)
    );
  });
}
