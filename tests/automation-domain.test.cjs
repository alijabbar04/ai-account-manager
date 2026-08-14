const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  AUTOMATION_SCHEMA_VERSION,
  SELECTOR_REVISION,
  buildBrowserLaunchCommand,
  buildCliArguments,
  isPathInside,
  migrateSettingsContainer,
  redactAuditRecord,
  sanitizeAutomationSettings,
  sanitizeLoginUrl,
  sanitizeSessionProfile,
} = require("../app/dist-electron/automation-domain.cjs");

test("automation settings migrate fail-closed until risk acknowledgement", () => {
  const settings = sanitizeAutomationSettings({
    automationEnabled: true,
    dryRun: false,
    approvalDelayMs: -20,
    fallbackPollMs: 100,
    logRetentionDays: 999,
  });
  assert.equal(settings.schemaVersion, AUTOMATION_SCHEMA_VERSION);
  assert.equal(settings.automationEnabled, false);
  assert.equal(settings.dryRun, true);
  assert.equal(settings.approvalDelayMs, 0);
  assert.equal(settings.fallbackPollMs, 1_000);
  assert.equal(settings.logRetentionDays, 365);
  assert.equal(settings.selectorRevision, SELECTOR_REVISION);
});

test("unvalidated provider methods migrate to detection only", () => {
  const settings = sanitizeAutomationSettings({
    firstRunAcknowledged: true,
    providers: {
      claudeDesktop: {
        enabled: true,
        method: "native-auto-with-uia-fallback",
      },
      chatgptDesktop: {
        enabled: true,
        method: "native-auto-review-with-uia-fallback",
      },
    },
    selectorRevision: "2026-08-v1",
  });
  assert.equal(settings.providers.claudeDesktop.method, "dry-run");
  assert.equal(settings.providers.chatgptDesktop.method, "dry-run");
  assert.equal(settings.selectorRevision, "2026-08-v3");
});

test("settings container migration preserves unrelated settings", () => {
  const migrated = migrateSettingsContainer({
    theme: "dark",
    alerts: { enabled: false },
    automation: { firstRunAcknowledged: true, automationEnabled: true },
  });
  assert.equal(migrated.theme, "dark");
  assert.equal(migrated.alerts.enabled, false);
  assert.equal(migrated.automation.automationEnabled, true);
});

test("managed browser profiles cannot escape the application data root", () => {
  const root = path.resolve("C:/Users/test/AppData/Roaming/AAM/profiles");
  assert.equal(isPathInside(root, path.join(root, "abc")), true);
  assert.equal(isPathInside(root, path.resolve(root, "../outside")), false);
  assert.throws(
    () =>
      sanitizeSessionProfile(
        { id: "../../escape", name: "No", surface: "claude-web" },
        root,
      ),
    /identifier/,
  );
});

test("profile model keeps metadata only and generates browser arguments", () => {
  const root = path.resolve("C:/AAM/browser-profiles");
  const profile = sanitizeSessionProfile(
    {
      id: "12345678-1234-1234-1234-123456789abc",
      name: "Colleague Claude",
      accountLabel: "authorised account",
      surface: "claude-web",
      password: "must-not-survive",
      launchArguments: ["--remote-debugging-port=9222"],
    },
    root,
  );
  assert.equal(profile.password, undefined);
  assert.equal(profile.launchArguments, undefined);
  const command = buildBrowserLaunchCommand({
    executable: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    managedRoot: root,
    profile,
  });
  assert.deepEqual(command.args.slice(1), [
    "--no-first-run",
    "--app=https://claude.ai/new",
  ]);
  assert.equal(
    command.args.some((arg) => arg.includes("remote-debugging")),
    false,
  );
});

test("login links require credential-free HTTPS and are never normalized to HTTP", () => {
  assert.equal(
    sanitizeLoginUrl("https://claude.ai/login/callback?code=one"),
    "https://claude.ai/login/callback?code=one",
  );
  assert.throws(() => sanitizeLoginUrl("http://example.com"), /HTTPS/);
  assert.throws(
    () => sanitizeLoginUrl("https://user:pass@example.com"),
    /credential/,
  );
});

test("CLI launch profiles use supported native permission flags", () => {
  assert.deepEqual(
    buildCliArguments({ surface: "claude-code", unattendedMode: "auto" }),
    { executable: "claude", args: ["--permission-mode", "auto"] },
  );
  const codex = buildCliArguments({ surface: "codex", unattendedMode: "skip" });
  assert.deepEqual(codex.args, [
    "--sandbox",
    "workspace-write",
    "--ask-for-approval",
    "never",
  ]);
});

test("audit records redact credentials, query contents, email, and long text", () => {
  const record = redactAuditRecord({
    process:
      "claude.exe C:\\Users\\Someone\\private\\brief.txt --token sk-test_abcdefghijklmnopqrstuvwxyz",
    window: "me@example.com https://example.com/path?code=secret",
    label: "Allow once",
    confidenceSignals: [{ name: "trusted signer", passed: true }],
  });
  assert.equal(
    JSON.stringify(record).includes("abcdefghijklmnopqrstuvwxyz"),
    false,
  );
  assert.equal(record.window.includes("?code="), false);
  assert.equal(record.window.includes("/path"), false);
  assert.equal(record.window.includes("me@example.com"), false);
  assert.equal(record.process.includes("Someone"), false);
});
