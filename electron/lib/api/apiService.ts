import type {
  AnalyticsSummary,
  ApiKeyRecord,
  ApiKeyState,
  ChartSeries,
  MetricKind,
  ProviderId,
  ProviderSnapshot,
  RangeKind,
  WindowUsage
} from "../../../shared/types";
import {
  avgDailySpend,
  computeStatus,
  dailyBuckets,
  isSparse,
  projectSpend,
  windowUsage
} from "./analytics";
import { PROVIDER_META, PROVIDER_ORDER, getAdapter } from "./adapters/index";
import * as keyStore from "./keyStore";
import * as snapshots from "./snapshotStore";

const RANGE_DAYS: Record<RangeKind, number> = { "1d": 1, "7d": 7, "30d": 30, lifetime: 0 };

/** Windowed cost, preferring provider-supplied direct windows over derivation. */
function costWindows(series: ProviderSnapshot[], latest: ProviderSnapshot | null, now: number): WindowUsage {
  const derived = windowUsage(series, "cost", now);
  const direct = latest?.ok ? latest.directCost : undefined;
  if (!direct) return derived;
  return {
    today: direct.today ?? derived.today,
    week: direct.week ?? derived.week,
    month: direct.month ?? derived.month,
    lifetime: direct.lifetime ?? derived.lifetime
  };
}

/**
 * Test-only synthetic data (guarded by CAM_FAKE_PROVIDERS=1), so the full stack
 * — encrypted key store, snapshots, analytics, IPC, UI — can be verified E2E
 * without live provider keys or network. Deterministic; never used in prod.
 */
function fakeHistory(record: ApiKeyRecord, now: number): ProviderSnapshot[] {
  const DAY = 24 * 60 * 60 * 1000;
  const hasBalance = record.provider === "openrouter";
  const reportsCost = record.provider === "openrouter" || record.isAdminKey;
  if (!reportsCost) return [];
  const out: ProviderSnapshot[] = [];
  let cumulative = 0;
  const limit = 50;
  for (let i = 14; i >= 0; i--) {
    const at = now - i * DAY;
    const daily = 0.4 + ((i * 37) % 11) / 10; // deterministic 0.4–1.4/day
    cumulative += daily;
    out.push({
      at,
      ok: true,
      currency: "USD",
      lifetimeCostUsd: Number(cumulative.toFixed(4)),
      lifetimeTokens: Math.round(cumulative * 90000),
      lifetimeRequests: Math.round(cumulative * 40),
      balanceUsd: hasBalance ? Number((limit - cumulative).toFixed(4)) : null,
      creditLimitUsd: hasBalance ? limit : null
    });
  }
  return out;
}

export class ApiService {
  private get fake(): boolean {
    return process.env.CAM_FAKE_PROVIDERS === "1";
  }

  /** Poll one key and persist the result (+ optional history backfill on first run). */
  async refreshKey(id: string): Promise<void> {
    const record = keyStore.getRecord(id);
    if (!record) return;

    if (this.fake) {
      if (snapshots.getSeries(id).length === 0) snapshots.seedHistory(id, fakeHistory(record, Date.now()));
      const hist = snapshots.getSeries(id);
      const last = hist[hist.length - 1];
      snapshots.appendSnapshot(id, {
        at: Date.now(),
        ok: true,
        currency: "USD",
        lifetimeCostUsd: last?.lifetimeCostUsd ?? 0,
        lifetimeTokens: last?.lifetimeTokens ?? null,
        lifetimeRequests: last?.lifetimeRequests ?? null,
        balanceUsd: last?.balanceUsd ?? null,
        creditLimitUsd: last?.creditLimitUsd ?? null,
        directCost:
          record.provider === "openrouter" || record.isAdminKey
            ? { today: 1.2, week: 7.1, month: 14.3, lifetime: last?.lifetimeCostUsd ?? 0 }
            : undefined,
        tier: record.provider === "gemini" ? "AI Studio key — no usage/billing API" : undefined
      });
      return;
    }

    const secret = keyStore.getSecret(id);
    if (!secret) {
      snapshots.appendSnapshot(id, { at: Date.now(), ok: false, error: "Stored key could not be decrypted" });
      return;
    }
    const adapter = getAdapter(record.provider);

    const hadHistory = snapshots.getSeries(id).length > 0;
    if (!hadHistory && adapter.fetchHistory) {
      try {
        const history = await adapter.fetchHistory(secret, record);
        snapshots.seedHistory(id, history);
      } catch {
        /* backfill is best-effort */
      }
    }

    const snapshot = await adapter.fetchSnapshot(secret, record);
    snapshots.appendSnapshot(id, snapshot);
  }

  async refreshAll(id?: string): Promise<void> {
    const records = keyStore.listRecords().filter((r) => !id || r.id === id);
    await Promise.allSettled(records.map((r) => this.refreshKey(r.id)));
  }

