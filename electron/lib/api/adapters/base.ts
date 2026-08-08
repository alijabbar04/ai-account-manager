import type { ApiKeyRecord, ProviderMeta, ProviderSnapshot } from "../../../../shared/types";

export interface KeyKind {
  valid: boolean;
  isAdminKey: boolean;
}

export interface ProviderAdapter {
  meta: ProviderMeta;
  /** Format-only check (offline). Also guesses whether it's an admin/org key. */
  detectKeyKind(secret: string): KeyKind;
  /** Live poll → one cumulative snapshot. Must never throw; returns ok:false on failure. */
  fetchSnapshot(secret: string, record: ApiKeyRecord): Promise<ProviderSnapshot>;
  /** Optional one-time backfill of historical daily snapshots (seeds charts). */
  fetchHistory?(secret: string, record: ApiKeyRecord): Promise<ProviderSnapshot[]>;
}

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Fetch helper that treats the secret as radioactive: it is only ever placed on
 * the caller-provided headers and is never included in thrown errors or logs.
 * Returns a normalized result the adapters turn into snapshots.
 */
export async function safeFetch(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ ok: boolean; status: number; json: unknown; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    let json: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    if (!res.ok) {
      return { ok: false, status: res.status, json, error: describeStatus(res.status) };
    }
    return { ok: true, status: res.status, json };
  } catch (err) {
    const msg = (err as Error).name === "AbortError" ? "Request timed out" : "Network error / offline";
    return { ok: false, status: 0, json: null, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

export function describeStatus(status: number): string {
  switch (status) {
    case 401:
      return "Key rejected (401) — invalid or revoked";
    case 403:
      return "Forbidden (403) — this key lacks permission (may need an admin/management key)";
    case 404:
      return "Endpoint not found (404)";
    case 429:
      return "Rate limited (429) — try again shortly";
    default:
      return status >= 500 ? `Provider error (${status})` : `Request failed (${status})`;
  }
}

/** A failed snapshot that preserves nothing sensitive. */
export function failedSnapshot(at: number, error: string): ProviderSnapshot {
  return { at, ok: false, error };
}
