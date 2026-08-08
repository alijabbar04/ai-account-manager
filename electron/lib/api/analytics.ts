import type {
  ApiKeyRecord,
  DayBucket,
  MetricKind,
  ProviderSnapshot,
  StatusKind,
  WindowUsage
} from "../../../shared/types";

/**
 * Analytics engine. Pure functions over a per-key time-series of cumulative
 * snapshots. The app is not a proxy, so it cannot observe individual requests;
 * instead every provider that exposes a running total (spend, tokens, requests,
 * or a decrementing balance) is polled periodically, and windowed usage +
 * trends are derived from the DELTAS between snapshots.
 *
 * All functions are deterministic given (snapshots, now) so they can be unit
 * tested with synthetic fixtures.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const CUMULATIVE_FIELD: Record<MetricKind, keyof ProviderSnapshot> = {
  cost: "lifetimeCostUsd",
  tokens: "lifetimeTokens",
  requests: "lifetimeRequests"
};

/** Snapshots that carry a numeric cumulative value for the metric, sorted ascending by time. */
function seriesFor(
  snapshots: ProviderSnapshot[],
  metric: MetricKind
): Array<{ at: number; value: number }> {
  const field = CUMULATIVE_FIELD[metric];
  return snapshots
    .filter((s) => s.ok && typeof s[field] === "number" && Number.isFinite(s[field] as number))
    .map((s) => ({ at: s.at, value: s[field] as number }))
    .sort((a, b) => a.at - b.at);
}

/**
 * Consumption between two times from a cumulative series. Handles counter
 * resets: if the cumulative value ever drops (provider reset, new billing
 * period, balance top-up), the drop is not counted as negative usage — each
 * monotonic run contributes its own increase.
 */
export function consumptionBetween(
  series: Array<{ at: number; value: number }>,
  fromMs: number,
  toMs: number
): number {
  const pts = series.filter((p) => p.at >= fromMs && p.at <= toMs);
  // Anchor with the last point at/just before `fromMs` so usage that happened
  // between that baseline and the first in-window point is attributed correctly.
  const baseline = [...series].reverse().find((p) => p.at <= fromMs);
  const walk = baseline ? [baseline, ...pts] : pts;
  let total = 0;
  for (let i = 1; i < walk.length; i++) {
    const delta = walk[i].value - walk[i - 1].value;
    if (delta > 0) total += delta;
  }
  return total;
}

/** Total lifetime consumption captured in the series (sum of positive increases). */
export function lifetimeConsumption(series: Array<{ at: number; value: number }>): number {
  if (series.length === 0) return 0;
  let total = 0;
  for (let i = 1; i < series.length; i++) {
    const delta = series[i].value - series[i - 1].value;
    if (delta > 0) total += delta;
  }
  // If only one snapshot exists we can't derive a delta; the single reading is
  // the best lifetime proxy for providers whose counter is already a lifetime total.
  return series.length === 1 ? series[0].value : total;
}

/** Start of the local day containing `ms`. */
function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function windowUsage(snapshots: ProviderSnapshot[], metric: MetricKind, now: number): WindowUsage {
  const series = seriesFor(snapshots, metric);
  if (series.length === 0) return { today: 0, week: 0, month: 0, lifetime: 0 };
  const todayStart = startOfLocalDay(now);
  return {
    today: consumptionBetween(series, todayStart, now),
    week: consumptionBetween(series, now - 7 * DAY_MS, now),
    month: consumptionBetween(series, now - 30 * DAY_MS, now),
    lifetime: lifetimeConsumption(series)
  };
}

function localDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Per-day buckets over the last `days` days (or the whole series for lifetime).
 * `daily` is the consumption within that day; `running` is the cumulative
 * total across the returned range. Days with no data are zero-filled so the
 * chart has a continuous x-axis.
 */
export function dailyBuckets(
  snapshots: ProviderSnapshot[],
  metric: MetricKind,
  days: number,
  now: number
): DayBucket[] {
  const series = seriesFor(snapshots, metric);
  const spanDays = days > 0 ? days : lifetimeSpanDays(series, now);
  const buckets: DayBucket[] = [];
  let running = 0;
  for (let i = spanDays - 1; i >= 0; i--) {
    const dayStart = startOfLocalDay(now - i * DAY_MS);
    const dayEnd = dayStart + DAY_MS;
    const daily = consumptionBetween(series, dayStart, Math.min(dayEnd, now));
    running += daily;
    buckets.push({ date: localDateKey(dayStart), daily, running });
  }
  return buckets;
}

