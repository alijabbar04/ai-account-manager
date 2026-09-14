"use strict";

const MIN_RETRY_MS = 30 * 1_000;
const MAX_RETRY_MS = 60 * 60 * 1_000;

function mergeProfileSnapshots(values) {
  const merged = {};
  for (const value of Array.isArray(values) ? values : []) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    for (const [profileId, candidate] of Object.entries(value)) {
      if (!candidate || typeof candidate !== "object") continue;
      const previous = merged[profileId];
      const lostPreviousLimits =
        !candidate.ok &&
        (!Array.isArray(candidate.limits) || candidate.limits.length === 0) &&
        Array.isArray(previous?.limits) &&
        previous.limits.length > 0;
      merged[profileId] = lostPreviousLimits
        ? {
            ...candidate,
            fetchedAt: previous.fetchedAt,
            lastSuccessAt:
              candidate.lastSuccessAt ??
              previous.lastSuccessAt ??
              (previous.ok ? previous.fetchedAt : undefined),
            stale: true,
            limits: previous.limits,
            extra: previous.extra,
          }
        : candidate;
    }
  }
  return merged;
}

function parseRetryAfter(value, fallbackMs, now = Date.now()) {
  if (typeof value !== "string" || value.trim() === "") return fallbackMs;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(MIN_RETRY_MS, Math.min(MAX_RETRY_MS, seconds * 1_000));
  }
  const date = Date.parse(value);
  return Number.isFinite(date)
    ? Math.max(MIN_RETRY_MS, Math.min(MAX_RETRY_MS, date - now))
    : fallbackMs;
}

function exponentialBackoffMs(
  failureCount,
  baseMs = 2 * 60 * 1_000,
  maximumMs = 30 * 60 * 1_000,
) {
  const failures = Math.max(0, Math.trunc(Number(failureCount) || 0));
  return Math.min(maximumMs, baseMs * Math.pow(2, failures));
}

function retainFailedSnapshot(previous, error, details = {}, now = Date.now()) {
  const hasPrevious =
    Array.isArray(previous?.limits) && previous.limits.length > 0;
  return {
    fetchedAt: hasPrevious ? previous.fetchedAt : now,
    lastAttemptAt: now,
    lastSuccessAt:
      previous?.lastSuccessAt ??
      (previous?.ok ? previous.fetchedAt : undefined),
    ok: false,
    error,
    stale: hasPrevious,
    status: details.status,
    retryAt: details.retryAt,
    failureCount: (previous?.failureCount ?? 0) + 1,
    limits: hasPrevious ? previous.limits : [],
    extra: hasPrevious ? previous.extra : undefined,
  };
}

class SerialRefreshCoordinator {
  constructor({ gapMs = 0, now = Date.now, wait } = {}) {
    this.gapMs = Math.max(0, Number(gapMs) || 0);
    this.now = now;
    this.wait =
      wait ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.inFlight = new Map();
    this.queue = Promise.resolve();
    this.nextAt = 0;
  }

  run(key, task) {
    const active = this.inFlight.get(key);
    if (active) return active;
    const scheduled = this.queue
      .catch(() => undefined)
      .then(async () => {
        await this.wait(Math.max(0, this.nextAt - this.now()));
        this.nextAt = this.now() + this.gapMs;
        return task();
      });
    this.queue = scheduled.catch(() => undefined);
    this.inFlight.set(key, scheduled);
    return scheduled.finally(() => {
      if (this.inFlight.get(key) === scheduled) this.inFlight.delete(key);
    });
  }
}

module.exports = {
  MAX_RETRY_MS,
  MIN_RETRY_MS,
  SerialRefreshCoordinator,
  exponentialBackoffMs,
  mergeProfileSnapshots,
  parseRetryAfter,
  retainFailedSnapshot,
};
