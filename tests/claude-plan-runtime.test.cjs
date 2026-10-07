const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CACHE_FRESH_MS,
  ClaudePlanService,
  PROFILE_ENDPOINT,
  normalizeClaudeProfile,
} = require("../app/dist-electron/claude-plan-runtime.cjs");

function profile(
  type = "claude_max",
  tier = "default_claude_max_5x",
  accountUuid = "account-a",
) {
  return {
    account: {
      uuid: accountUuid,
      email: "example@example.invalid",
      display_name: "Unused name",
    },
    organization: {
      uuid: "organization-a",
      organization_type: type,
      rate_limit_tier: tier,
    },
  };
}

function ok(raw) {
  return { ok: true, status: 200, json: async () => raw };
}

test("Claude profile reports specific Max tiers without retaining response identity details", () => {
  const metadata = normalizeClaudeProfile(profile());
  assert.equal(metadata.subscriptionType, "max");
  assert.equal(metadata.planLabel, "Max 5x");
  assert.equal(
    normalizeClaudeProfile(profile("claude_max", "default_claude_max_20x"))
      .planLabel,
    "Max 20x",
  );
  assert.equal(JSON.stringify(metadata).includes("example@"), false);
  assert.equal(JSON.stringify(metadata).includes("Unused name"), false);
  assert.equal(normalizeClaudeProfile({ organization: {} }), null);
});

test("server plan labels are validated and new unknown tiers are not guessed", () => {
  const raw = profile("new_plan", null);
  raw.organization.plan_display_name = "Claude Premium+";
  assert.equal(normalizeClaudeProfile(raw).planLabel, "Claude Premium+");
  raw.organization.plan_display_name = "<script>wrong</script>";
  const metadata = normalizeClaudeProfile(raw);
  assert.equal(metadata.planLabel, null);
  assert.equal(metadata.subscriptionType, null);
});

test("live subscription changes replace stale credentials on the next refresh", async () => {
  let now = 1_000;
  let calls = 0;
  let raw = profile();
  const service = new ClaudePlanService({
    now: () => now,
    fetchImpl: async (url, options) => {
      calls += 1;
      assert.equal(url, PROFILE_ENDPOINT);
      assert.equal(options.headers.Authorization, "Bearer test-token");
      assert.equal(options.headers["Cache-Control"], "no-cache");
      return ok(raw);
    },
  });
  const identity = {
    loggedIn: true,
    accountUuid: "account-a",
    subscriptionType: "max",
    rateLimitTier: "default_claude_max_20x",
  };
  await service.refresh("config-a", "test-token", { accountUuid: "account-a" });
  assert.equal(
    service.attachIdentity("config-a", identity).planLabel,
    "Max 5x",
  );
  await service.refresh("config-a", "test-token");
  assert.equal(calls, 1);
  now += CACHE_FRESH_MS;
  raw = profile("claude_pro", "default_claude_pro");
  await service.refresh("config-a", "test-token");
  const updated = service.attachIdentity("config-a", identity);
  assert.equal(updated.subscriptionType, "pro");
  assert.equal(updated.rateLimitTier, "default_claude_pro");
  assert.equal(updated.planLabel, "Pro");
  assert.equal(calls, 2);
  assert.equal(
    JSON.stringify([...service.cache.values()]).includes("test-token"),
    false,
  );
});

test("429 backoff and request deduplication prevent repeated metadata polling", async () => {
  let now = 1_000;
  let calls = 0;
  const service = new ClaudePlanService({
    now: () => now,
    fetchImpl: async () => {
      calls += 1;
      return { ok: false, status: 429, headers: { get: () => "600" } };
    },
  });
  await Promise.all([
    service.refresh("config-a", "test-token", { accountUuid: "account-a" }),
    service.refresh("config-a", "test-token", { accountUuid: "account-a" }),
  ]);
  assert.equal(calls, 1);
  now += CACHE_FRESH_MS;
  await service.refresh("config-a", "test-token", {
    force: true,
    accountUuid: "account-a",
  });
  assert.equal(calls, 1);
  now += CACHE_FRESH_MS;
  await service.refresh("config-a", "test-token", { accountUuid: "account-a" });
  assert.equal(calls, 2);
});

test("refresh failure retains the last detected plan and never leaks network errors", async () => {
  let now = 1_000;
  let fail = false;
  const service = new ClaudePlanService({
    now: () => now,
    fetchImpl: async () => {
      if (fail) throw new Error("sensitive-token-in-network-exception");
      return ok(profile());
    },
  });
  await service.refresh("config-a", "test-token");
  now += CACHE_FRESH_MS;
  fail = true;
  const retained = await service.refresh("config-a", "test-token");
  assert.equal(retained.planLabel, "Max 5x");
  assert.equal(
    JSON.stringify([...service.cache.values()]).includes("sensitive-token"),
    false,
  );
});

test("signing in as another account cannot inherit the previous account plan", async () => {
  let current = profile();
  const service = new ClaudePlanService({ fetchImpl: async () => ok(current) });
  await service.refresh("config-a", "first-token", {
    accountUuid: "account-a",
  });
  const different = {
    loggedIn: true,
    accountUuid: "account-b",
    subscriptionType: "pro",
  };
  assert.deepEqual(service.attachIdentity("config-a", different), different);
  current = profile("claude_pro", "default_claude_pro", "account-b");
  await service.refresh("config-a", "second-token", {
    accountUuid: "account-b",
  });
  assert.equal(service.attachIdentity("config-a", different).planLabel, "Pro");
  const loggedOut = { loggedIn: false };
  assert.deepEqual(service.attachIdentity("config-a", loggedOut), loggedOut);
});

test("unrecognized replacement plan clears a previous Pro/Max classification", async () => {
  let now = 1_000;
  let current = profile();
  const service = new ClaudePlanService({
    now: () => now,
    fetchImpl: async () => ok(current),
  });
  await service.refresh("config-a", "token");
  now += CACHE_FRESH_MS;
  current = profile("other_plan", null);
  await service.refresh("config-a", "token");
  const identity = service.attachIdentity("config-a", {
    loggedIn: true,
    subscriptionType: "max",
    rateLimitTier: "default_claude_max_20x",
  });
  assert.equal(identity.subscriptionType, null);
  assert.equal(identity.rateLimitTier, null);
  assert.equal(identity.planLabel, null);
});
