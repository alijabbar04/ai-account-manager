"use strict";

// What the phone companion is allowed to see, and how it pairs.
//
// The phone never holds a Claude or ChatGPT credential. Claude refresh tokens
// rotate on use, so a phone refreshing one would sign this PC out. It only
// reads the usage this PC already polls, as the snapshot built here: names,
// plans, emails and limits, never tokens or config paths.

const crypto = require("node:crypto");
const os = require("node:os");
const { summarizeProfileVisibility } = require("./launcher-domain.cjs");

const PHONE_SNAPSHOT_VERSION = 1;
const DEFAULT_PHONE_PORT = 47821;
const PAIRING_CODE_LENGTH = 8;
const PAIRING_CODE_TTL_MS = 10 * 60 * 1000;
const MAX_PAIRING_ATTEMPTS = 5;
// 32 symbols with no 0/O or 1/I, so a byte modulo 32 is uniform.
const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Tailscale hands out addresses from the 100.64.0.0/10 shared address space.
function isTailscaleIPv4(address) {
  const value = String(address ?? "").replace(/^::ffff:/i, "");
  const parts = value.split(".");
  if (parts.length !== 4 || !parts.every((part) => /^\d{1,3}$/.test(part))) {
    return false;
  }
  const [a, b] = parts.map(Number);
  return (
    a === 100 && b >= 64 && b <= 127 && parts.every((p) => Number(p) <= 255)
  );
}

function findTailscaleAddress(interfaces = os.networkInterfaces()) {
  const candidates = [];
  for (const [name, entries] of Object.entries(interfaces ?? {})) {
    for (const entry of entries ?? []) {
      const ipv4 = entry?.family === "IPv4" || entry?.family === 4;
      if (ipv4 && !entry.internal && isTailscaleIPv4(entry.address)) {
        candidates.push({ name, address: entry.address });
      }
    }
  }
  candidates.sort(
    (a, b) =>
      Number(/tailscale/i.test(b.name)) - Number(/tailscale/i.test(a.name)),
  );
  return candidates[0]?.address ?? null;
}

function createPairingCode(randomBytes = crypto.randomBytes) {
  const bytes = randomBytes(PAIRING_CODE_LENGTH);
  let code = "";
  for (const byte of bytes) code += PAIRING_CODE_ALPHABET[byte % 32];
  return code;
}

function normalizePairingCode(value) {
  if (typeof value !== "string" || value.length > 32) return null;
  const code = value.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== PAIRING_CODE_LENGTH) return null;
  for (const char of code) {
    if (!PAIRING_CODE_ALPHABET.includes(char)) return null;
  }
  return code;
}

function formatPairingCode(code) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function createDeviceToken(randomBytes = crypto.randomBytes) {
  return randomBytes(32).toString("base64url");
}

