import type { ApiKeyRecord, ProviderMeta, ProviderSnapshot } from "../../../../shared/types";
import { failedSnapshot, safeFetch, type KeyKind, type ProviderAdapter } from "./base";

export const ANTHROPIC_META: ProviderMeta = {
  id: "anthropic",
  displayName: "Anthropic (Claude)",
  keyPrefixes: ["sk-ant-api", "sk-ant-admin", "sk-ant-"],
  docsUrl: "https://platform.claude.com/docs/en/manage-claude/usage-cost-api",
  accent: "#d97757", // coral
  supportsAdminKey: true,
  billingModel: "postpaid",
  // Cost/usage need an admin key; balance never available; rate limits admin-only.
  capabilities: { balance: "none", usage: "admin", cost: "admin", rateLimits: "admin" }
};

const API_VERSION = "2023-06-01";
const DAY_MS = 24 * 60 * 60 * 1000;
/** Admin usage/cost reports cap 1d granularity at ~31 buckets; stay within that. */
const LOOKBACK_DAYS = 30;

interface ReportEnvelope {
  data?: Array<{ starting_at?: string; results?: Array<Record<string, unknown>> }>;
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** Validate a standard (non-admin) key cheaply — no tokens billed. */
async function validate(secret: string): Promise<{ ok: boolean; error?: string }> {
  const res = await safeFetch("https://api.anthropic.com/v1/models", {
    headers: { "x-api-key": secret, "anthropic-version": API_VERSION }
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export const anthropicAdapter: ProviderAdapter = {
  meta: ANTHROPIC_META,

  detectKeyKind(secret: string): KeyKind {
    const s = secret.trim();
    return { valid: s.startsWith("sk-ant-"), isAdminKey: s.startsWith("sk-ant-admin") };
  },

  async fetchSnapshot(secret: string, record: ApiKeyRecord): Promise<ProviderSnapshot> {
    const at = Date.now();
    const isAdmin = record.isAdminKey || secret.trim().startsWith("sk-ant-admin");

    // Without an admin key we can only confirm the key is live; no metrics exist.
    if (!isAdmin) {
      const v = await validate(secret);
      if (!v.ok) return failedSnapshot(at, v.error ?? "Validation failed");
      return {
        at,
        ok: true,
        currency: "USD",
        balanceUsd: null,
        lifetimeCostUsd: null,
        tier: "standard key — add an admin key for cost/usage"
      };
    }

    const startingAt = new Date(at - LOOKBACK_DAYS * DAY_MS).toISOString();
    const endingAt = new Date(at).toISOString();
    const adminHeaders = { "x-api-key": secret, "anthropic-version": API_VERSION };

    // Cost report (USD per day).
    const costRes = await safeFetch(
      `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${encodeURIComponent(
        startingAt
      )}&ending_at=${encodeURIComponent(endingAt)}`,
      { headers: adminHeaders }
    );
    if (!costRes.ok) return failedSnapshot(at, costRes.error ?? "Cost report failed");

    const costEnv = costRes.json as ReportEnvelope;
    const todayStart = new Date(at).setHours(0, 0, 0, 0);
    let costToday = 0;
    let costWeek = 0;
    let costMonth = 0;
    for (const bucket of costEnv.data ?? []) {
      const bucketMs = bucket.starting_at ? Date.parse(bucket.starting_at) : NaN;
      const amount = (bucket.results ?? []).reduce((sum, r) => sum + num(r.amount ?? r.cost), 0);
      costMonth += amount;
      if (Number.isFinite(bucketMs)) {
        if (bucketMs >= at - 7 * DAY_MS) costWeek += amount;
        if (bucketMs >= todayStart) costToday += amount;
      }
    }

    // Usage report (tokens / requests per day) — best effort; fields vary.
    let tokensMonth = 0;
    let requestsMonth = 0;
    const usageRes = await safeFetch(
      `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${encodeURIComponent(
        startingAt
      )}&ending_at=${encodeURIComponent(endingAt)}&bucket_width=1d`,
      { headers: adminHeaders }
    );
    if (usageRes.ok) {
      const env = usageRes.json as ReportEnvelope;
      for (const bucket of env.data ?? []) {
        for (const r of bucket.results ?? []) {
          tokensMonth +=
            num(r.uncached_input_tokens) +
            num(r.cache_creation_input_tokens) +
            num(r.cache_read_input_tokens) +
            num(r.output_tokens) +
            num(r.input_tokens); // tolerate either schema
          requestsMonth += num(r.num_requests ?? r.request_count);
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
