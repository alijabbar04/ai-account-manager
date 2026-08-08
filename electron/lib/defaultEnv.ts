import { execFile } from "node:child_process";

/**
 * Manages the user-scope CLAUDE_CONFIG_DIR environment variable
 * (HKCU\Environment) so newly opened shells default to a chosen account.
 * Uses .NET via PowerShell because SetEnvironmentVariable also broadcasts
 * WM_SETTINGCHANGE, which plain `reg add` does not.
 */

function runPs(command: string, timeout = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", command],
      { windowsHide: true, timeout },
      (err, stdout) => (err ? reject(err) : resolve(stdout.trim()))
    );
  });
}

function psSingleQuote(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function sameDir(a: string | null, b: string | null): boolean {
  if (a === null && b === null) return true;
  if (!a || !b) return false;
  return a.replace(/\\+$/, "").toLowerCase() === b.replace(/\\+$/, "").toLowerCase();
}

export async function getDefaultConfigDir(): Promise<string | null> {
  const out = await runPs("[Environment]::GetEnvironmentVariable('CLAUDE_CONFIG_DIR','User')").catch(() => "");
  return out || null;
}

/**
 * Sets (or clears, with null) the user-scope variable. The SetEnvironmentVariable
 * call fires a WM_SETTINGCHANGE broadcast that can occasionally time out if a
 * top-level window is slow to respond — but the registry value is written before
 * the broadcast. So we tolerate a failure/timeout from the set call and confirm
 * success by reading the value back; only a genuine mismatch is an error.
 */
export async function setDefaultConfigDir(dir: string | null): Promise<void> {
  const value = dir ? psSingleQuote(dir) : "$null";
  await runPs(`[Environment]::SetEnvironmentVariable('CLAUDE_CONFIG_DIR', ${value}, 'User')`).catch(() => {
    /* broadcast may time out; verified by read-back below */
  });
  const readback = await getDefaultConfigDir().catch(() => null);
  if (!sameDir(readback, dir)) {
    throw new Error("Could not persist the default CLAUDE_CONFIG_DIR (value did not stick).");
  }
}
