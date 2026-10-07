const test = require("node:test");
const assert = require("node:assert/strict");
const {
  formatCodexPlan,
  reconcileCodexAccountPlan,
} = require("../app/dist-electron/codex-plan-domain.cjs");

test("Codex uses backend plan identifiers for distinct Pro tiers", () => {
  assert.equal(formatCodexPlan("prolite"), "Pro 100");
  assert.equal(formatCodexPlan("pro"), "Pro 200");
  assert.equal(formatCodexPlan("promax"), "Pro 500");
  assert.equal(formatCodexPlan(" PLUS "), "Plus");
  assert.equal(formatCodexPlan("pro_5x"), "Pro 5x");
  assert.equal(formatCodexPlan("pro_20x"), "Pro 20x");
});

test("fresh Codex plan overrides stale OAuth account claims on upgrade and downgrade", () => {
  const account = Object.freeze({ type: "chatgpt", planType: "plus" });
  const upgraded = reconcileCodexAccountPlan(account, {
    rateLimitsByLimitId: { codex: { planType: "pro" } },
  });
  assert.equal(upgraded.planType, "pro");
  assert.equal(upgraded.planLabel, "Pro 200");
  assert.equal(upgraded.planSource, "rateLimits");
  const downgraded = reconcileCodexAccountPlan(upgraded, {
    rateLimitsByLimitId: { codex: { planType: "free" } },
  });
  assert.equal(downgraded.planLabel, "Free");
  assert.equal(account.planType, "plus");
});

test("Codex bucket takes precedence and legacy snapshots remain supported", () => {
  const account = { type: "chatgpt", planType: "plus" };
  assert.equal(
    reconcileCodexAccountPlan(account, {
      rateLimits: { planType: "plus" },
      rateLimitsByLimitId: { codex: { planType: "prolite" } },
    }).planLabel,
    "Pro 100",
  );
  assert.equal(
    reconcileCodexAccountPlan(account, {
      rateLimits: { planType: "promax" },
    }).planLabel,
    "Pro 500",
  );
  const fallback = reconcileCodexAccountPlan(account, {
    rateLimits: { planType: null },
  });
  assert.equal(fallback.planLabel, "Plus");
  assert.equal(fallback.planSource, "account");
});

test("unknown plans and percentages never become guessed paid tiers", () => {
  const unavailable = reconcileCodexAccountPlan(
    { type: "chatgpt", planType: "pro" },
    { rateLimits: { planType: "unknown", secondary: { usedPercent: 20 } } },
  );
  assert.equal(unavailable.planLabel, "Plan unavailable");
  assert.equal(unavailable.planType, "unknown");
  assert.equal(formatCodexPlan("future_plan"), "Plan unavailable");
  assert.equal(formatCodexPlan(null), "Plan unavailable");
  assert.equal(formatCodexPlan("pro\n<script>"), "Plan unavailable");
  assert.equal(reconcileCodexAccountPlan(null, {}), null);
  assert.equal(
    reconcileCodexAccountPlan({ type: "apiKey" }, {}).planLabel,
    "API key",
  );
});
