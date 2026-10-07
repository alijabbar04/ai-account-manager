"use strict";

const path = require("node:path");
const {
  exponentialBackoffMs,
  parseRetryAfter,
} = require("./usage-reliability-domain.cjs");

const PROFILE_ENDPOINT = "https://api.anthropic.com/api/oauth/profile";
const CACHE_FRESH_MS = 5 * 60 * 1_000;
const MIN_REQUEST_INTERVAL_MS = 60 * 1_000;
const SUBSCRIPTION_TYPES = new Map([
  ["claude_pro", "pro"],
  ["claude_max", "max"],
  ["claude_team", "team"],
  ["claude_enterprise", "enterprise"],
]);

function textOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function planLabelForMetadata(metadata) {
  if (metadata.subscriptionType === "max") {
    if (metadata.rateLimitTier === "default_claude_max_20x") return "Max 20x";
    if (metadata.rateLimitTier === "default_claude_max_5x") return "Max 5x";
  }
  if (metadata.planDisplayName) return metadata.planDisplayName;
  if (metadata.subscriptionType === "team") {
    if (metadata.seatTier === "premium") return "Team Premium";
    if (metadata.seatTier === "standard") return "Team Standard";
  }
  const labels = {
    pro: "Pro",
    max: "Max",
    team: "Team",
    enterprise: "Enterprise",
  };
  return labels[metadata.subscriptionType] ?? null;
}

function normalizeClaudeProfile(raw) {
  // Match the account/organization shape validated by Claude Code's OAuth
  // profile request. Store only subscription metadata, never the full response.
  if (
    !raw ||
    typeof raw !== "object" ||
    !textOrNull(raw.account?.uuid) ||
    typeof raw.account?.email !== "string" ||
    !textOrNull(raw.organization?.uuid)
  ) {
    return null;
  }
  const org = raw.organization;
  const displayName = textOrNull(org.plan_display_name);
  const metadata = {
    accountUuid: raw.account.uuid,
    orgType: textOrNull(org.organization_type),
    subscriptionType: SUBSCRIPTION_TYPES.get(org.organization_type) ?? null,
    rateLimitTier: textOrNull(org.rate_limit_tier),
    seatTier: textOrNull(org.seat_tier),
    billingType: textOrNull(org.billing_type),
    planDisplayName:
      displayName &&
      /^[\p{L}\p{N}](?:[\p{L}\p{N} .+-]{0,38}[\p{L}\p{N}+])?$/u.test(
        displayName,
      )
        ? displayName
        : null,
  };
  return { ...metadata, planLabel: planLabelForMetadata(metadata) };
}

class ClaudePlanService {
  constructor({
    fetchImpl = globalThis.fetch,
    now = Date.now,
    cacheFreshMs = CACHE_FRESH_MS,
  } = {}) {
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.cacheFreshMs = Math.max(MIN_REQUEST_INTERVAL_MS, cacheFreshMs);
    this.cache = new Map();
    this.inFlight = new Map();
  }

  key(configDir) {
    const key = path.resolve(configDir);
    return process.platform === "win32" ? key.toLowerCase() : key;
  }

  getCached(configDir) {
    return this.cache.get(this.key(configDir))?.metadata ?? null;
  }

  attachIdentity(configDir, identity) {
    if (!identity?.loggedIn) return identity;
    const metadata = this.getCached(configDir);
    if (!metadata) return identity;
    // A user may sign in to a different account in the same config directory.
    // Do not put the previous account's subscription onto its replacement.
    if (identity.accountUuid && identity.accountUuid !== metadata.accountUuid)
      return identity;
    return { ...identity, ...metadata };
  }

  drop(configDir) {
    this.cache.delete(this.key(configDir));
  }

  async refresh(configDir, accessToken, { force = false, accountUuid } = {}) {
    if (typeof accessToken !== "string" || !accessToken) return null;
    const key = this.key(configDir);
    const active = this.inFlight.get(key);
    if (active) return active;
    let cached = this.cache.get(key);
    if (
      accountUuid &&
      cached?.accountUuid &&
      cached.accountUuid !== accountUuid
    ) {
      cached = undefined;
      this.cache.delete(key);
    }
    const now = this.now();
    const requestInterval = force ? MIN_REQUEST_INTERVAL_MS : this.cacheFreshMs;
    if (
      cached &&
      (cached.retryAt > now || now - cached.lastAttemptAt < requestInterval)
    ) {
      return cached.metadata ?? null;
    }
    const request = this.fetchMetadata(key, accessToken, accountUuid, cached);
    this.inFlight.set(key, request);
    try {
      return await request;
    } finally {
      if (this.inFlight.get(key) === request) this.inFlight.delete(key);
    }
  }

  async fetchMetadata(key, accessToken, accountUuid, previous) {
    const lastAttemptAt = this.now();
    let status;
    let retryAt;
    try {
      // These endpoint, headers and fields follow Claude Code's profile fetch,
      // rather than guessing the tier from quota percentages or token age.
      const response = await this.fetchImpl(PROFILE_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        signal: AbortSignal.timeout(10_000),
      });
      status = response.status;
      if (response.ok) {
        const normalized = normalizeClaudeProfile(await response.json());
        if (
          normalized &&
          (!accountUuid || normalized.accountUuid === accountUuid)
        ) {
          const metadata = { ...normalized, planCheckedAt: this.now() };
          this.cache.set(key, {
            metadata,
            accountUuid: normalized.accountUuid,
            lastAttemptAt,
            failureCount: 0,
          });
          return metadata;
        }
      } else if (status === 429 || status >= 500) {
        const fallback = exponentialBackoffMs(previous?.failureCount ?? 0);
        retryAt =
          this.now() +
          parseRetryAfter(
            response.headers?.get("retry-after"),
            fallback,
            this.now(),
          );
      }
    } catch {
      // Metadata failure must not turn a successful usage refresh into a login
      // error or expose an authentication-bearing exception to the renderer.
      retryAt = this.now() + exponentialBackoffMs(previous?.failureCount ?? 0);
    }
    this.cache.set(key, {
      metadata: previous?.metadata ?? null,
      accountUuid: accountUuid ?? previous?.accountUuid,
      lastAttemptAt,
      failureCount: (previous?.failureCount ?? 0) + 1,
      retryAt,
      status,
    });
    return previous?.metadata ?? null;
  }
}

module.exports = {
  CACHE_FRESH_MS,
  MIN_REQUEST_INTERVAL_MS,
  PROFILE_ENDPOINT,
  ClaudePlanService,
  normalizeClaudeProfile,
  planLabelForMetadata,
};
