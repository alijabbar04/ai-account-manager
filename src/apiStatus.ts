import type { ApiKeyState, Capability, StatusKind } from "../shared/types";

export const STATUS_LABEL: Record<StatusKind, string> = {
  green: "Healthy",
  yellow: "Watch",
  red: "Critical",
  unknown: "Unknown"
};

/** Short human explanation for a key's current status. */
export function statusReason(s: ApiKeyState): string {
  if (!s.latest) return "No data yet — refreshing.";
  if (!s.latest.ok) return s.latest.error ?? "Last refresh failed.";
  if (s.status === "unknown") return "Connected; no spend data available for this key type.";
  if (s.runwayDays !== null && s.runwayDays < 21) {
    const d = Math.floor(s.runwayDays);
    return `~${d} day${d === 1 ? "" : "s"} of credit left at current burn.`;
  }
  if (s.record.monthlyBudgetUsd && s.usage.cost.month > 0) {
    const pct = Math.round((s.usage.cost.month / s.record.monthlyBudgetUsd) * 100);
    return `${pct}% of monthly budget used.`;
  }
  return "Within normal thresholds.";
}

export const CAPABILITY_LABEL: Record<Capability, string> = {
  exact: "Live",
  admin: "Admin key",
  derived: "Tracked",
  estimated: "Estimated",
  none: "Unavailable"
};
