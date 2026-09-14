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
  launcherDomain: path.join(
    root,
    "app",
    "dist-electron",
    "launcher-domain.cjs",
  ),
  usageReliabilityDomain: path.join(
    root,
    "app",
    "dist-electron",
    "usage-reliability-domain.cjs",
  ),
  safeStorageContinuity: path.join(
    root,
    "app",
    "dist-electron",
    "safe-storage-continuity.cjs",
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
  files.launcherDomain,
  files.usageReliabilityDomain,
  files.safeStorageContinuity,
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
  "launchers:claudeCowork",
  "launchers:codexChat",
  "launchers:vscodeCodex",
  "launchers:vscodeProject",
  "profiles:visibility:setHidden",
  "profiles:otherAccountsLayout:get",
  "profiles:otherAccountsLayout:set",
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
  "launchVSCode",
  "launchers",
  "visibility",
  "otherAccountsLayout",
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
  "New Claude Cowork",
  "New Codex chat",
  "New VS Code Codex",
  "Profile visibility",
  "Manage profile visibility",
  "Full width",
]) {
  assert.ok(renderer.includes(feature), `Renderer is missing ${feature}`);
}
assert.ok(
  !renderer.includes("View all other accounts →"),
  "Removed dashboard shortcut was reintroduced",
);
for (const removed of [
  "Open Claude",
  "PowerShell",
  "Your work and personal Claude accounts",
  "Your default Claude Code account",
  "Last active",
  "Sessions this week",
  "Lifetime tokens",
  "Peak day",
  "Current streak",
  "Usage resets",
]) {
  assert.ok(
    !renderer.includes(removed),
    `Removed UI text was reintroduced: ${removed}`,
  );
}
assert.ok(
  !renderer.includes('className: "gpt-stat-grid"'),
  "Removed GPT statistic markup remains",
);
const dashboardStart = renderer.indexOf("function Vv(");
const dashboardEnd = renderer.indexOf("function Ku(", dashboardStart);
const dashboardRenderer = renderer.slice(dashboardStart, dashboardEnd);
assert.ok(
  dashboardStart >= 0 &&
    dashboardRenderer.indexOf("i.jsx(GptUsageCard") <
      dashboardRenderer.indexOf("i.jsx(GlobalLaunchers"),
  "Global launchers must render after GPT / Codex usage",
);
assert.ok(
  main.includes("otherAccountsLayout: normalizeOtherAccountsLayout") &&
    main.includes("saveSettings({ otherAccountsLayout: layout })"),
  "Other Accounts layout is not normalized and persisted",
);
assert.ok(
  !main.includes('ipcMain.handle("launch"') &&
    !preload.includes('ipcRenderer.invoke("launch"'),
  "The stale generic profile launch route was reintroduced",
);
assert.ok(
  main.includes("shell: false") &&
    main.includes("validateProjectDirectory") &&
    main.includes("validateExternalTarget"),
  "Scoped launcher validation or shell-free argument-array spawning is missing",
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
  css.includes(".other-accounts-grid-wide") &&
    css.includes(".layout-segment[data-selected]") &&
    css.includes("grid-template-columns: minmax(0, 1fr)"),
  "Stacked dashboard cards or Other Accounts layout styling is missing",
);
assert.ok(
  !css.includes(".gpt-stat-grid") && !css.includes(".gpt-stat b"),
  "Unused GPT statistic styles remain",
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

// --- product identity -----------------------------------------------------
// The app is branded "AI Account Manager". Two identifiers deliberately are
// not, and both are load-bearing - see README, "Why the data folder is still
// named ClaudeAccountManager".
const appPackageJson = JSON.parse(
  fs.readFileSync(path.join(root, "app", "package.json"), "utf8"),
);
const indexHtml = fs.readFileSync(
  path.join(root, "app", "dist", "index.html"),
  "utf8",
);
const safeStorageContinuity = fs.readFileSync(
  files.safeStorageContinuity,
  "utf8",
);

assert.equal(packageJson.productName, "AI Account Manager");
assert.equal(packageJson.build.productName, "AI Account Manager");
assert.equal(appPackageJson.productName, "AI Account Manager");
assert.equal(packageJson.build.appId, "io.github.ai-account-manager");
assert.ok(
  packageJson.build.artifactName.startsWith("AI-Account-Manager-Setup-"),
  "Release artifacts must carry the product name",
);
assert.ok(
  indexHtml.includes("<title>AI Account Manager</title>"),
  "The window title must carry the product name",
);
for (const branded of [
  'title: "AI Account Manager"',
  '{ label: "Open AI Account Manager", click: showMainWindow }',
]) {
  assert.ok(main.includes(branded), `Main process is missing ${branded}`);
}
assert.ok(
  renderer.includes('children: "AI Account Manager"'),
  "The sidebar must carry the product name",
);
for (const [surface, text] of [
  ["Main process", main],
  ["Renderer", renderer],
  ["Preload", preload],
  ["Window title", indexHtml],
]) {
  assert.ok(
    !text.includes("Claude Account Manager"),
    `${surface} still carries the pre-rename product name`,
  );
}

// The data root is intentionally NOT renamed: changing it orphans every
// existing install's accounts, settings and encrypted API keys.
assert.ok(
  main.includes('"ClaudeAccountManager"'),
  "The pinned legacy data directory was renamed - existing installs would look empty",
);
// The rename must also keep carrying the safeStorage master key across, or
// every stored API key becomes undecryptable.
assert.ok(
  safeStorageContinuity.includes('"Claude Account Manager"'),
  "The legacy userData directory name is missing from the continuity module",
);
assert.ok(
  main.indexOf("adoptLegacySafeStorageKey({") > 0 &&
    main.indexOf("adoptLegacySafeStorageKey({") <
      main.indexOf("app.whenReady().then("),
  "The safeStorage key adoption must run before whenReady",
);

process.stdout.write("Runtime verification passed.\n");
