import type { ProfileState, Severity, UsageLimit } from "../shared/types";

export type StatusKind = "ok" | "warn" | "crit" | "off" | "unknown";

export function severityRank(sev: Severity, percent: number): StatusKind {
  const s = (sev || "").toLowerCase();
  if (s.includes("crit") || s.includes("exceed") || s.includes("limit") || percent >= 100) return "crit";
  if (s.includes("warn") || s.includes("elevat") || percent >= 80) return "warn";
  return "ok";
}

export interface StatusInfo {
  kind: StatusKind;
  label: string;
}

export function accountStatus(state: ProfileState): StatusInfo {
  if (!state.identity.loggedIn) return { kind: "off", label: "Logged out" };
  const usage = state.usage;
  if (usage && !usage.ok && usage.error?.toLowerCase().includes("expired")) {
    return { kind: "crit", label: "Re-login needed" };
  }
  if (!usage || usage.limits.length === 0) return { kind: "unknown", label: "Usage unknown" };
  let worst: StatusKind = "ok";
  for (const l of usage.limits) {
    const r = severityRank(l.severity, l.percent);
    if (r === "crit") worst = "crit";
    else if (r === "warn" && worst !== "crit") worst = "warn";
  }
  if (worst === "crit") return { kind: "crit", label: "Rate limited" };
  if (worst === "warn") return { kind: "warn", label: "Usage high" };
  return { kind: "ok", label: "Active" };
}

/** Session first, then weekly (all models), then model-scoped rows. */
export function orderedLimits(limits: UsageLimit[]): UsageLimit[] {
  const weight = (l: UsageLimit) =>
    l.kind === "session" ? 0 : l.kind === "weekly_all" ? 1 : l.kind === "weekly_scoped" ? 2 : 3;
  return [...limits].sort((a, b) => weight(a) - weight(b));
}

export function limitLabel(l: UsageLimit): string {
  if (l.kind === "session") return "Session (5h)";
  if (l.kind === "weekly_all") return "Weekly · all models";
  if (l.kind === "weekly_scoped") return `Weekly · ${l.modelName ?? "model"}`;
  return l.kind.replace(/_/g, " ");
}
