"use strict";

const path = require("node:path");

const CLAUDE_COWORK_URL = "claude://cowork/new";
const CODEX_NEW_CHAT_URL = "codex://threads/new";
const VSCODE_CODEX_PANEL_URL = "vscode://openai.chatgpt/extension/panel/new";
const CLAUDE_DEEP_LINK_HELP_URL =
  "https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link";
const CODEX_COMMAND_HELP_URL =
  "https://learn.chatgpt.com/docs/reference/commands";

const ALLOWED_EXTERNAL_TARGETS = new Set([
  CLAUDE_COWORK_URL,
  CODEX_NEW_CHAT_URL,
  VSCODE_CODEX_PANEL_URL,
  CLAUDE_DEEP_LINK_HELP_URL,
  CODEX_COMMAND_HELP_URL,
]);

const OTHER_ACCOUNTS_LAYOUTS = new Set(["grid", "wide"]);

function validateExternalTarget(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    throw new Error("External target is invalid.");
  }
  if (/[\r\n\0]/.test(value)) {
    throw new Error("External target contains unsafe characters.");
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("External target is not a valid URL.");
  }
  if (parsed.username || parsed.password || parsed.hash) {
    throw new Error(
      "External target contains unsupported credentials or fragments.",
    );
  }
  if (!ALLOWED_EXTERNAL_TARGETS.has(value)) {
    throw new Error(
      `External protocol target is not allowed: ${parsed.protocol}`,
    );
  }
  return value;
}

function normalizeHiddenProfileIds(value) {
  if (!Array.isArray(value)) return [];
  const ids = [];
  const seen = new Set();
  for (const candidate of value) {
    if (
      typeof candidate !== "string" ||
      candidate.length === 0 ||
      candidate.length > 200 ||
      /[\r\n\0]/.test(candidate) ||
      seen.has(candidate)
    ) {
      continue;
    }
    seen.add(candidate);
    ids.push(candidate);
  }
  return ids;
}

function normalizeOtherAccountsLayout(value) {
  return OTHER_ACCOUNTS_LAYOUTS.has(value) ? value : "grid";
}

function setProfileHidden(hiddenProfileIds, profileId, hidden) {
  const normalized = normalizeHiddenProfileIds(hiddenProfileIds);
  if (
    typeof profileId !== "string" ||
    profileId.length === 0 ||
    profileId.length > 200 ||
    /[\r\n\0]/.test(profileId) ||
    typeof hidden !== "boolean"
  ) {
    throw new Error("Account visibility request is invalid.");
  }
  const ids = new Set(normalized);
  if (hidden) ids.add(profileId);
  else ids.delete(profileId);
  return [...ids];
}

function summarizeProfileVisibility(states) {
  const all = Array.isArray(states) ? states : [];
  const visible = all.filter((state) => state?.hidden !== true);
  const defaultState = all.find((state) => state?.isDefault) ?? null;
  const rawAdditional = all.filter(
    (state) => !state?.isDefault && !state?.dashboardRole,
  );
  return {
    total: all.length,
    visibleCount: visible.length,
    allHidden: all.length > 0 && visible.length === 0,
    defaultHidden: Boolean(defaultState?.hidden),
    work:
      visible.find((state) => state?.dashboardRole === "work") ??
      visible.find((state) => state?.isDefault) ??
      null,
    personal:
      visible.find((state) => state?.dashboardRole === "personal") ?? null,
    additional: rawAdditional.filter((state) => state?.hidden !== true),
  };
}

function validateProjectDirectory(value, directoryExists) {
  if (value === null || value === undefined || value === "") {
    return { cancelled: true, path: null };
  }
  if (
    typeof value !== "string" ||
    value.length > 32767 ||
    /[\r\n\0]/.test(value)
  ) {
    throw new Error("The selected project folder is invalid.");
  }
  if (!path.win32.isAbsolute(value) && !path.isAbsolute(value)) {
    throw new Error("The selected project folder must be an absolute path.");
  }
  if (typeof directoryExists !== "function" || !directoryExists(value)) {
    throw new Error("The selected project folder no longer exists.");
  }
  return { cancelled: false, path: value };
}

function buildVsCodeWindowArgs(folder, openPanel = false) {
  const args = ["--new-window"];
  if (folder !== null && folder !== undefined) args.push(folder);
  if (openPanel) args.push(VSCODE_CODEX_PANEL_URL);
  return args;
}

function planVsCodeCodexLaunch({ executable, extension, folder = null }) {
  if (!executable) {
    return {
      ok: false,
      code: "vscode-missing",
      error:
        "Visual Studio Code was not found. Install VS Code, then try again.",
      helpTarget: CODEX_COMMAND_HELP_URL,
    };
  }
  if (!extension?.installed) {
    return {
      ok: false,
      code: "extension-missing",
      error:
        "The OpenAI Codex extension (openai.chatgpt) is not installed in VS Code.",
      helpTarget: CODEX_COMMAND_HELP_URL,
    };
  }
  if (!extension.enabled) {
    return {
      ok: false,
      code: "extension-disabled",
      error:
        "The OpenAI Codex extension is installed but not confirmed enabled. Enable it in VS Code, then try again.",
      helpTarget: CODEX_COMMAND_HELP_URL,
    };
  }
  const openPanel = extension.panelAdapterVerified === true;
  return {
    ok: true,
    args: buildVsCodeWindowArgs(folder, openPanel),
    panelOpened: openPanel,
    message: openPanel
      ? "VS Code opened with a new Codex panel."
      : "VS Code opened in a new window. Select the Codex icon, then choose New Codex Agent.",
  };
}

function parseExtensionList(output) {
  return new Set(
    String(output ?? "")
      .split(/\r?\n/u)
      .map((line) => line.trim().split("@")[0].toLowerCase())
      .filter(Boolean),
  );
}

function extensionStateFromStorage(markerValue, disabledValues, extensionId) {
  const id = String(extensionId ?? "").toLowerCase();
  if (!id) return { installedBefore: false, disabled: false, enabled: false };
  let marker = {};
  try {
    marker = JSON.parse(String(markerValue ?? "{}"));
  } catch {}
  const installedBefore = Object.prototype.hasOwnProperty.call(marker, id);
  const disabled = (Array.isArray(disabledValues) ? disabledValues : []).some(
    (value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(id),
  );
  return { installedBefore, disabled, enabled: installedBefore && !disabled };
}

module.exports = {
  ALLOWED_EXTERNAL_TARGETS,
  CLAUDE_COWORK_URL,
  CLAUDE_DEEP_LINK_HELP_URL,
  CODEX_COMMAND_HELP_URL,
  CODEX_NEW_CHAT_URL,
  OTHER_ACCOUNTS_LAYOUTS,
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
};
