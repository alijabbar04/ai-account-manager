import type { ApiKeyRecord, ProviderMeta, ProviderSnapshot } from "../../../../shared/types";
import { failedSnapshot, safeFetch, type KeyKind, type ProviderAdapter } from "./base";

export const GEMINI_META: ProviderMeta = {
  id: "gemini",
  displayName: "Google Gemini",
  keyPrefixes: ["AIza", "AQ."],
  docsUrl: "https://ai.google.dev/gemini-api/docs/rate-limits",
  accent: "#eda100", // yellow
  supportsAdminKey: false,
  billingModel: "postpaid",
  // AI Studio keys expose nothing but validity; everything else is unavailable.
  capabilities: { balance: "none", usage: "none", cost: "estimated", rateLimits: "none" }
};

export const geminiAdapter: ProviderAdapter = {
  meta: GEMINI_META,

  detectKeyKind(secret: string): KeyKind {
    const s = secret.trim();
    // Prefix is not reliable (AIza vs AQ.); accept both, validate by calling.
    return { valid: s.length > 10, isAdminKey: false };
  },

  async fetchSnapshot(secret: string, _record: ApiKeyRecord): Promise<ProviderSnapshot> {
    const at = Date.now();
    // models.list is the only key-scoped, quota-free endpoint; confirms validity.
    const res = await safeFetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(secret)}`
    );
    if (!res.ok) return failedSnapshot(at, res.error ?? "Validation failed");
    return {
      at,
      ok: true,
      currency: "USD",
      balanceUsd: null,
      lifetimeCostUsd: null,
      tier: "AI Studio key — no usage/billing API (see provider notes)"
    };
  }
};
