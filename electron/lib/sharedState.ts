import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { isHomeDefaultDir } from "./paths";

/**
 * A profile's CLAUDE_CONFIG_DIR isolates EVERYTHING (credentials, settings,
 * and session transcripts alike) — that's the right call for credentials,
 * but it means switching accounts used to make past sessions disappear.
 * These paths are relinked back into the canonical (~\.claude) profile so
 * every account sees the same session history; only auth/identity/usage
 * state (.credentials.json, .claude.json, policy-limits.json, daemon*,
 * settings*) stays per-profile.
 */
const SHARED_DIRS = ["projects", "shell-snapshots", "file-history", "session-env", "paste-cache", "jobs", "ide"];
const SHARED_FILES = ["history.jsonl"];

function canonicalDir(): string {
  return path.join(os.homedir(), ".claude");
}

/** True when `link` is a reparse point (junction/symlink) already targeting `target`. */
function alreadyLinkedTo(link: string, target: string): boolean {
  try {
    const stat = fs.lstatSync(link);
    if (!stat.isSymbolicLink()) return false;
    const resolved = path.resolve(path.dirname(link), fs.readlinkSync(link));
    return resolved.toLowerCase() === path.resolve(target).toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Recursively moves files/folders unique to `srcDir` into `destDir`, descending
 * into subfolders that exist on both sides (e.g. every profile has its own
 * `projects/<same-slug>/` for the same working directory) instead of skipping
 * them outright. Leaves any leaf-name collision in place under `srcDir` rather
 * than ever deleting or overwriting — the caller must not remove `srcDir`
 * unless this returns true.
 */
function mergeDirInto(srcDir: string, destDir: string): boolean {
  fs.mkdirSync(destDir, { recursive: true });
  let clean = true;
  for (const entry of fs.readdirSync(srcDir)) {
    const from = path.join(srcDir, entry);
    const to = path.join(destDir, entry);
    const fromIsDir = fs.lstatSync(from).isDirectory();
    if (!fs.existsSync(to)) {
      fs.renameSync(from, to);
    } else if (fromIsDir && fs.lstatSync(to).isDirectory()) {
      if (mergeDirInto(from, to)) fs.rmdirSync(from);
      else clean = false;
    } else {
      clean = false; // leaf-name collision with mismatched types — leave it, don't touch either copy
    }
  }
  return clean;
}

function ensureDirLinked(profileDir: string, name: string): void {
  const target = path.join(canonicalDir(), name);
  const link = path.join(profileDir, name);
  fs.mkdirSync(target, { recursive: true });

  if (alreadyLinkedTo(link, target)) return;

  if (fs.existsSync(link)) {
    const stat = fs.lstatSync(link);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(link); // stale/wrong-target junction
    } else {
      if (!mergeDirInto(link, target)) {
        throw new Error(`"${link}" still has unmerged content after merge — leaving it in place, not linking.`);
      }
      fs.rmdirSync(link);
    }
  }
  fs.symlinkSync(target, link, "junction");
}

function ensureFileLinked(profileDir: string, name: string): void {
  const target = path.join(canonicalDir(), name);
  const link = path.join(profileDir, name);
  if (!fs.existsSync(target)) fs.writeFileSync(target, "");

  if (fs.existsSync(link)) {
    const same = fs.statSync(link).ino === fs.statSync(target).ino;
    if (same) return;
    // Distinct content accumulated under the profile — fold it into the canonical file, then link.
    const extra = fs.readFileSync(link, "utf8");
    if (extra.length > 0) {
      const sep = fs.existsSync(target) && fs.statSync(target).size > 0 ? "\n" : "";
      fs.appendFileSync(target, sep + extra);
    }
    fs.unlinkSync(link);
  }
  fs.linkSync(target, link);
}

/**
 * Idempotent, safe to call before every launch: makes `profileDir`'s session
 * paths point at the canonical profile, migrating in any content the profile
 * had already accumulated on its own. No-op for the home-default profile
 * (it IS the canonical dir).
 */
export function linkSharedState(profileDir: string): void {
  if (isHomeDefaultDir(profileDir)) return;
  fs.mkdirSync(profileDir, { recursive: true });
  for (const name of SHARED_DIRS) {
    try {
      ensureDirLinked(profileDir, name);
    } catch (err) {
      console.error(`sharedState: failed to link dir "${name}" for ${profileDir}:`, err);
    }
  }
  for (const name of SHARED_FILES) {
    try {
      ensureFileLinked(profileDir, name);
    } catch (err) {
      console.error(`sharedState: failed to link file "${name}" for ${profileDir}:`, err);
    }
  }
}
