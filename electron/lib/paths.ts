import { app } from "electron";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

/**
 * True when a profile dir IS the machine default (~\.claude). That profile
 * must be handled with CLAUDE_CONFIG_DIR *unset*: explicitly pointing the
 * variable at ~\.claude makes Claude Code fork its .claude.json state
 * (verified empirically — it looks for .claude.json inside the dir instead
 * of at the sibling ~\.claude.json used when the variable is absent).
 */
export function isHomeDefaultDir(dir: string): boolean {
  return path.resolve(dir).toLowerCase() === path.join(os.homedir(), ".claude").toLowerCase();
}

/** Stable app-data location shared by dev and packaged builds. */
export function appDataDir(): string {
  const dir = path.join(app.getPath("appData"), "AIAccountManager");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function profilesFile(): string {
  return path.join(appDataDir(), "profiles.json");
}

export function settingsFile(): string {
  return path.join(appDataDir(), "settings.json");
}

export function snapshotsFile(): string {
  return path.join(appDataDir(), "usage-snapshots.json");
}

/** API Key Analytics: non-secret key metadata (nickname, provider, mask). */
export function apiKeysFile(): string {
  return path.join(appDataDir(), "api-keys.json");
}

/** API Key Analytics: DPAPI-encrypted secrets, keyed by record id (base64 ciphertext). */
export function apiKeyVaultFile(): string {
  return path.join(appDataDir(), "api-keys-vault.json");
}

/** API Key Analytics: per-key cumulative snapshot time-series. */
export function apiSnapshotsFile(): string {
  return path.join(appDataDir(), "api-usage-snapshots.json");
}

/** Atomic JSON write: temp file + rename, so a crash never truncates state. */
export function writeJsonAtomic(file: string, value: unknown): void {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

export function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}
