import type { Profile, UsageLimit, UsageSnapshot } from "../../shared/types";
import { readJson, snapshotsFile, writeJsonAtomic } from "./paths";
import { getValidAccessToken, TokenError } from "./tokenRefresh";

const USAGE_ENDPOINT = "https://api.anthropic.com/api/oauth/usage";
const OAUTH_BETA_HEADER = "oauth-2025-04-20";

/** Raw shape of the api/oauth/usage response (fields we consume). */
interface RawUsage {
  limits?: Array<{
    kind?: string;
    group?: string;
    percent?: number;
    severity?: string;
    resets_at?: string;
    is_active?: boolean;
    scope?: { model?: { display_name?: string } | null } | null;
  }>;
  five_hour?: { utilization?: number; resets_at?: string } | null;
  seven_day?: { utilization?: number; resets_at?: string } | null;
  extra_usage?: {
    is_enabled?: boolean;
    used_credits?: number;
    monthly_limit?: number | null;
    currency?: string;
    decimal_places?: number;
  } | null;
}

function normalize(raw: RawUsage): UsageSnapshot {
  const limits: UsageLimit[] = [];

  if (Array.isArray(raw.limits) && raw.limits.length > 0) {
    for (const l of raw.limits) {
      limits.push({
        kind: l.kind ?? "unknown",
        group: l.group,
        percent: typeof l.percent === "number" ? l.percent : 0,
        severity: l.severity ?? "normal",
        resetsAt: l.resets_at,
        modelName: l.scope?.model?.display_name ?? undefined,
        isActive: l.is_active
      });
    }
  } else {
    // Fallback if the limits array ever disappears: synthesize from window blocks.
    if (raw.five_hour) {
      limits.push({
        kind: "session",
        percent: raw.five_hour.utilization ?? 0,
        severity: "normal",
        resetsAt: raw.five_hour.resets_at
      });
    }
    if (raw.seven_day) {
      limits.push({
        kind: "weekly_all",
        percent: raw.seven_day.utilization ?? 0,
        severity: "normal",
        resetsAt: raw.seven_day.resets_at
      });
    }
  }

  return {
    fetchedAt: Date.now(),
    ok: true,
    limits,
    extra: raw.extra_usage
      ? {
          enabled: Boolean(raw.extra_usage.is_enabled),
          usedCredits: raw.extra_usage.used_credits,
          monthlyLimit: raw.extra_usage.monthly_limit,
          currency: raw.extra_usage.currency,
          decimalPlaces: raw.extra_usage.decimal_places
        }
      : undefined
  };
}

type SnapshotMap = Record<string, UsageSnapshot>;

/**
 * Fetches and caches usage per profile. Snapshots persist across app restarts
 * so the dashboard always has last-known data with an honest timestamp.
 */
export class UsageService {
  private cache: SnapshotMap;

  constructor() {
    this.cache = readJson<SnapshotMap>(snapshotsFile()) ?? {};
  }

  getCached(profileId: string): UsageSnapshot | null {
    return this.cache[profileId] ?? null;
  }

  dropProfile(profileId: string): void {
    delete this.cache[profileId];
    this.persist();
  }

  async refresh(profile: Profile): Promise<UsageSnapshot> {
    let snapshot: UsageSnapshot;
    try {
      const token = await getValidAccessToken(profile.configDir);
      const res = await fetch(USAGE_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
          "anthropic-beta": OAUTH_BETA_HEADER
        }
      });
      if (!res.ok) {
        const relogin = res.status === 401 || res.status === 403;
        snapshot = this.failed(
          profile.id,
          relogin ? "Session expired — log in again from a terminal" : `Usage API error (HTTP ${res.status})`
        );
      } else {
        snapshot = normalize((await res.json()) as RawUsage);
      }
    } catch (err) {
      const msg =
        err instanceof TokenError
          ? err.needsRelogin
            ? "Session expired — log in again from a terminal"
            : err.message
          : `Offline or unreachable: ${(err as Error).message}`;
      snapshot = this.failed(profile.id, msg);
    }
    this.cache[profile.id] = snapshot;
    this.persist();
    return snapshot;
  }

  /** Failed fetch keeps the previous limits so the UI can show stale-but-real data. */
  private failed(profileId: string, error: string): UsageSnapshot {
    const prev = this.cache[profileId];
    return {
      fetchedAt: prev?.ok ? prev.fetchedAt : Date.now(),
      ok: false,
      error,
      limits: prev?.ok ? prev.limits : [],
      extra: prev?.ok ? prev.extra : undefined
    };
  }

  private persist(): void {
    writeJsonAtomic(snapshotsFile(), this.cache);
  }
}
