const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CLAUDE_COWORK_URL,
  CODEX_NEW_CHAT_URL,
  VSCODE_CODEX_PANEL_URL,
  buildVsCodeWindowArgs,
  extensionStateFromStorage,
  normalizeHiddenProfileIds,
  normalizeOtherAccountsLayout,
  parseExtensionList,
  planVsCodeCodexLaunch,
  setProfileHidden,
  summarizeProfileVisibility,
  validateExternalTarget,
  validateProjectDirectory,
} = require("../app/dist-electron/launcher-domain.cjs");

test("official app protocol targets are exact allowlist entries", () => {
  assert.equal(validateExternalTarget(CLAUDE_COWORK_URL), CLAUDE_COWORK_URL);
  assert.equal(validateExternalTarget(CODEX_NEW_CHAT_URL), CODEX_NEW_CHAT_URL);
  assert.throws(
    () => validateExternalTarget("claude://cowork/new/extra"),
    /not allowed/,
  );
  assert.throws(
    () => validateExternalTarget("codex://threads/new\nhttps://example.com"),
    /unsafe/,
  );
});

test("VS Code arguments preserve special-character folders as one argument", () => {
  const folder = "C:\\Work & Research\\Project (alpha) 'quoted'";
  assert.deepEqual(buildVsCodeWindowArgs(folder, false), [
    "--new-window",
    folder,
  ]);
  assert.deepEqual(buildVsCodeWindowArgs(folder, true), [
    "--new-window",
    folder,
    VSCODE_CODEX_PANEL_URL,
  ]);
});

test("project picker cancellation is normal and selected folders are validated", () => {
  assert.deepEqual(
    validateProjectDirectory(null, () => false),
    {
      cancelled: true,
      path: null,
    },
  );
  assert.deepEqual(
    validateProjectDirectory("C:\\Projects\\demo", () => true),
    { cancelled: false, path: "C:\\Projects\\demo" },
  );
  assert.throws(
    () => validateProjectDirectory("relative", () => true),
    /absolute/,
  );
  assert.throws(
    () => validateProjectDirectory("C:\\missing", () => false),
    /no longer exists/,
  );
});

test("Codex VS Code launch plans fail helpfully and use the honest fallback", () => {
  assert.equal(
    planVsCodeCodexLaunch({ executable: null, extension: null }).code,
    "vscode-missing",
  );
  assert.equal(
    planVsCodeCodexLaunch({
      executable: "C:\\Code.exe",
      extension: { installed: false },
    }).code,
    "extension-missing",
  );
  assert.equal(
    planVsCodeCodexLaunch({
      executable: "C:\\Code.exe",
      extension: { installed: true, enabled: false },
    }).code,
    "extension-disabled",
  );
  const fallback = planVsCodeCodexLaunch({
    executable: "C:\\Code.exe",
    extension: {
      installed: true,
      enabled: true,
      panelAdapterVerified: false,
    },
  });
  assert.equal(fallback.ok, true);
  assert.equal(fallback.panelOpened, false);
  assert.deepEqual(fallback.args, ["--new-window"]);
  assert.match(fallback.message, /Select the Codex icon/);
});

test("extension detection handles versions and disabled storage", () => {
  assert.deepEqual(
    [...parseExtensionList("openai.chatgpt@1.2.3\nms-python.python@4")],
    ["openai.chatgpt", "ms-python.python"],
  );
  assert.deepEqual(
    extensionStateFromStorage(
      JSON.stringify({ "openai.chatgpt": 1 }),
      [],
      "openai.chatgpt",
    ),
    { installedBefore: true, disabled: false, enabled: true },
  );
  assert.equal(
    extensionStateFromStorage(
      JSON.stringify({ "openai.chatgpt": 1 }),
      ['["openai.chatgpt"]'],
      "openai.chatgpt",
    ).enabled,
    false,
  );
});

