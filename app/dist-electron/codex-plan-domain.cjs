"use strict";

// These are the plan identifiers exposed by Codex app-server. The current
// first-party client names the Pro tiers 100/200/500; quota percentages do not
// identify a subscription tier or a stable usage multiplier.
const CODEX_PLAN_LABELS = Object.freeze({
  free: "Free",
  go: "Go",
  plus: "Plus",
  prolite: "Pro 100",
  pro: "Pro 200",
  promax: "Pro 500",
  pro_5x: "Pro 5x",
  pro_20x: "Pro 20x",
  team: "Business",
  self_serve_business_prolite: "Business Premium",
  self_serve_business_usage_based: "Business",
  business: "Business",
  ent26: "Enterprise",
  enterprise_cbp_automation: "Enterprise",
  enterprise_cbp_usage_based: "Enterprise",
  enterprise: "Enterprise",
  edu: "Edu",
  edu_plus: "Edu Plus",
  edu_pro: "Edu Pro",
});

function normalizeCodexPlanType(value) {
  if (typeof value !== "string") return null;
  const plan = value.trim().toLowerCase();
  return /^[a-z][a-z0-9_-]{0,80}$/.test(plan) ? plan : null;
}

function formatCodexPlan(value) {
  const plan = normalizeCodexPlanType(value);
  return CODEX_PLAN_LABELS[plan] ?? "Plan unavailable";
}

function reconcileCodexAccountPlan(account, rateLimits) {
  if (!account || typeof account !== "object" || Array.isArray(account)) {
    return null;
  }
  if (account.type === "apiKey") {
    return { ...account, planLabel: "API key", planSource: "account" };
  }
  // account/read can reflect an older OAuth claim. rateLimits/read fetches a
  // fresh backend snapshot, so its plan wins on every poll and focus refresh.
  const livePlan =
    normalizeCodexPlanType(rateLimits?.rateLimitsByLimitId?.codex?.planType) ??
    normalizeCodexPlanType(rateLimits?.rateLimits?.planType);
  const plan = livePlan ?? normalizeCodexPlanType(account.planType);
  return {
    ...account,
    planType: plan,
    planLabel: formatCodexPlan(plan),
    planSource: livePlan === null ? "account" : "rateLimits",
  };
}

module.exports = {
  CODEX_PLAN_LABELS,
  formatCodexPlan,
  reconcileCodexAccountPlan,
};
