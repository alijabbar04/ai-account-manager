const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const main = fs.readFileSync(
  path.join(__dirname, "../app/dist-electron/main.cjs"),
  "utf8",
);
const renderer = fs.readFileSync(
  path.join(__dirname, "../app/dist/assets/index-CfQCNBzk.js"),
  "utf8",
);
function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0);
  const end = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, end < 0 ? undefined : end);
}
const detect = vm.runInNewContext(
  `(${functionSource(renderer, "detectedAccountPlan")})`,
);
test("account plans report exact known multipliers without inventing missing tiers", () => {
  assert.equal(
    detect("claude", {
      subscriptionType: "max",
      rateLimitTier: "default_claude_max_5x",
    }),
    "Max 5x",
  );
  assert.equal(
    detect("claude", {
      subscriptionType: "max",
      rateLimitTier: "default_claude_max_20x",
    }),
    "Max 20x",
  );
  assert.equal(detect("claude", { subscriptionType: "pro" }), "Pro");
  assert.equal(detect("codex", { planType: "plus" }), "Plus");
  assert.equal(detect("codex", { planType: "pro_5x" }), "Pro 5x");
  assert.equal(
    detect("codex", { planType: "pro", planTier: "20x" }),
    "Pro 20x",
  );
  assert.equal(detect("codex", { planType: "pro" }), "Pro");
  assert.equal(detect("claude", { subscriptionType: "max" }), "Max");
  assert.equal(detect("codex", null), "Plan pending");
});
test("Claude project windows preserve isolated profile and folder as one argument", () => {
  const calls = [];
  const profile = { id: "work", configDir: "C:\\Profiles\\work" };
  const folder = "C:\\Projects\\Research & O'Brien";
  const environment = { CLAUDE_CONFIG_DIR: profile.configDir };
  const open = vm.runInNewContext(`(${functionSource(main, "openVSCode")})`, {
    vsCodeExecutable: () => "C:\\Code.exe",
    prepareProfileState: (value) => assert.equal(value, profile),
    vsCodeProfileName: () => "Claude Work",
    writeVSCodeProfileSettings: () => true,
    installClaudeVSCodeExtension: () => {},
    spawnDetachedExecutable: (...args) => calls.push(args),
    envFor: () => environment,
  });
  assert.equal(open(profile, folder).ok, true);
  assert.deepEqual(Array.from(calls[0][1]), [
    "--new-window",
    "--profile",
    "Claude Work",
    folder,
  ]);
  assert.equal(calls[0][2].env, environment);
  open(profile);
  assert.deepEqual(Array.from(calls[1][1]), [
    "--new-window",
    "--profile",
    "Claude Work",
  ]);
});