function tokensEqual(expected, presented) {
  if (typeof expected !== "string" || typeof presented !== "string") {
    return false;
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(presented);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sanitizeDeviceName(value) {
  const name =
    typeof value === "string"
      ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim()
      : "";
  return name.slice(0, 60) || "Phone";
}

function buildPairingLink({ host, port, code }) {
  const query = new URLSearchParams({ host, port: String(port), code });
  return `aamusage://pair?${query}`;
}

function normalizePhoneSettings(value) {
  const input = value && typeof value === "object" ? value : {};
  const port = Number(input.port);
  const device =
    input.device && typeof input.device === "object"
      ? {
          name: sanitizeDeviceName(input.device.name),
          pairedAt: Number(input.device.pairedAt) || null,
          secret:
            typeof input.device.secret === "string"
              ? input.device.secret
              : null,
        }
      : null;
  return {
    enabled: input.enabled === true,
    keepRunning: input.keepRunning !== false,
    port:
      Number.isInteger(port) && port >= 1024 && port <= 65535
        ? port
        : DEFAULT_PHONE_PORT,
    device: device?.secret ? device : null,
  };
}

// --- Snapshot -------------------------------------------------------------

const LIMIT_ORDER = { session: 0, weekly_all: 1, weekly_scoped: 2 };

function limitSeverity(severity, percent) {
  const value = String(severity ?? "").toLowerCase();
  if (
    value.includes("crit") ||
    value.includes("exceed") ||
    value.includes("limit") ||
    percent >= 100
  ) {
    return "crit";
  }
  if (value.includes("warn") || value.includes("elevat") || percent >= 80) {
    return "warn";
  }
  return "ok";
}

function claudeLimitLabel(limit) {
  if (limit.kind === "session") return "Session (5h)";
  if (limit.kind === "weekly_all") return "Weekly · all models";
  if (limit.kind === "weekly_scoped") {
    return `Weekly · ${limit.modelName ?? "model"}`;
  }
  return String(limit.kind ?? "usage").replace(/_/g, " ");
}

function isoToMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function claudeStatus(state) {
  if (!state.identity?.loggedIn) return { kind: "off", label: "Logged out" };
  const usage = state.usage;
  if (usage && !usage.ok && usage.error?.toLowerCase().includes("expired")) {
    return { kind: "crit", label: "Re-login needed" };
  }
  if (!usage || !usage.limits?.length) {
    return { kind: "unknown", label: "Usage unknown" };
  }
  let kind = "ok";
  for (const limit of usage.limits) {
    const severity = limitSeverity(limit.severity, limit.percent);
    if (severity === "crit") kind = "crit";
    else if (severity === "warn" && kind !== "crit") kind = "warn";
  }
  return kind === "crit"
    ? { kind, label: "Rate limited" }
    : kind === "warn"
      ? { kind, label: "Usage high" }
      : { kind, label: "Active" };
}

function claudeAccount(state, role) {
  const usage = state.usage;
  const limits = [...(usage?.limits ?? [])]
    .sort((a, b) => (LIMIT_ORDER[a.kind] ?? 3) - (LIMIT_ORDER[b.kind] ?? 3))
    .map((limit) => ({
      label: claudeLimitLabel(limit),
      percent: Number(limit.percent) || 0,
      resetsAt: isoToMs(limit.resetsAt),
      severity: limitSeverity(limit.severity, limit.percent),
    }));
  const extra = usage?.extra;
  return {
    id: state.profile.id,
    provider: "claude",
    role,
    name: state.profile.name,
    email: state.identity?.email ?? null,
    plan: state.identity?.planLabel ?? null,
    status: claudeStatus(state),
    limits,
    extra:
      extra?.enabled && Number(extra.usedCredits) > 0
        ? {
            usedCredits: Number(extra.usedCredits),
            currency: extra.currency ?? "USD",
            decimalPlaces: Number(extra.decimalPlaces) || 0,
          }
        : null,
    fetchedAt: usage?.fetchedAt ?? null,
    error: usage && !usage.ok ? (usage.error ?? "Usage unavailable") : null,
  };
}

function formatGptPlan(plan) {
  return plan
    ? String(plan)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : null;
}

function gptWindowName(minutes) {
  if (!minutes || !Number.isFinite(minutes)) return "Usage window";
  if (minutes === 10080) return "Weekly window";
  if (minutes % 1440 === 0) return `${minutes / 1440}-day window`;
  if (minutes % 60 === 0) return `${minutes / 60}-hour window`;
  return `${minutes}-minute window`;
}

function gptBucketName(bucket) {
  const name = bucket.limitName || bucket.limitId;
  if (!name || name === "codex") return "Codex";
  return String(name)
    .replace(/^codex[_-]?/i, "Codex ")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

// Mirrors collectGptWindows() in the renderer so both views agree.
function gptLimits(gptUsage) {
  const rateLimits = gptUsage?.rateLimits;
  if (!rateLimits) return [];
  const buckets = rateLimits.rateLimitsByLimitId
    ? Object.values(rateLimits.rateLimitsByLimitId)
    : rateLimits.rateLimits
      ? [rateLimits.rateLimits]
      : [];
  const seen = new Set();
  const limits = [];
  for (const bucket of buckets) {
    for (const [slot, window] of [
      ["primary", bucket?.primary],
      ["secondary", bucket?.secondary],
    ]) {
      if (!window || !Number.isFinite(window.usedPercent)) continue;
      const key = `${bucket.limitId ?? "codex"}-${slot}-${window.windowDurationMins ?? 0}`;
      if (seen.has(key)) continue;
      seen.add(key);
      limits.push({
        label: `${gptBucketName(bucket)} · ${gptWindowName(window.windowDurationMins)}`,
        percent: window.usedPercent,
        resetsAt: Number.isFinite(window.resetsAt)
          ? window.resetsAt * 1000
          : null,
        severity: limitSeverity("", window.usedPercent),
      });
    }
  }
  return limits.slice(0, 6);
}

function gptAccount(gptUsage) {
  const limits = gptUsage?.ok ? gptLimits(gptUsage) : [];
  let status = { kind: "unknown", label: gptUsage ? "Unavailable" : "Loading" };
  if (gptUsage?.ok) {
    const worst = limits.reduce(
      (kind, limit) =>
        limit.severity === "crit" || kind === "crit"
          ? "crit"
          : limit.severity === "warn"
            ? "warn"
            : kind,
      "ok",
    );
    status =
      worst === "crit"
        ? { kind: worst, label: "Rate limited" }
        : worst === "warn"
          ? { kind: worst, label: "Usage high" }
          : { kind: worst, label: "Active" };
  }
  return {
    id: "gpt",
    provider: "gpt",
    role: null,
    name: "GPT / Codex",
    email: gptUsage?.account?.email ?? null,
    plan: formatGptPlan(gptUsage?.account?.planType),
    status,
    limits,
    extra: null,
    fetchedAt: gptUsage?.fetchedAt ?? null,
    error:
      gptUsage && !gptUsage.ok
        ? (gptUsage.error ?? "GPT usage unavailable")
        : null,
  };
}

// The same three accounts as the dashboard: work, personal and GPT / Codex.
function buildPhoneSnapshot({
  states,
  gptUsage,
  now = Date.now(),
  hostName = os.hostname(),
}) {
  const { work, personal } = summarizeProfileVisibility(states ?? []);
  return {
    v: PHONE_SNAPSHOT_VERSION,
    generatedAt: now,
    host: hostName,
    accounts: [
      work && claudeAccount(work, "work"),
      personal && claudeAccount(personal, "personal"),
      gptAccount(gptUsage),
    ].filter(Boolean),
  };
}

module.exports = {
  DEFAULT_PHONE_PORT,
  MAX_PAIRING_ATTEMPTS,
  PAIRING_CODE_TTL_MS,
  PHONE_SNAPSHOT_VERSION,
  buildPairingLink,
  buildPhoneSnapshot,
  createDeviceToken,
  createPairingCode,
  findTailscaleAddress,
  formatPairingCode,
  isTailscaleIPv4,
  normalizePairingCode,
  normalizePhoneSettings,
  sanitizeDeviceName,
  tokensEqual,
};
