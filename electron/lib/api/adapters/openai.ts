import type { ApiKeyRecord, ProviderMeta, ProviderSnapshot } from "../../../../shared/types";
import { failedSnapshot, safeFetch, type KeyKind, type ProviderAdapter } from "./base";

export const OPENAI_META: ProviderMeta = {
  id: "openai",
  displayName: "OpenAI",
  keyPrefixes: ["sk-proj-", "sk-admin-", "sk-svcacct-", "sk-"],
  docsUrl: "https://platform.openai.com/docs/api-reference/usage",
  accent: "#1baf7a", // aqua/green
  supportsAdminKey: true,
  billingModel: "postpaid",
  capabilities: { balance: "none", usage: "admin", cost: "admin", rateLimits: "none" }
};

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 30;

interface CostEnvelope {
  data?: Array<{
    start_time?: number;
    results?: Array<{ amount?: { value?: number; currency?: string } }>;
  }>;
}

interface UsageEnvelope {
  data?: Array<{
    start_time?: number;
    results?: Array<{ input_tokens?: number; output_tokens?: number; num_model_requests?: number }>;
  }>;
}

async function validate(secret: string): Promise<{ ok: boolean; error?: string }> {
  const res = await safeFetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${secret}` }
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export const openAiAdapter: ProviderAdapter = {
  meta: OPENAI_META,

  detectKeyKind(secret: string): KeyKind {
    const s = secret.trim();
    return { valid: s.startsWith("sk-"), isAdminKey: s.startsWith("sk-admin-") };
  },

  async fetchSnapshot(secret: string, record: ApiKeyRecord): Promise<ProviderSnapshot> {
    const at = Date.now();
    const isAdmin = record.isAdminKey || secret.trim().startsWith("sk-admin-");

    if (!isAdmin) {
      const v = await validate(secret);
      if (!v.ok) return failedSnapshot(at, v.error ?? "Validation failed");
      return {
        at,
        ok: true,
        currency: "USD",
        balanceUsd: null,
        lifetimeCostUsd: null,
        tier: "project key — add an admin key for cost/usage"
      };
    }

    const startTime = Math.floor((at - LOOKBACK_DAYS * DAY_MS) / 1000);
    const auth = { Authorization: `Bearer ${secret}` };

    // Costs (USD, daily buckets).
    const costRes = await safeFetch(
      `https://api.openai.com/v1/organization/costs?start_time=${startTime}&bucket_width=1d&limit=31`,
      { headers: auth }
    );
    if (!costRes.ok) return failedSnapshot(at, costRes.error ?? "Costs endpoint failed");

    const costEnv = costRes.json as CostEnvelope;
    const todayStart = Math.floor(new Date(at).setHours(0, 0, 0, 0) / 1000);
    let costToday = 0;
    let costWeek = 0;
    let costMonth = 0;
    const weekStart = Math.floor((at - 7 * DAY_MS) / 1000);
    for (const bucket of costEnv.data ?? []) {
      const t = bucket.start_time ?? 0;
      const amount = (bucket.results ?? []).reduce((sum, r) => sum + (r.amount?.value ?? 0), 0);
      costMonth += amount;
      if (t >= weekStart) costWeek += amount;
      if (t >= todayStart) costToday += amount;
    }

    // Token/request usage (completions modality; best effort).
    let tokensMonth = 0;
    let requestsMonth = 0;
    const usageRes = await safeFetch(
      `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&bucket_width=1d&limit=31`,
      { headers: auth }
    );
    if (usageRes.ok) {
      const env = usageRes.json as UsageEnvelope;
      for (const bucket of env.data ?? []) {
        for (const r of bucket.results ?? []) {
          tokensMonth += (r.input_tokens ?? 0) + (r.output_tokens ?? 0);
          requestsMonth += r.num_model_requests ?? 0;
        }
      }
    }

    return {
      at,
      ok: true,
      currency: "USD",
      balanceUsd: null,
      lifetimeCostUsd: costMonth,
      lifetimeTokens: tokensMonth || null,
      lifetimeRequests: requestsMonth || null,
      directCost: { today: costToday, week: costWeek, month: costMonth, lifetime: costMonth },
      tier: "admin key"
    };
  }
};
