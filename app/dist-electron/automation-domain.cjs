"use strict";

const crypto = require("node:crypto");
const path = require("node:path");

const AUTOMATION_SCHEMA_VERSION = 2;
const SESSION_SCHEMA_VERSION = 1;
const SELECTOR_REVISION = "2026-08-v3";

const PROVIDER_DEFAULTS = Object.freeze({
  claudeDesktop: Object.freeze({
    enabled: true,
    method: "dry-run",
  }),
  claudeChrome: Object.freeze({
    enabled: true,
    method: "dry-run",
  }),
  chatgptDesktop: Object.freeze({
    enabled: true,
    method: "dry-run",
  }),
  chatgptBrowser: Object.freeze({ enabled: false, method: "dry-run" }),
});

const ALLOWED_METHODS = new Set([
  "native-auto",
  "native-skip",
  "native-no-prompts",
  "native-auto-review",
  "native-auto-with-uia-fallback",
  "native-auto-review-with-uia-fallback",
  "uia-fallback",
  "dry-run",
  "disabled",
]);

const SESSION_SURFACES = new Set([
  "claude-desktop",
  "chatgpt-desktop",
  "claude-web",
  "chatgpt-web",
  "claude-code",
  "codex",
]);

const START_MODES = new Set(["chat", "cowork", "code", "work", "codex"]);

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(minimum, Math.min(maximum, Math.round(number)))
    : fallback;
}

function cleanLabel(value, fallback = "") {
  return String(value ?? fallback)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function sanitizeProviderSettings(name, value) {
  const defaults = PROVIDER_DEFAULTS[name];
  // No provider adapter has passed the final user-controlled invocation gate.
  // Preserve the broad allow-list for protocol compatibility, but keep saved
  // production settings detection-only until a selector revision is promoted.
  const requestedMethod = ALLOWED_METHODS.has(value?.method)
    ? value.method
    : defaults.method;
  const method = ["dry-run", "disabled"].includes(requestedMethod)
    ? requestedMethod
    : "dry-run";
  return {
    enabled:
      typeof value?.enabled === "boolean" ? value.enabled : defaults.enabled,
    method,
  };
}

function sanitizeAutomationSettings(input, now = Date.now()) {
  const source = input && typeof input === "object" ? input : {};
  const acknowledged = source.firstRunAcknowledged === true;
  const pausedUntil = Number(source.pausedUntil);
  const providers = {};
  for (const name of Object.keys(PROVIDER_DEFAULTS)) {
    providers[name] = sanitizeProviderSettings(name, source.providers?.[name]);
  }
  return {
    schemaVersion: AUTOMATION_SCHEMA_VERSION,
    automationEnabled: acknowledged && source.automationEnabled === true,
    firstRunAcknowledged: acknowledged,
    dryRun: acknowledged ? source.dryRun !== false : true,
    runInBackground: source.runInBackground !== false,
    startWithWindows: source.startWithWindows === true,
    emergencyHotkey: cleanLabel(source.emergencyHotkey) || "Ctrl+Shift+Alt+P",
    approvalDelayMs: clamp(source.approvalDelayMs, 0, 5_000, 150),
    fallbackPollMs: clamp(source.fallbackPollMs, 1_000, 60_000, 5_000),
    providers,
    logRetentionDays: clamp(source.logRetentionDays, 1, 365, 30),
    pausedUntil:
      Number.isFinite(pausedUntil) && pausedUntil > now ? pausedUntil : null,
    selectorRevision: SELECTOR_REVISION,
  };
}

function migrateSettingsContainer(input, now = Date.now()) {
  const source = input && typeof input === "object" ? input : {};
  return {
    ...source,
    automation: sanitizeAutomationSettings(source.automation, now),
  };
}

function isPathInside(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function managedProfileDirectory(managedRoot, id) {
  const safeId = String(id ?? "").toLowerCase();
  if (!/^[a-f0-9-]{16,64}$/.test(safeId)) {
    throw new Error("Invalid managed profile identifier.");
  }
  const target = path.resolve(managedRoot, safeId);
  if (!isPathInside(managedRoot, target)) {
    throw new Error("Managed profile path escaped its data root.");
  }
  return target;
}

function defaultModeForSurface(surface) {
  if (surface === "claude-code") return "code";
  if (surface === "codex") return "codex";
  return "chat";
}

function sanitizeSessionProfile(input, managedRoot, existing) {
  const surface = SESSION_SURFACES.has(input?.surface)
    ? input.surface
    : existing?.surface;
  if (!SESSION_SURFACES.has(surface)) {
    throw new Error("Choose a supported launch surface.");
  }
  const id = existing?.id ?? input?.id ?? crypto.randomUUID();
  const name = cleanLabel(input?.name ?? existing?.name);
  if (!name) throw new Error("Profile name is required.");
  const provider = surface.startsWith("claude") ? "claude" : "chatgpt";
  const requestedMode = input?.startMode ?? existing?.startMode;
  const startMode = START_MODES.has(requestedMode)
    ? requestedMode
    : defaultModeForSurface(surface);
  const unattendedMode = ["manual", "auto", "skip"].includes(
    input?.unattendedMode,
  )
    ? input.unattendedMode
    : (existing?.unattendedMode ?? "manual");
  const profileDataDir = ["claude-web", "chatgpt-web"].includes(surface)
    ? managedProfileDirectory(managedRoot, id)
    : null;
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    id,
    name,
    accountLabel: cleanLabel(input?.accountLabel ?? existing?.accountLabel),
    provider,
    surface,
    startMode,
    unattendedMode,
    linkedClaudeProfileId:
      surface === "claude-code"
        ? cleanLabel(
            input?.linkedClaudeProfileId ?? existing?.linkedClaudeProfileId,
          ) || null
        : null,
    profileDataDir,
    color: /^#[a-f0-9]{6}$/i.test(input?.color ?? "")
      ? input.color.toLowerCase()
      : (existing?.color ?? (provider === "claude" ? "#c96442" : "#2a78d6")),
    icon: provider === "claude" ? "C" : "GPT",
    createdAt: existing?.createdAt ?? Date.now(),
    lastLaunch: existing?.lastLaunch ?? null,
  };
}

function sanitizeLoginUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > 4_096) {
    throw new Error("Paste a valid HTTPS login link.");
  }
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Paste a valid HTTPS login link.");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("Only credential-free HTTPS login links are supported.");
  }
  return parsed.toString();
}

