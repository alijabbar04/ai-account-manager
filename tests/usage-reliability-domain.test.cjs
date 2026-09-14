const test = require("node:test");
const assert = require("node:assert/strict");
const {
  SerialRefreshCoordinator,
  exponentialBackoffMs,
  mergeProfileSnapshots,
  parseRetryAfter,
  retainFailedSnapshot,
} = require("../app/dist-electron/usage-reliability-domain.cjs");

test("stranded newer temp snapshots retain the last successful limits", () => {
  const good = {
    profile: {
      ok: true,
      fetchedAt: 100,
      limits: [{ kind: "session", percent: 42 }],
      extra: { enabled: true, usedCredits: 5 },
    },
  };
  const failedTemp = {
    profile: {
      ok: false,
      fetchedAt: 200,
      lastAttemptAt: 200,
      error: "rate limited",
      limits: [],
      retryAt: 500,
    },
  };
  const recovered = mergeProfileSnapshots([good, failedTemp]).profile;
  assert.equal(recovered.ok, false);
  assert.equal(recovered.stale, true);
  assert.equal(recovered.fetchedAt, 100);
  assert.deepEqual(recovered.limits, good.profile.limits);
  assert.deepEqual(recovered.extra, good.profile.extra);
});

test("a newer successful snapshot replaces stale data and malformed candidates are ignored", () => {
  const latest = {
    profile: { ok: true, fetchedAt: 300, limits: [{ percent: 7 }] },
  };
  assert.deepEqual(
    mergeProfileSnapshots([
      null,
      [],
      { profile: { ok: false, limits: [] } },
      latest,
    ]),
    latest,
  );
});

test("Retry-After and exponential backoff are bounded", () => {
  assert.equal(parseRetryAfter("1", 123), 30_000);
  assert.equal(parseRetryAfter("120", 123), 120_000);
  assert.equal(parseRetryAfter("not-a-date", 45_000), 45_000);
  assert.equal(
    parseRetryAfter("Thu, 01 Jan 2099 00:00:00 GMT", 123, 0),
    3_600_000,
  );
  assert.equal(exponentialBackoffMs(0), 120_000);
  assert.equal(exponentialBackoffMs(20), 1_800_000);
});

test("failed refreshes preserve real limits and mark them stale", () => {
  const previous = {
    ok: true,
    fetchedAt: 1_000,
    limits: [{ kind: "weekly_all", percent: 88 }],
    extra: { enabled: true },
  };
  const failed = retainFailedSnapshot(
    previous,
    "temporarily unavailable",
    { status: 503, retryAt: 9_000 },
    2_000,
  );
  assert.equal(failed.ok, false);
  assert.equal(failed.stale, true);
  assert.equal(failed.fetchedAt, 1_000);
  assert.equal(failed.lastAttemptAt, 2_000);
  assert.equal(failed.retryAt, 9_000);
  assert.deepEqual(failed.limits, previous.limits);
});

test("concurrent refreshes deduplicate per profile and serialize accounts", async () => {
  let fetches = 0;
  const order = [];
  const coordinator = new SerialRefreshCoordinator({
    gapMs: 10,
    now: (() => {
      let now = 0;
      return () => now;
    })(),
    wait: async (ms) => order.push(`wait:${ms}`),
  });
  const first = coordinator.run("profile-a", async () => {
    fetches += 1;
    order.push("a");
    return "first";
  });
  const duplicate = coordinator.run("profile-a", async () => {
    fetches += 1;
    return "duplicate";
  });
  const second = coordinator.run("profile-b", async () => {
    fetches += 1;
    order.push("b");
    return "second";
  });
  assert.deepEqual(await Promise.all([first, duplicate, second]), [
    "first",
    "first",
    "second",
  ]);
  assert.equal(fetches, 2);
  assert.deepEqual(order, ["wait:0", "a", "wait:10", "b"]);
});

test("429 failures retain usage while publishing retry metadata", () => {
  const previous = {
    ok: true,
    fetchedAt: 100,
    limits: [{ kind: "session", percent: 55 }],
  };
  const limited = retainFailedSnapshot(
    previous,
    "Usage refresh paused briefly (rate limit)",
    { status: 429, retryAt: 60_000 },
    200,
  );
  assert.equal(limited.status, 429);
  assert.equal(limited.retryAt, 60_000);
  assert.equal(limited.stale, true);
  assert.deepEqual(limited.limits, previous.limits);
});
