import type { ProviderSnapshot } from "../../../shared/types";
import { apiSnapshotsFile, readJson, writeJsonAtomic } from "../paths";

/**
 * Per-key time-series of cumulative snapshots. Kept compact: consecutive
 * successful readings with identical cumulative values collapse to the latest
 * (so idle keys don't bloat the file), and each series is capped.
 */

const MAX_PER_KEY = 2000;

interface Shape {
  version: 1;
  series: Record<string, ProviderSnapshot[]>;
}

function load(): Shape {
  const data = readJson<Shape>(apiSnapshotsFile());
  if (data && data.series) return data;
  return { version: 1, series: {} };
}

function save(shape: Shape): void {
  writeJsonAtomic(apiSnapshotsFile(), shape);
}

export function getSeries(keyId: string): ProviderSnapshot[] {
  return load().series[keyId] ?? [];
}

function sameCumulative(a: ProviderSnapshot, b: ProviderSnapshot): boolean {
  return (
    a.ok &&
    b.ok &&
    a.lifetimeCostUsd === b.lifetimeCostUsd &&
    a.lifetimeTokens === b.lifetimeTokens &&
    a.lifetimeRequests === b.lifetimeRequests &&
    a.balanceUsd === b.balanceUsd
  );
}

export function appendSnapshot(keyId: string, snapshot: ProviderSnapshot): void {
  const shape = load();
  const series = shape.series[keyId] ?? [];
  const last = series[series.length - 1];

  // Collapse a run of identical cumulative readings: keep the first (marks when
  // the value was reached) and overwrite the trailing duplicate with the newest
  // timestamp, so we don't store a point every 10 minutes for an idle key.
  if (last && sameCumulative(last, snapshot) && series.length >= 2 && sameCumulative(series[series.length - 2], last)) {
    series[series.length - 1] = snapshot;
  } else {
    series.push(snapshot);
  }

  if (series.length > MAX_PER_KEY) series.splice(0, series.length - MAX_PER_KEY);
  shape.series[keyId] = series;
  save(shape);
}

/** Merge backfilled history, keeping chronological order and de-duping by timestamp-day. */
export function seedHistory(keyId: string, history: ProviderSnapshot[]): void {
  if (history.length === 0) return;
  const shape = load();
  const existing = shape.series[keyId] ?? [];
  const merged = [...history, ...existing].sort((a, b) => a.at - b.at);
  shape.series[keyId] = merged.slice(-MAX_PER_KEY);
  save(shape);
}

export function dropSeries(keyId: string): void {
  const shape = load();
  if (shape.series[keyId]) {
    delete shape.series[keyId];
    save(shape);
  }
}

export function latest(keyId: string): ProviderSnapshot | null {
  const series = getSeries(keyId);
  return series.length ? series[series.length - 1] : null;
}
