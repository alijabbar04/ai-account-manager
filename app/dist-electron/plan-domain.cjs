"use strict";

// Turns the subscription fields Claude Code stores beside each OAuth token into
// the short plan name shown on an account card ("Max 20x", "Pro", "Team
// Premium"). subscriptionType comes from .credentials.json and belongs to the
// token itself; orgType is only a fallback because .claude.json can be stale.
function usageMultiplier(rateLimitTier) {
  const match = String(rateLimitTier ?? "").match(/max_(\d+)x/i);
  return match ? match[1] : null;
}

function titleCase(value) {
  return String(value)
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function describeClaudePlan(identity) {
  if (!identity?.loggedIn) return null;
  const subscription = String(identity.subscriptionType ?? "").toLowerCase();
  const orgType = String(identity.orgType ?? "").toLowerCase();
  const seat = String(identity.seatTier ?? "").toLowerCase();
  const multiplier = usageMultiplier(identity.rateLimitTier);
  const plan =
    subscription ||
    (orgType.startsWith("claude_") ? orgType.slice("claude_".length) : "");

  if (plan === "max") return multiplier ? `Max ${multiplier}x` : "Max";
  if (plan === "pro") return "Pro";
  if (plan === "team") {
    // team_tier_1 is the Premium seat; it carries the Max 5x rate-limit tier.
    if (/premium|tier_1/.test(seat)) return "Team Premium";
    if (seat.includes("standard")) return "Team Standard";
    return multiplier ? `Team ${multiplier}x` : "Team";
  }
  if (plan === "enterprise") return "Enterprise";
  if (plan === "free") return "Free";
  return plan && plan.length <= 24 ? titleCase(plan) : null;
}

module.exports = { describeClaudePlan, usageMultiplier };
