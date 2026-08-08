import { safeStorage } from "electron";
import { randomUUID } from "node:crypto";
import type { ApiKeyRecord, ProviderId } from "../../../shared/types";
import { apiKeyVaultFile, apiKeysFile, readJson, writeJsonAtomic } from "../paths";

/**
 * Secure storage for provider API keys.
 *
 * Two files, split so the secret and its metadata never live together:
 *  - api-keys.json        non-secret records (nickname, provider, masked key)
 *  - api-keys-vault.json  DPAPI-encrypted secrets, keyed by record id
 *
 * Secrets are encrypted with Electron `safeStorage`, which on Windows is backed
 * by DPAPI (the OS keeps the master key, scoped to the current Windows user) —
 * this is the "encrypted at rest / use the OS credential store" requirement.
 * The plaintext key is returned only to the main-process caller that needs to
 * make a provider request; it never crosses IPC to the renderer and is never
 * written to disk in the clear.
 */

interface RecordsShape {
  version: 1;
  records: ApiKeyRecord[];
}

interface VaultShape {
  version: 1;
  /** recordId -> base64(safeStorage ciphertext) */
  secrets: Record<string, string>;
}

function loadRecords(): RecordsShape {
  const data = readJson<RecordsShape>(apiKeysFile());
  if (data && Array.isArray(data.records)) return data;
  return { version: 1, records: [] };
}

function saveRecords(shape: RecordsShape): void {
  writeJsonAtomic(apiKeysFile(), shape);
}

function loadVault(): VaultShape {
  const data = readJson<VaultShape>(apiKeyVaultFile());
  if (data && data.secrets) return data;
  return { version: 1, secrets: {} };
}

function saveVault(shape: VaultShape): void {
  writeJsonAtomic(apiKeyVaultFile(), shape);
}

export function isEncryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

/**
 * Masks a secret for display/persistence: keeps the provider prefix and the
 * last 4 characters, everything between becomes asterisks. e.g.
 *   sk-ant-api03-abcd…wxyz  ->  sk-ant-*********************wxyz
 */
export function maskKey(secret: string): string {
  const trimmed = secret.trim();
  if (trimmed.length <= 8) return "*".repeat(Math.max(4, trimmed.length));
  // Keep a recognizable provider prefix through the 2nd hyphen if present
  // (e.g. "sk-ant-", "sk-or-", "sk-proj-"); else the first few chars.
  const secondHyphen = trimmed.indexOf("-", trimmed.indexOf("-") + 1);
  const prefixLen = secondHyphen >= 0 && secondHyphen <= 9 ? secondHyphen + 1 : Math.min(6, trimmed.length - 4);
  const prefix = trimmed.slice(0, prefixLen);
  const suffix = trimmed.slice(-4);
  const stars = "*".repeat(Math.max(6, Math.min(24, trimmed.length - prefix.length - 4)));
  return `${prefix}${stars}${suffix}`;
}

export function listRecords(): ApiKeyRecord[] {
  return loadRecords().records;
}

export function getRecord(id: string): ApiKeyRecord | undefined {
  return loadRecords().records.find((r) => r.id === id);
}

/** Returns the decrypted secret for a record, or null if unavailable. Main-process only. */
export function getSecret(id: string): string | null {
  const vault = loadVault();
  const enc = vault.secrets[id];
  if (!enc) return null;
  try {
    return safeStorage.decryptString(Buffer.from(enc, "base64"));
  } catch {
    return null;
  }
}

export interface AddKeyInput {
  provider: ProviderId;
  nickname: string;
  secret: string;
  isAdminKey?: boolean;
  monthlyBudgetUsd?: number | null;
}

export function addKey(input: AddKeyInput): ApiKeyRecord {
  if (!isEncryptionAvailable()) {
    throw new Error(
      "OS encryption (DPAPI) is unavailable, so the key cannot be stored securely. Aborting."
    );
  }
  const nickname = input.nickname.trim();
  const secret = input.secret.trim();
  if (!nickname) throw new Error("A nickname is required.");
  if (!secret) throw new Error("The API key is required.");

  const records = loadRecords();
  if (records.records.some((r) => r.nickname.toLowerCase() === nickname.toLowerCase())) {
    throw new Error(`A key named "${nickname}" already exists.`);
  }

  const id = randomUUID();
  const record: ApiKeyRecord = {
    id,
    provider: input.provider,
    nickname,
    maskedKey: maskKey(secret),
    createdAt: new Date().toISOString(),
    isAdminKey: input.isAdminKey ?? false,
    monthlyBudgetUsd: input.monthlyBudgetUsd ?? null
  };

  const vault = loadVault();
  vault.secrets[id] = safeStorage.encryptString(secret).toString("base64");
  saveVault(vault);

  records.records.push(record);
  saveRecords(records);
  return record;
}

export interface UpdateKeyInput {
  nickname?: string;
  isAdminKey?: boolean;
  monthlyBudgetUsd?: number | null;
  /** When provided, rotates the stored secret. */
  secret?: string;
}

export function updateKey(id: string, patch: UpdateKeyInput): ApiKeyRecord {
  const records = loadRecords();
  const record = records.records.find((r) => r.id === id);
  if (!record) throw new Error("Key not found.");

  if (patch.nickname !== undefined) {
    const nickname = patch.nickname.trim();
    if (!nickname) throw new Error("A nickname is required.");
    if (records.records.some((r) => r.id !== id && r.nickname.toLowerCase() === nickname.toLowerCase())) {
      throw new Error(`A key named "${nickname}" already exists.`);
    }
    record.nickname = nickname;
  }
  if (patch.isAdminKey !== undefined) record.isAdminKey = patch.isAdminKey;
  if (patch.monthlyBudgetUsd !== undefined) record.monthlyBudgetUsd = patch.monthlyBudgetUsd;

  if (patch.secret !== undefined) {
    const secret = patch.secret.trim();
    if (!secret) throw new Error("The API key is required.");
    if (!isEncryptionAvailable()) throw new Error("OS encryption is unavailable; cannot rotate the key.");
    const vault = loadVault();
    vault.secrets[id] = safeStorage.encryptString(secret).toString("base64");
    saveVault(vault);
    record.maskedKey = maskKey(secret);
  }

  saveRecords(records);
  return record;
}

export function removeKey(id: string): void {
  const records = loadRecords();
  records.records = records.records.filter((r) => r.id !== id);
  saveRecords(records);
  const vault = loadVault();
  if (vault.secrets[id]) {
    delete vault.secrets[id];
    saveVault(vault);
  }
}

/** Export = non-secret records only. Secrets are never included. */
export function exportRecords(): { version: 1; exportedAt: string; records: ApiKeyRecord[] } {
  return { version: 1, exportedAt: new Date().toISOString(), records: listRecords() };
}
