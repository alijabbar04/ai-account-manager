const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const files = {
  main: path.join(root, "app", "dist-electron", "main.cjs"),
  preload: path.join(root, "app", "dist-electron", "preload.cjs"),
  renderer: path.join(root, "app", "dist", "assets", "index-CfQCNBzk.js"),
  css: path.join(root, "app", "dist", "assets", "index-DR09S7BQ.css"),
  automationDomain: path.join(
    root,
    "app",
    "dist-electron",
    "automation-domain.cjs",
  ),
  automationRuntime: path.join(
    root,
    "app",
    "dist-electron",
    "automation-runtime.cjs",
  ),
  selectors: path.join(
    root,
    "automation",
    "selectors",
    "automation-selectors.v1.json",
  ),
  helperProject: path.join(
    root,
    "automation",
    "src",
    "AIAccountManager.Automation",
    "AIAccountManager.Automation.csproj",
  ),
};

for (const [name, file] of Object.entries(files)) {
  assert.ok(fs.existsSync(file), `${name} runtime file is missing`);
}

for (const file of [
  files.main,
  files.preload,
  files.renderer,
  files.automationDomain,
  files.automationRuntime,
]) {
  const check = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  assert.equal(check.status, 0, check.stderr || `Syntax check failed: ${file}`);
}

const main = fs.readFileSync(files.main, "utf8");
const preload = fs.readFileSync(files.preload, "utf8");
const renderer = fs.readFileSync(files.renderer, "utf8");

for (const channel of [
  "account/usage/read",
  "claude:history",
  "alerts:get",
  "alerts:set",
  "updates:check",
  "automation:getState",
  "automation:setSettings",
  "automation:diagnostics",
  "automation:clearActivity",
  "sessions:openLoginLink",
  "sessions:cleanupData",
]) {
  assert.ok(main.includes(channel), `Main process is missing ${channel}`);
}
for (const discoveryPath of [
  '"OpenAI", "Codex", "bin"',
  '"openai.chatgpt-"',
  '"codex-win32-x64"',
]) {
  assert.ok(
    main.includes(discoveryPath),
    `Codex discovery is missing ${discoveryPath}`,
  );
}
for (const bridge of [
  "getGptUsage",
  "getClaudeHistory",
  "refreshGptUsage",
  "alerts",
  "updates",
  "automation",
  "onActivityChanged",
  "openLoginLink",
]) {
  assert.ok(preload.includes(bridge), `Preload bridge is missing ${bridge}`);
}
for (const feature of [
  "Account token history",
  "Usage alerts",
  "Detected key type",
  "App updates",
  "Automation & Sessions",
  "Unattended permissions",
  "Session launcher",
  "Redacted activity history",
  "Provider capability matrix",
]) {
  assert.ok(renderer.includes(feature), `Renderer is missing ${feature}`);
}
assert.ok(
  !renderer.includes("View all other accounts →"),
  "Removed dashboard shortcut was reintroduced",
);

const automationDomain = fs.readFileSync(files.automationDomain, "utf8");
const automationRuntime = fs.readFileSync(files.automationRuntime, "utf8");
const css = fs.readFileSync(files.css, "utf8");
const selectors = JSON.parse(fs.readFileSync(files.selectors, "utf8"));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

assert.ok(
  automationDomain.includes("automationEnabled: acknowledged"),
  "Automation must fail closed until risk acknowledgement",
);
assert.ok(
  automationDomain.includes(
    "dryRun: acknowledged ? source.dryRun !== false : true",
  ),
  "Automation must default to Dry run before acknowledgement",
);
assert.ok(
  automationDomain.includes("--user-data-dir=") &&
    !automationRuntime.includes("--remote-debugging-port") &&
    !automationDomain.includes("--remote-debugging-port"),
  "Managed browser profiles must stay isolated without remote debugging",
);
assert.ok(
  main.includes('args: ["--background"]') &&
    main.includes("globalShortcut.register"),
  "Background startup and the emergency global hotkey are required",
);
assert.ok(
  css.includes(".automation-sessions-view") &&
    css.includes(".automation-provider-grid"),
  "Automation tab styling is missing",
);
assert.ok(
  selectors.providers.every((provider) => provider.liveEligible === false),
  "UIA production invocation must remain blocked until a selector passes a live test",
);
assert.ok(
  packageJson.build.extraResources.some(
    (resource) => resource.to === "automation",
  ),
  "The self-contained automation helper is not packaged",
);

process.stdout.write("Runtime verification passed.\n");
