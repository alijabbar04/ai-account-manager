import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import type { Profile } from "../../shared/types";
import { profilesFile, readJson, writeJsonAtomic } from "./paths";

interface StoreShape {
  version: 1;
  profiles: Profile[];
}

function load(): StoreShape {
  const data = readJson<StoreShape>(profilesFile());
  if (data && Array.isArray(data.profiles)) return data;
  return { version: 1, profiles: [] };
}

function save(store: StoreShape): void {
  writeJsonAtomic(profilesFile(), store);
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug || "account";
}

export function listProfiles(): Profile[] {
  return load().profiles;
}

export function getProfile(id: string): Profile | undefined {
  return load().profiles.find((p) => p.id === id);
}

/** Creates a fresh config dir under the user's home and registers it. */
export function createProfile(name: string): Profile {
  const store = load();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Account name is required.");
  if (store.profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`An account named "${trimmed}" already exists.`);
  }
  const base = path.join(os.homedir(), `.claude-${slugify(trimmed)}`);
  let dir = base;
  for (let i = 2; fs.existsSync(dir); i++) dir = `${base}${i}`;
  fs.mkdirSync(dir, { recursive: true });
  const profile: Profile = {
    id: randomUUID(),
    name: trimmed,
    configDir: dir,
    createdAt: new Date().toISOString()
  };
  store.profiles.push(profile);
  save(store);
  return profile;
}

/** Registers an existing CLAUDE_CONFIG_DIR without touching its contents. */
export function importProfile(name: string, configDir: string): Profile {
  const store = load();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Account name is required.");
  const dir = path.resolve(configDir);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`Folder does not exist: ${dir}`);
  }
  if (store.profiles.some((p) => path.resolve(p.configDir).toLowerCase() === dir.toLowerCase())) {
    throw new Error("That folder is already registered as an account.");
  }
  if (store.profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`An account named "${trimmed}" already exists.`);
  }
  const profile: Profile = {
    id: randomUUID(),
    name: trimmed,
    configDir: dir,
    createdAt: new Date().toISOString()
  };
  store.profiles.push(profile);
  save(store);
  return profile;
}

export function renameProfile(id: string, name: string): Profile {
  const store = load();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Account name is required.");
  const profile = store.profiles.find((p) => p.id === id);
  if (!profile) throw new Error("Account not found.");
  if (store.profiles.some((p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`An account named "${trimmed}" already exists.`);
  }
  profile.name = trimmed;
  save(store);
  return profile;
}

/**
 * Unregisters a profile. Only deletes the config dir when explicitly requested —
 * that erases the local Claude Code session for the account.
 */
export function removeProfile(id: string, deleteDir: boolean): void {
  const store = load();
  const profile = store.profiles.find((p) => p.id === id);
  if (!profile) return;
  store.profiles = store.profiles.filter((p) => p.id !== id);
  save(store);
  if (deleteDir) {
    const home = path.resolve(os.homedir()).toLowerCase();
    const target = path.resolve(profile.configDir);
    // Refuse to delete anything that is not a directory under the user's home.
    if (!target.toLowerCase().startsWith(home) || target.toLowerCase() === home) {
      throw new Error("Refusing to delete a folder outside your home directory.");
    }
    fs.rmSync(target, { recursive: true, force: true });
  }
}

/** Export = profile metadata only. Never includes credentials. */
export function exportProfiles(): { version: 1; exportedAt: string; profiles: Profile[] } {
  return { version: 1, exportedAt: new Date().toISOString(), profiles: listProfiles() };
}