function lifetimeSpanDays(series: Array<{ at: number; value: number }>, now: number): number {
  if (series.length === 0) return 1;
  const first = series[0].at;
  return Math.max(1, Math.ceil((now - startOfLocalDay(first)) / DAY_MS) + 1);
}

/** Fewer than 2 snapshots (or all within one day) means no trend can be drawn yet. */
export function isSparse(snapshots: ProviderSnapshot[], metric: MetricKind): boolean {
  const series = seriesFor(snapshots, metric);
  if (series.length < 2) return true;
  return series[series.length - 1].at - series[0].at < DAY_MS / 2;
}

/**
 * Average daily spend (USD) over a lookback window, using observed daily
 * buckets. Only days that actually have snapshot coverage count toward the
 * average, so a key added yesterday isn't averaged against 30 empty days.
 */
export function avgDailySpend(snapshots: ProviderSnapshot[], now: number, lookbackDays = 14): number | null {
  const series = seriesFor(snapshots, "cost");
  if (series.length < 2) return null;
  const coverageStart = Math.max(series[0].at, now - lookbackDays * DAY_MS);
  const spent = consumptionBetween(series, coverageStart, now);
  const coveredDays = Math.max(1, (now - coverageStart) / DAY_MS);
  return spent / coveredDays;
}

export interface Projection {
  avgDailySpendUsd: number | null;
  projectedMonthlyUsd: number | null;
  runwayDays: number | null;
}

export function projectSpend(
  snapshots: ProviderSnapshot[],
  balanceUsd: number | null | undefined,
  now: number
): Projection {
  const avg = avgDailySpend(snapshots, now);
  const projectedMonthly = avg === null ? null : avg * 30;
  let runway: number | null = null;
  if (avg !== null && avg > 0 && typeof balanceUsd === "number" && balanceUsd >= 0) {
    runway = balanceUsd / avg;
  }
  return { avgDailySpendUsd: avg, projectedMonthlyUsd: projectedMonthly, runwayDays: runway };
}

/**
 * Status light. Considers, in order of severity:
 *  - prepaid runway (days of balance left at current burn)
 *  - budget utilization (month spend vs user-set monthly budget)
 *  - rate-limit headroom is point-in-time and handled in the UI separately.
 */
export function computeStatus(params: {
  record: ApiKeyRecord;
  latest: ProviderSnapshot | null;
  monthSpend: number;
  runwayDays: number | null;
  balanceUsd: number | null;
}): StatusKind {
  const { record, latest, monthSpend, runwayDays, balanceUsd } = params;
  if (!latest || !latest.ok) return "unknown";

  // Runway-based (prepaid): red under 7 days, yellow under 21.
  if (runwayDays !== null) {
    if (runwayDays < 7) return "red";
    if (runwayDays < 21) return "yellow";
  }
  // Balance floor for prepaid credits without a reliable burn rate.
  if (runwayDays === null && typeof balanceUsd === "number" && balanceUsd >= 0) {
    if (balanceUsd <= 2) return "red";
    if (balanceUsd <= 10) return "yellow";
  }
  // Budget utilization.
  if (typeof record.monthlyBudgetUsd === "number" && record.monthlyBudgetUsd > 0) {
    const pct = (monthSpend / record.monthlyBudgetUsd) * 100;
    if (pct >= 100) return "red";
    if (pct >= 80) return "yellow";
  }
  return "green";
}

/** Human phrasing for a runway, matching the brief's examples. */
export function runwayPhrase(runwayDays: number | null): string | null {
  if (runwayDays === null || !Number.isFinite(runwayDays)) return null;
  const days = Math.floor(runwayDays);
  if (days <= 0) return "Credits are effectively exhausted at the current burn rate.";
  return `Approximately ${days} day${days === 1 ? "" : "s"} remaining at the current burn rate.`;
}
