const test = require("node:test");
const assert = require("node:assert/strict");
const {
  describeClaudePlan,
  usageMultiplier,
} = require("../app/dist-electron/plan-domain.cjs");

const signedIn = (fields) => ({ loggedIn: true, ...fields });

test("Max plans carry their usage multiplier", () => {
  assert.equal(
    describeClaudePlan(
      signedIn({
        subscriptionType: "max",
        rateLimitTier: "default_claude_max_20x",
      }),
    ),
    "Max 20x",
  );
  assert.equal(
    describeClaudePlan(
      signedIn({
        subscriptionType: "max",
        rateLimitTier: "default_claude_max_5x",
      }),
    ),
    "Max 5x",
  );
  assert.equal(
    describeClaudePlan(signedIn({ subscriptionType: "max" })),
    "Max",
  );
});

test("Pro, Enterprise and Free plans use their plain names", () => {
  assert.equal(
    describeClaudePlan(signedIn({ subscriptionType: "pro" })),
    "Pro",
  );
  assert.equal(
    describeClaudePlan(signedIn({ subscriptionType: "enterprise" })),
    "Enterprise",
  );
  assert.equal(
    describeClaudePlan(signedIn({ subscriptionType: "free" })),
    "Free",
  );
});

test("Team plans name the seat when it is known", () => {
  assert.equal(
    describeClaudePlan(
      signedIn({
        subscriptionType: "team",
        seatTier: "team_tier_1",
        rateLimitTier: "default_claude_max_5x",
      }),
    ),
    "Team Premium",
  );
  assert.equal(
    describeClaudePlan(
      signedIn({
        subscriptionType: "team",
        seatTier: "team_standard",
        rateLimitTier: "default_raven",
      }),
    ),
    "Team Standard",
  );
  assert.equal(
    describeClaudePlan(
      signedIn({
        subscriptionType: "team",
        rateLimitTier: "default_claude_max_5x",
      }),
    ),
    "Team 5x",
  );
  assert.equal(
    describeClaudePlan(signedIn({ subscriptionType: "team" })),
    "Team",
  );
});

test("the token's subscription outranks a stale organisation type", () => {
  assert.equal(
    describeClaudePlan(
      signedIn({
        subscriptionType: "team",
        orgType: "claude_max",
        seatTier: "team_tier_1",
      }),
    ),
    "Team Premium",
  );
  assert.equal(
    describeClaudePlan(
      signedIn({ orgType: "claude_max", rateLimitTier: "claude_max_20x" }),
    ),
    "Max 20x",
  );
});

test("signed-out or unknown accounts show no plan", () => {
  assert.equal(describeClaudePlan(null), null);
  assert.equal(
    describeClaudePlan({ loggedIn: false, subscriptionType: "max" }),
    null,
  );
  assert.equal(describeClaudePlan(signedIn({})), null);
  assert.equal(
    describeClaudePlan(signedIn({ subscriptionType: "x".repeat(40) })),
    null,
  );
});

test("usageMultiplier reads only the max_Nx pattern", () => {
  assert.equal(usageMultiplier("default_claude_max_20x"), "20");
  assert.equal(usageMultiplier("default_raven"), null);
  assert.equal(usageMultiplier(undefined), null);
});