function assertBrowserExecutable(executable) {
  const resolved = path.resolve(executable);
  const base = path.basename(resolved).toLowerCase();
  if (base !== "chrome.exe" && base !== "msedge.exe") {
    throw new Error(
      "Only discovered Chrome or Edge executables are supported.",
    );
  }
  return resolved;
}

function assertEphemeralLaunchUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value ?? ""));
  } catch {
    throw new Error("The temporary login relay URL is invalid.");
  }
  if (
    parsed.protocol !== "http:" ||
    parsed.hostname !== "127.0.0.1" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !/^\/[a-f0-9]{64}$/.test(parsed.pathname)
  ) {
    throw new Error(
      "Only a tokenized local login relay may override the launch URL.",
    );
  }
  return parsed.toString();
}

function buildBrowserLaunchCommand({
  executable,
  managedRoot,
  profile,
  launchUrl,
}) {
  if (!["claude-web", "chatgpt-web"].includes(profile?.surface)) {
    throw new Error("This profile is not an isolated browser profile.");
  }
  const profileDataDir = managedProfileDirectory(managedRoot, profile.id);
  if (
    path.resolve(profile.profileDataDir ?? profileDataDir) !== profileDataDir
  ) {
    throw new Error("The saved browser profile path is not app-managed.");
  }
  const url = launchUrl
    ? assertEphemeralLaunchUrl(launchUrl)
    : profile.surface === "claude-web"
      ? "https://claude.ai/new"
      : "https://chatgpt.com/";
  return {
    file: assertBrowserExecutable(executable),
    args: [
      `--user-data-dir=${profileDataDir}`,
      "--no-first-run",
      `--app=${url}`,
    ],
    profileDataDir,
  };
}

function buildCliArguments(profile) {
  if (profile?.surface === "claude-code") {
    const mode =
      profile.unattendedMode === "skip"
        ? "bypassPermissions"
        : profile.unattendedMode === "auto"
          ? "auto"
          : "manual";
    return { executable: "claude", args: ["--permission-mode", mode] };
  }
  if (profile?.surface === "codex") {
    if (profile.unattendedMode === "skip") {
      return {
        executable: "codex",
        args: ["--sandbox", "workspace-write", "--ask-for-approval", "never"],
      };
    }
    if (profile.unattendedMode === "auto") {
      return {
        executable: "codex",
        args: [
          "--sandbox",
          "workspace-write",
          "--ask-for-approval",
          "on-request",
          "-c",
          "approvals_reviewer=auto_review",
        ],
      };
    }
    return {
      executable: "codex",
      args: [
        "--sandbox",
        "workspace-write",
        "--ask-for-approval",
        "on-request",
      ],
    };
  }
  throw new Error("This profile is not a supported CLI profile.");
}

function redactText(value, maximum = 120) {
  return String(value ?? "")
    .replace(/https?:\/\/[^\s]+/gi, (match) => {
      try {
        const parsed = new URL(match);
        return `${parsed.origin}/[url-path-redacted]`;
      } catch {
        return "[url]";
      }
    })
    .replace(/(?<![a-z0-9])(?:[a-z]:\\|\\\\)[^\r\n\t"<>|?*]+/gi, "[path]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/\b(?:sk|sess|token|oauth)[-_][a-z0-9_-]{12,}\b/gi, "[secret]")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function redactAuditRecord(input) {
  return {
    timestamp: Number(input?.timestamp) || Date.now(),
    durationMs: clamp(input?.durationMs, 0, 300_000, 0),
    provider: cleanLabel(input?.provider, "unknown"),
    surface: cleanLabel(input?.surface, "unknown"),
    process: redactText(input?.process, 160),
    window: redactText(input?.window, 120),
    label: redactText(input?.label, 100),
    requestedAction: cleanLabel(input?.requestedAction, "none"),
    method: cleanLabel(input?.method, "unknown"),
    result: cleanLabel(input?.result, "unknown"),
    dryRun: input?.dryRun === true,
    confidenceSignals: Array.isArray(input?.confidenceSignals)
      ? input.confidenceSignals.slice(0, 12).map((signal) => ({
          name: cleanLabel(signal?.name, "signal"),
          passed: signal?.passed === true,
        }))
      : [],
    retryCount: clamp(input?.retryCount, 0, 5, 0),
    errorCode: cleanLabel(input?.errorCode),
  };
}

module.exports = {
  ALLOWED_METHODS,
  AUTOMATION_SCHEMA_VERSION,
  PROVIDER_DEFAULTS,
  SELECTOR_REVISION,
  SESSION_SCHEMA_VERSION,
  SESSION_SURFACES,
  buildBrowserLaunchCommand,
  buildCliArguments,
  isPathInside,
  managedProfileDirectory,
  migrateSettingsContainer,
  redactAuditRecord,
  redactText,
  sanitizeAutomationSettings,
  sanitizeLoginUrl,
  sanitizeSessionProfile,
};