test("hidden profile migration drops malformed entries and is restart-stable", () => {
  const normalized = normalizeHiddenProfileIds([
    "work-id",
    "work-id",
    null,
    "",
    "personal-id",
    "bad\nvalue",
  ]);
  assert.deepEqual(normalized, ["work-id", "personal-id"]);
  assert.deepEqual(normalizeHiddenProfileIds(normalized), normalized);
  assert.deepEqual(normalizeHiddenProfileIds({ malformed: true }), []);
  assert.equal(normalized.includes("stale-profile-id"), false);
});

test("hiding survives serialization and unhiding restores the profile", () => {
  const hidden = setProfileHidden([], "default-id", true);
  const afterRestart = normalizeHiddenProfileIds(
    JSON.parse(JSON.stringify({ hiddenProfileIds: hidden })).hiddenProfileIds,
  );
  assert.deepEqual(afterRestart, ["default-id"]);
  assert.deepEqual(setProfileHidden(afterRestart, "default-id", false), []);
});

test("hidden defaults and all-hidden views never substitute another profile", () => {
  const defaultProfile = {
    profile: { id: "default-id" },
    isDefault: true,
    dashboardRole: "work",
    hidden: true,
  };
  const otherProfile = {
    profile: { id: "other-id" },
    isDefault: false,
    dashboardRole: null,
    hidden: false,
  };
  const summary = summarizeProfileVisibility([defaultProfile, otherProfile]);
  assert.equal(summary.defaultHidden, true);
  assert.equal(summary.work, null);
  assert.deepEqual(summary.additional, [otherProfile]);
  assert.equal(
    summarizeProfileVisibility([
      defaultProfile,
      { ...otherProfile, hidden: true },
    ]).allHidden,
    true,
  );
});

test("stale hidden IDs do not hide newly discovered profiles", () => {
  const persisted = normalizeHiddenProfileIds(["removed-profile"]);
  const discovered = ["new-profile"].map((id) => ({
    profile: { id },
    hidden: persisted.includes(id),
  }));
  const summary = summarizeProfileVisibility(discovered);
  assert.equal(summary.visibleCount, 1);
  assert.equal(summary.allHidden, false);
});

test("Other Accounts layout defaults safely and persists without dropping settings", () => {
  assert.equal(normalizeOtherAccountsLayout(undefined), "grid");
  assert.equal(normalizeOtherAccountsLayout(null), "grid");
  assert.equal(normalizeOtherAccountsLayout("cards"), "grid");
  assert.equal(normalizeOtherAccountsLayout({ malformed: true }), "grid");
  assert.equal(normalizeOtherAccountsLayout("wide"), "wide");

  const beforeRestart = {
    hiddenProfileIds: ["hidden-id"],
    unknownFutureSetting: { retained: true },
    otherAccountsLayout: normalizeOtherAccountsLayout("wide"),
  };
  const afterRestart = JSON.parse(JSON.stringify(beforeRestart));
  assert.equal(
    normalizeOtherAccountsLayout(afterRestart.otherAccountsLayout),
    "wide",
  );
  assert.deepEqual(afterRestart.unknownFutureSetting, { retained: true });
  assert.deepEqual(afterRestart.hiddenProfileIds, ["hidden-id"]);
});

test("both Other Accounts layouts retain one, two, and many visible profiles", () => {
  for (const layout of ["grid", "wide"]) {
    assert.equal(normalizeOtherAccountsLayout(layout), layout);
    for (const count of [1, 2, 7]) {
      const states = Array.from({ length: count + 1 }, (_, index) => ({
        profile: { id: `other-${index}` },
        hidden: index === count,
        isDefault: false,
        dashboardRole: null,
      }));
      const summary = summarizeProfileVisibility(states);
      assert.equal(summary.additional.length, count);
      assert.equal(
        summary.additional.some(
          (state) => state.profile.id === `other-${count}`,
        ),
        false,
      );
    }
  }
});
