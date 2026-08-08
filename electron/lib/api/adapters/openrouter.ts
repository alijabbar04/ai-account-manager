import type { ApiKeyRecord, ProviderMeta, ProviderSnapshot } from "../../../../shared/types";
import { failedSnapshot, safeFetch, type KeyKind, type ProviderAdapter } from "./base";

export const OPENROUTER_META: ProviderMeta = {
  id: "openrouter",
  displayName: "OpenRouter",
  keyPrefixes: ["sk-or-"],
  docsUrl: "https://openrouter.ai/docs/api-reference/limits",
  accent: "#4a3aa7", // violet
  supportsAdminKey: false,
  billingModel: "prepaid",
  capabilities: { balance: "exact", usage: "exact", cost: "exact", rateLimits: "exact" }
};

interface KeyResponse {
  data?: {
    label?: string;
    limit?: number | null;
    limit_remaining?: number | null;
    is_free_tier?: boolean;
    usage?: number;
    usage_daily?: number;
    usage_weekly?: number;
    usage_monthly?: number;
    rate_limit?: { requests?: number; interval?: string } | null;
  };
}

interface CreditsResponse {
  data?: { total_credits?: number; total_usage?: number };
}

export const openRouterAdapter: ProviderAdapter = {
  meta: OPENROUTER_META,

  detectKeyKind(secret: string): KeyKind {
    return { valid: /^sk-or-\S+/.test(secret.trim()), isAdminKey: false };
  },

  async fetchSnapshot(secret: string, _record: ApiKeyRecord): Promise<ProviderSnapshot> {
    const at = Date.now();
    const auth = { Authorization: `Bearer ${secret}` };

    const keyRes = await safeFetch("https://openrouter.ai/api/v1/key", { headers: auth });
    if (!keyRes.ok) return failedSnapshot(at, keyRes.error ?? "Failed to read key info");

    const d = (keyRes.json as KeyResponse).data ?? {};

    // Balance: prefer /credits (true prepaid balance); fall back to key limit_remaining.
    let balanceUsd: number | null = null;
    let creditLimitUsd: number | null = null;
    const creditsRes = await safeFetch("https://openrouter.ai/api/v1/credits", { headers: auth });
    if (creditsRes.ok) {
      const c = (creditsRes.json as CreditsResponse).data ?? {};
      if (typeof c.total_credits === "number") {
        creditLimitUsd = c.total_credits;
        balanceUsd = c.total_credits - (c.total_usage ?? 0);
      }
    }
    if (balanceUsd === null && typeof d.limit_remaining === "number") {
      balanceUsd = d.limit_remaining;
      creditLimitUsd = typeof d.limit === "number" ? d.limit : null;
    }

    const rpmLimit =
      d.rate_limit && typeof d.rate_limit.requests === "number" ? d.rate_limit.requests : null;

    return {
      at,
      ok: true,
      currency: "USD",
      balanceUsd,
      creditLimitUsd,
      lifetimeCostUsd: typeof d.usage === "number" ? d.usage : null,
      rpmLimit,
      tier: d.is_free_tier ? "free" : undefined,
      directCost: {
        today: d.usage_daily,
        week: d.usage_weekly,
        month: d.usage_monthly,
        lifetime: d.usage
      }
    };
  }
};