  /** Validate a candidate key without storing it. Never persists the secret. */
  async validate(provider: ProviderId, secret: string): Promise<{ ok: boolean; isAdminKey: boolean; error?: string }> {
    const adapter = getAdapter(provider);
    const kind = adapter.detectKeyKind(secret);
    if (!kind.valid) {
      return { ok: false, isAdminKey: kind.isAdminKey, error: "That doesn't look like a valid key for this provider." };
    }
    if (this.fake) return { ok: true, isAdminKey: kind.isAdminKey };
    const probe = await adapter.fetchSnapshot(secret, {
      id: "probe",
      provider,
      nickname: "probe",
      maskedKey: "",
      createdAt: new Date().toISOString(),
      isAdminKey: kind.isAdminKey
    });
    return { ok: probe.ok, isAdminKey: kind.isAdminKey, error: probe.error };
  }

  buildKeyState(record: ApiKeyRecord, now: number): ApiKeyState {
    const series = snapshots.getSeries(record.id);
    const latest = series.length ? series[series.length - 1] : null;
    const meta = PROVIDER_META[record.provider];

    const usage: Record<MetricKind, WindowUsage> = {
      cost: costWindows(series, latest, now),
      tokens: windowUsage(series, "tokens", now),
      requests: windowUsage(series, "requests", now)
    };

    const balanceUsd = latest?.ok && typeof latest.balanceUsd === "number" ? latest.balanceUsd : null;
    const creditLimitUsd = latest?.ok && typeof latest.creditLimitUsd === "number" ? latest.creditLimitUsd : null;

    const projection = projectSpend(series, balanceUsd, now);
    const status = computeStatus({
      record,
      latest,
      monthSpend: usage.cost.month,
      runwayDays: projection.runwayDays,
      balanceUsd
    });

    return {
      record,
      meta,
      latest,
      status,
      usage,
      derivedFromSnapshots: !(latest?.ok && latest.directCost),
      balanceUsd,
      creditLimitUsd,
      currency: latest?.currency ?? "USD",
      lastUpdated: latest?.at ?? null,
      avgDailySpendUsd: projection.avgDailySpendUsd,
      projectedMonthlyUsd: projection.projectedMonthlyUsd,
      runwayDays: projection.runwayDays
    };
  }

  buildKeyStates(now = Date.now()): ApiKeyState[] {
    return keyStore.listRecords().map((r) => this.buildKeyState(r, now));
  }

  buildChart(id: string, metric: MetricKind, range: RangeKind, now = Date.now()): ChartSeries {
    const series = snapshots.getSeries(id);
    return {
      metric,
      range,
      buckets: dailyBuckets(series, metric, RANGE_DAYS[range], now),
      sparse: isSparse(series, metric)
    };
  }

  buildSummary(now = Date.now()): AnalyticsSummary {
    const states = this.buildKeyStates(now);

    let totalBalance = 0;
    let hasBalance = false;
    let spendToday = 0;
    let spendWeek = 0;
    let spendMonth = 0;
    let avgDaily = 0;

    const perProvider = new Map<ProviderId, number>();
    for (const s of states) {
      if (s.balanceUsd !== null) {
        totalBalance += s.balanceUsd;
        hasBalance = true;
      }
      spendToday += s.usage.cost.today;
      spendWeek += s.usage.cost.week;
      spendMonth += s.usage.cost.month;
      avgDaily += s.avgDailySpendUsd ?? 0;
      perProvider.set(s.record.provider, (perProvider.get(s.record.provider) ?? 0) + s.usage.cost.month);
    }

    const perProviderMonthSpend = PROVIDER_ORDER.filter((p) => perProvider.has(p)).map((provider) => ({
      provider,
      displayName: PROVIDER_META[provider].displayName,
      spend: perProvider.get(provider) ?? 0
    }));

    const top = [...perProviderMonthSpend].sort((a, b) => b.spend - a.spend)[0];

    // Shortest runway across keys that have one.
    let shortestRunway: AnalyticsSummary["shortestRunway"] = null;
    for (const s of states) {
      if (s.runwayDays !== null && Number.isFinite(s.runwayDays)) {
        if (!shortestRunway || s.runwayDays < shortestRunway.days) {
          shortestRunway = { keyId: s.record.id, nickname: s.record.nickname, days: s.runwayDays };
        }
      }
    }

    // Most-used model: not derivable without per-request data on most providers.
    const mostUsedModel: string | null = null;

    return {
      totalBalanceUsd: hasBalance ? totalBalance : null,
      spendToday,
      spendWeek,
      spendMonth,
      avgDailySpendUsd: avgDaily,
      projectedMonthlyUsd: avgDaily * 30,
      topProvider: top && top.spend > 0 ? { provider: top.provider, displayName: top.displayName, spendMonth: top.spend } : null,
      mostUsedModel,
      shortestRunway,
      perProviderMonthSpend
    };
  }

  onRemoveKey(id: string): void {
    snapshots.dropSeries(id);
  }
}

/** Exposed for tests. */
export { avgDailySpend };
