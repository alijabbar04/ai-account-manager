"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, "default", { value: mod, enumerable: true })
      : target,
    mod,
  )
);

// electron/main.ts
var import_electron5 = require("electron");
var path12 = __toESM(require("node:path"));
var {
  AutomationHostClient,
  SessionLauncher,
  appendAudit,
  capabilityMatrix,
} = require("./automation-runtime.cjs");
var {
  migrateSettingsContainer,
  redactText,
  sanitizeAutomationSettings,
} = require("./automation-domain.cjs");
var {
  CLAUDE_COWORK_URL,
  CLAUDE_DEEP_LINK_HELP_URL,
  CODEX_COMMAND_HELP_URL,
  CODEX_NEW_CHAT_URL,
  VSCODE_CODEX_PANEL_URL,
  buildVsCodeWindowArgs,
  extensionStateFromStorage,
  normalizeHiddenProfileIds,
  normalizeOtherAccountsLayout,
  parseExtensionList,
  planVsCodeCodexLaunch,
  setProfileHidden,
  validateExternalTarget,
  validateProjectDirectory,
} = require("./launcher-domain.cjs");
var {
  SerialRefreshCoordinator,
  exponentialBackoffMs,
  mergeProfileSnapshots,
  parseRetryAfter,
  retainFailedSnapshot,
} = require("./usage-reliability-domain.cjs");

function sanitizeReviewedDiagnosticReport(input) {
  if (!input || typeof input !== "object" || !Array.isArray(input.elements)) {
    throw new Error("Run and review diagnostics before exporting.");
  }
  return {
    capturedAt: Number(input.capturedAt) || Date.now(),
    selectorRevision: redactText(input.selectorRevision, 40),
    elements: input.elements.slice(0, 500).map((element) => ({
      processId: Math.max(0, Math.trunc(Number(element?.processId) || 0)),
      hwnd: redactText(element?.hwnd, 32),
      packageFamily: redactText(element?.packageFamily, 120),
      signer: redactText(element?.signer, 180),
      signatureValid: element?.signatureValid === true,
      controlType: redactText(element?.controlType, 60),
      name: redactText(element?.name, 120),
      automationId: redactText(element?.automationId, 100),
      runtimeId: redactText(element?.runtimeId, 120),
      adapterDecision: redactText(element?.adapterDecision, 320),
    })),
    notes: Array.isArray(input.notes)
      ? input.notes.slice(0, 12).map((note) => redactText(note, 200))
      : [],
  };
}

// electron/lib/ipc.ts
var import_electron4 = require("electron");
var import_node_child_process4 = require("node:child_process");
var fs11 = __toESM(require("node:fs"));
var path11 = __toESM(require("node:path"));
var import_node_url = require("node:url");

// electron/lib/accountReader.ts
var fs2 = __toESM(require("node:fs"));
var os2 = __toESM(require("node:os"));
var path2 = __toESM(require("node:path"));

// electron/lib/paths.ts
var import_electron = require("electron");
var path = __toESM(require("node:path"));
var fs = __toESM(require("node:fs"));
var os = __toESM(require("node:os"));
function isHomeDefaultDir(dir) {
  return (
    path.resolve(dir).toLowerCase() ===
    path.join(os.homedir(), ".claude").toLowerCase()
  );
}
function appDataDir() {
  // DO NOT rename "ClaudeAccountManager" to match the current product name.
  // Keep the longstanding data directory across product and version changes.
  // accounts, settings, usage history and DPAPI-encrypted API key vault live
  // in %APPDATA%\ClaudeAccountManager. Changing this string orphans all of it
  // silently - the app would just look freshly installed. If a rename is ever
  // truly needed, it requires an explicit, tested migration step (copy the
  // folder AND the separate Electron "Local State" file that holds the
  // safeStorage master key - see docs/TROUBLESHOOTING.md), not a one-line edit.
  const dir = path.join(
    import_electron.app.getPath("appData"),
    "ClaudeAccountManager",
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function profilesFile() {
  return path.join(appDataDir(), "profiles.json");
}
function settingsFile() {
  return path.join(appDataDir(), "settings.json");
}
function snapshotsFile() {
  return path.join(appDataDir(), "usage-snapshots.json");
}
function apiKeysFile() {
  return path.join(appDataDir(), "api-keys.json");
}
function apiKeyVaultFile() {
  return path.join(appDataDir(), "api-keys-vault.json");
}
function apiSnapshotsFile() {
  return path.join(appDataDir(), "api-usage-snapshots.json");
}
function writeJsonAtomic(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  try {
    fs.renameSync(tmp, file);
  } catch (err) {
    // Windows cannot always rename over an existing or briefly-read file.
    // Copying the complete temp file still prevents truncated JSON and avoids
    // stranding every successful refresh in a process-specific temp file.
    try {
      fs.copyFileSync(tmp, file);
      fs.unlinkSync(tmp);
    } catch {
      throw err;
    }
  }
}
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}
function readNewestJson(file) {
  const dir = path.dirname(file);
  const prefix = `${path.basename(file)}.`;
  const candidates = [file];
  try {
    for (const name of fs.readdirSync(dir)) {
      if (name.startsWith(prefix) && name.endsWith(".tmp")) {
        candidates.push(path.join(dir, name));
      }
    }
  } catch {}
  const values = candidates
    .filter((candidate) => fs.existsSync(candidate))
    .map((candidate) => ({
      candidate,
      modified: fs.statSync(candidate).mtimeMs,
    }))
    .sort((a, b) => a.modified - b.modified)
    .map(({ candidate }) => readJson(candidate))
    .filter((value) => value && typeof value === "object");
  if (values.length === 0) return null;
  return mergeProfileSnapshots(values);
}

// electron/lib/accountReader.ts
function toMs(epoch) {
  if (!epoch || !Number.isFinite(epoch)) return void 0;
  return epoch > 1e12 ? epoch : epoch * 1e3;
}
function claudeJsonPath(configDir) {
  const inside = path2.join(configDir, ".claude.json");
  if (isHomeDefaultDir(configDir)) {
    const sibling = path2.join(os2.homedir(), ".claude.json");
    if (fs2.existsSync(sibling)) return sibling;
  }
  return inside;
}
function readIdentity(configDir) {
  const creds = readJson(path2.join(configDir, ".credentials.json"));
  const claudeJson = readJson(claudeJsonPath(configDir));
  const oauth = creds?.claudeAiOauth;
  const loggedIn = Boolean(oauth?.accessToken && oauth?.refreshToken);
  const tokenExpiresAt = toMs(oauth?.expiresAt);
  const acct = claudeJson?.oauthAccount;
  return {
    loggedIn,
    email: acct?.emailAddress,
    displayName: acct?.displayName,
    orgName: acct?.organizationName,
    orgType: acct?.organizationType,
    billingType: acct?.billingType,
    seatTier: acct?.seatTier,
    rateLimitTier: acct?.userRateLimitTier ?? oauth?.rateLimitTier,
    subscriptionType: oauth?.subscriptionType,
    tokenExpiresAt,
    tokenExpired:
      loggedIn && tokenExpiresAt !== void 0
        ? tokenExpiresAt < Date.now()
        : void 0,
  };
}

// electron/lib/defaultEnv.ts
var import_node_child_process = require("node:child_process");
function runPs(command, timeout = 15e3) {
  return new Promise((resolve5, reject) => {
    (0, import_node_child_process.execFile)(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", command],
      { windowsHide: true, timeout },
      (err, stdout) => (err ? reject(err) : resolve5(stdout.trim())),
    );
  });
}
function psSingleQuote(s) {
  return `'${s.replace(/'/g, "''")}'`;
}
function sameDir(a, b) {
  if (a === null && b === null) return true;
  if (!a || !b) return false;
  return (
    a.replace(/\\+$/, "").toLowerCase() === b.replace(/\\+$/, "").toLowerCase()
  );
}
async function getDefaultConfigDir() {
  const out = await runPs(
    "[Environment]::GetEnvironmentVariable('CLAUDE_CONFIG_DIR','User')",
  ).catch(() => "");
  return out || null;
}
async function setDefaultConfigDir(dir) {
  const value = dir ? psSingleQuote(dir) : "$null";
  await runPs(
    `[Environment]::SetEnvironmentVariable('CLAUDE_CONFIG_DIR', ${value}, 'User')`,
  ).catch(() => {});
  const readback = await getDefaultConfigDir().catch(() => null);
  if (!sameDir(readback, dir)) {
    throw new Error(
      "Could not persist the default CLAUDE_CONFIG_DIR (value did not stick).",
    );
  }
}

// electron/lib/launcher.ts
var import_node_child_process2 = require("node:child_process");
var fs4 = __toESM(require("node:fs"));
var os4 = __toESM(require("node:os"));
var path4 = __toESM(require("node:path"));

// electron/lib/sharedState.ts
var fs3 = __toESM(require("node:fs"));
var os3 = __toESM(require("node:os"));
var path3 = __toESM(require("node:path"));
var SHARED_DIRS = [
  "projects",
  "shell-snapshots",
  "file-history",
  "session-env",
  "paste-cache",
  "jobs",
  "ide",
];
var SHARED_FILES = ["history.jsonl"];
function canonicalDir() {
  return path3.join(os3.homedir(), ".claude");
}
function alreadyLinkedTo(link, target) {
  try {
    const stat = fs3.lstatSync(link);
    if (!stat.isSymbolicLink()) return false;
    const resolved = path3.resolve(path3.dirname(link), fs3.readlinkSync(link));
    return resolved.toLowerCase() === path3.resolve(target).toLowerCase();
  } catch {
    return false;
  }
}
function mergeDirInto(srcDir, destDir) {
  fs3.mkdirSync(destDir, { recursive: true });
  let clean = true;
  for (const entry of fs3.readdirSync(srcDir)) {
    const from = path3.join(srcDir, entry);
    const to = path3.join(destDir, entry);
    const fromIsDir = fs3.lstatSync(from).isDirectory();
    if (!fs3.existsSync(to)) {
      fs3.renameSync(from, to);
    } else if (fromIsDir && fs3.lstatSync(to).isDirectory()) {
      if (mergeDirInto(from, to)) fs3.rmdirSync(from);
      else clean = false;
    } else {
      clean = false;
    }
  }
  return clean;
}
function ensureDirLinked(profileDir, name) {
  const target = path3.join(canonicalDir(), name);
  const link = path3.join(profileDir, name);
  fs3.mkdirSync(target, { recursive: true });
  if (alreadyLinkedTo(link, target)) return;
  if (fs3.existsSync(link)) {
    const stat = fs3.lstatSync(link);
    if (stat.isSymbolicLink()) {
      fs3.unlinkSync(link);
    } else {
      if (!mergeDirInto(link, target)) {
        throw new Error(
          `"${link}" still has unmerged content after merge \u2014 leaving it in place, not linking.`,
        );
      }
      fs3.rmdirSync(link);
    }
  }
  fs3.symlinkSync(target, link, "junction");
}
function ensureFileLinked(profileDir, name) {
  const target = path3.join(canonicalDir(), name);
  const link = path3.join(profileDir, name);
  if (!fs3.existsSync(target)) fs3.writeFileSync(target, "");
  if (fs3.existsSync(link)) {
    const same = fs3.statSync(link).ino === fs3.statSync(target).ino;
    if (same) return;
    const extra = fs3.readFileSync(link, "utf8");
    if (extra.length > 0) {
      const sep =
        fs3.existsSync(target) && fs3.statSync(target).size > 0 ? "\n" : "";
      fs3.appendFileSync(target, sep + extra);
    }
    fs3.unlinkSync(link);
  }
  fs3.linkSync(target, link);
}
function logSharedStateFailure(_profileDir, kind, name, err) {
  try {
    const detail = String(err?.code || err?.name || "Error").slice(0, 80);
    fs3.appendFileSync(
      path3.join(appDataDir(), "launcher-errors.log"),
      `${/* @__PURE__ */ new Date().toISOString()} sharedState ${kind} "${String(name).slice(0, 80)}": ${detail}\n`,
      "utf8",
    );
  } catch {}
}
function linkSharedState(profileDir) {
  if (isHomeDefaultDir(profileDir)) return;
  fs3.mkdirSync(profileDir, { recursive: true });
  for (const name of SHARED_DIRS) {
    try {
      ensureDirLinked(profileDir, name);
    } catch (err) {
      logSharedStateFailure(profileDir, "directory", name, err);
    }
  }
  for (const name of SHARED_FILES) {
    try {
      ensureFileLinked(profileDir, name);
    } catch (err) {
      logSharedStateFailure(profileDir, "file", name, err);
    }
  }
}

// electron/lib/launcher.ts
function envFor(profile) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (
      k.startsWith("ELECTRON_") ||
      k === "NODE_OPTIONS" ||
      k === "CLAUDE_CONFIG_DIR"
    )
      continue;
    env[k] = v;
  }
  if (!isHomeDefaultDir(profile.configDir)) {
    env.CLAUDE_CONFIG_DIR = profile.configDir;
  }
  return env;
}
function psSingleQuote2(s) {
  return `'${s.replace(/'/g, "''")}'`;
}
function fileExists(p) {
  try {
    fs4.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}
function findOnPath(exe) {
  const pathext = [".exe", ".cmd", ".bat", ""];
  for (const dir of (process.env.PATH ?? "").split(path4.delimiter)) {
    if (!dir) continue;
    for (const ext of pathext) {
      const candidate = path4.join(dir, exe + ext);
      if (fileExists(candidate)) return candidate;
    }
  }
  return null;
}
function vsCodeExecutable() {
  if (process.env.VSCODE_CLI_PATH && fileExists(process.env.VSCODE_CLI_PATH)) {
    const configured = process.env.VSCODE_CLI_PATH;
    if (path4.extname(configured).toLowerCase() === ".exe") return configured;
  }
  const candidates = [
    path4.join(
      process.env.LOCALAPPDATA ?? "",
      "Programs",
      "Microsoft VS Code",
      "Code.exe",
    ),
    path4.join(process.env.ProgramFiles ?? "", "Microsoft VS Code", "Code.exe"),
    path4.join(
      process.env["ProgramFiles(x86)"] ?? "",
      "Microsoft VS Code",
      "Code.exe",
    ),
  ];
  const cli = findOnPath("code");
  if (cli) candidates.push(path4.join(path4.dirname(cli), "..", "Code.exe"));
  return candidates.find(fileExists) ?? null;
}
function cleanElectronEnv(overrides = {}) {
  const env = { ...process.env, ...overrides };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.NODE_OPTIONS;
  return env;
}
function vsCodeCliScript(executable) {
  const direct = path4.join(
    path4.dirname(executable),
    "resources",
    "app",
    "out",
    "cli.js",
  );
  if (fileExists(direct)) return direct;
  const installRoot = path4.dirname(executable);
  const commandShim = path4.join(installRoot, "bin", "code.cmd");
  try {
    const shim = fs4.readFileSync(commandShim, "utf8");
    const match = shim.match(
      /\.\.\\([^"\r\n]+\\resources\\app\\out\\cli\.js)/i,
    );
    if (match) {
      const fromShim = path4.resolve(installRoot, match[1]);
      if (fileExists(fromShim)) return fromShim;
    }
  } catch {}
  try {
    return (
      fs4
        .readdirSync(installRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) =>
          path4.join(
            installRoot,
            entry.name,
            "resources",
            "app",
            "out",
            "cli.js",
          ),
        )
        .filter(fileExists)
        .sort((a, b) => fs4.statSync(b).mtimeMs - fs4.statSync(a).mtimeMs)[0] ??
      null
    );
  } catch {
    return null;
  }
}
function runVsCodeCli(executable, args, timeout = 15e3) {
  const script = vsCodeCliScript(executable);
  if (!script) {
    return { ok: false, stdout: "", error: "VS Code CLI was not found." };
  }
  const result = (0, import_node_child_process2.spawnSync)(
    executable,
    [script, ...args],
    {
      cwd: os4.homedir(),
      env: cleanElectronEnv({ ELECTRON_RUN_AS_NODE: "1" }),
      encoding: "utf8",
      windowsHide: true,
      shell: false,
      timeout,
    },
  );
  return {
    ok: !result.error && result.status === 0,
    stdout: result.stdout ?? "",
    error:
      result.error?.message ??
      (result.status === 0
        ? null
        : `VS Code CLI exited with ${result.status}.`),
  };
}
function readVSCodeExtensionStorageState(extensionId) {
  const dbPath = path4.join(
    process.env.APPDATA ?? path4.join(os4.homedir(), "AppData", "Roaming"),
    "Code",
    "User",
    "globalStorage",
    "state.vscdb",
  );
  if (!fileExists(dbPath)) {
    return { installedBefore: false, disabled: false, enabled: false };
  }
  let db;
  try {
    const { DatabaseSync } = require("node:sqlite");
    db = new DatabaseSync(dbPath, { readOnly: true });
    const rows = db
      .prepare(
        "SELECT key, value FROM ItemTable WHERE key = '__$__targetStorageMarker' OR lower(key) LIKE '%disabled%'",
      )
      .all();
    const marker = rows.find((row) => row.key === "__$__targetStorageMarker");
    const disabledValues = rows
      .filter((row) => String(row.key).toLowerCase().includes("disabled"))
      .map((row) => row.value);
    return extensionStateFromStorage(
      marker?.value,
      disabledValues,
      extensionId,
    );
  } catch {
    return { installedBefore: false, disabled: false, enabled: false };
  } finally {
    try {
      db?.close();
    } catch {}
  }
}
function latestExtensionPackage(extensionId) {
  const root = path4.join(os4.homedir(), ".vscode", "extensions");
  try {
    return fs4
      .readdirSync(root, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name.toLowerCase().startsWith(`${extensionId.toLowerCase()}-`),
      )
      .map((entry) => path4.join(root, entry.name))
      .sort((a, b) => b.localeCompare(a, "en", { numeric: true }))[0];
  } catch {
    return null;
  }
}
function inspectCodexVSCodeExtension(executable) {
  const id = "openai.chatgpt";
  const listed = runVsCodeCli(executable, [
    "--list-extensions",
    "--show-versions",
  ]);
  const installed = listed.ok && parseExtensionList(listed.stdout).has(id);
  const packageRoot = latestExtensionPackage(id);
  let version = null;
  let adapterSourcePresent = false;
  try {
    const manifest = JSON.parse(
      fs4.readFileSync(path4.join(packageRoot, "package.json"), "utf8"),
    );
    version = String(manifest.version ?? "");
    const commands = new Set(
      (manifest.contributes?.commands ?? []).map((item) => item.command),
    );
    const source = fs4.readFileSync(
      path4.join(packageRoot, manifest.main),
      "utf8",
    );
    adapterSourcePresent =
      commands.has("chatgpt.newChat") &&
      commands.has("chatgpt.newCodexPanel") &&
      source.includes("registerUriHandler") &&
      source.includes("/extension/panel/new");
  } catch {}
  const storage = readVSCodeExtensionStorageState(id);
  return {
    id,
    installed: installed || Boolean(packageRoot),
    enabled: storage.enabled,
    disabled: storage.disabled,
    version,
    adapterSourcePresent,
    // The extension currently contains a private URI handler, but there is no
    // documented stable CLI/URI contract for opening a panel in the new window.
    // Stay on the truthful extra-click path until that contract is supported
    // and can be exercised by the live UI smoke suite.
    panelAdapterVerified: false,
  };
}
function spawnDetachedExecutable(executable, args, options = {}) {
  const child = (0, import_node_child_process2.spawn)(executable, args, {
    cwd: options.cwd ?? os4.homedir(),
    env: options.env ?? cleanElectronEnv(),
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    shell: false,
  });
  child.unref();
}
async function openAllowedExternal(target, failureMessage) {
  try {
    const allowedTarget = validateExternalTarget(target);
    await import_electron4.shell.openExternal(allowedTarget);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        failureMessage ?? `Could not open the requested app: ${err.message}`,
    };
  }
}
async function launchClaudeCowork() {
  const result = await openAllowedExternal(
    CLAUDE_COWORK_URL,
    "Claude Desktop did not accept the Cowork link. Install or update Claude Desktop, then try again.",
  );
  return result.ok
    ? { ...result, globalAccount: true }
    : {
        ...result,
        code: "claude-desktop-unavailable",
        helpTarget: CLAUDE_DEEP_LINK_HELP_URL,
      };
}
async function launchCodexChat() {
  const result = await openAllowedExternal(
    CODEX_NEW_CHAT_URL,
    "The Codex app did not accept the new-chat link. Install or update Codex, then try again.",
  );
  return result.ok
    ? result
    : {
        ...result,
        code: "codex-app-unavailable",
        helpTarget: CODEX_COMMAND_HELP_URL,
      };
}
function launchVsCodeCodex(folder = null) {
  const executable = vsCodeExecutable();
  const extension = executable
    ? inspectCodexVSCodeExtension(executable)
    : { installed: false, enabled: false, panelAdapterVerified: false };
  const plan = planVsCodeCodexLaunch({ executable, extension, folder });
  if (!plan.ok) return plan;
  try {
    spawnDetachedExecutable(executable, plan.args);
    return { ...plan, extensionVersion: extension.version };
  } catch (err) {
    return {
      ok: false,
      code: "vscode-launch-failed",
      error: `Could not open VS Code: ${err.message}`,
      helpTarget: CODEX_COMMAND_HELP_URL,
    };
  }
}
function vsCodeProfileName(profile) {
  const label =
    profile.dashboardRole === "work"
      ? "Work"
      : profile.dashboardRole === "personal"
        ? "Personal"
        : profile.name;
  return `Claude ${String(label).replace(/"/g, "'").trim()}`;
}
function writeVSCodeProfileSettings(profileName, profile) {
  try {
    const codeUserDir = path4.join(
      process.env.APPDATA ?? path4.join(os4.homedir(), "AppData", "Roaming"),
      "Code",
      "User",
    );
    const storageFile = path4.join(
      codeUserDir,
      "globalStorage",
      "storage.json",
    );
    if (!fileExists(storageFile)) return false;
    const storage = JSON.parse(fs4.readFileSync(storageFile, "utf8"));
    const entry = (storage.userDataProfiles ?? []).find(
      (candidate) =>
        candidate.name?.toLowerCase() === profileName.toLowerCase(),
    );
    if (!entry?.location || entry.location.startsWith("builtin/")) return false;
    const profileDir = path4.join(codeUserDir, "profiles", entry.location);
    const profileSettingsFile = path4.join(profileDir, "settings.json");
    fs4.mkdirSync(profileDir, { recursive: true });
    let settings = {};
    if (fileExists(profileSettingsFile)) {
      settings = JSON.parse(fs4.readFileSync(profileSettingsFile, "utf8"));
    }
    const configDir = profile.configDir || canonicalDir();
    const variables = Array.isArray(settings["claudeCode.environmentVariables"])
      ? settings["claudeCode.environmentVariables"].filter(
          (item) => item?.name !== "CLAUDE_CONFIG_DIR",
        )
      : [];
    variables.push({ name: "CLAUDE_CONFIG_DIR", value: configDir });
    settings["claudeCode.environmentVariables"] = variables;
    settings["terminal.integrated.env.windows"] = {
      ...(settings["terminal.integrated.env.windows"] ?? {}),
      CLAUDE_CONFIG_DIR: configDir,
    };
    fs4.writeFileSync(
      profileSettingsFile,
      `${JSON.stringify(settings, null, 2)}\n`,
      "utf8",
    );
    return true;
  } catch (err) {
    logSharedStateFailure(
      profile.configDir,
      "VS Code profile",
      profile.id,
      err,
    );
    return false;
  }
}
function installClaudeVSCodeExtension(executable, profileName, profile) {
  const result = runVsCodeCli(
    executable,
    ["--profile", profileName, "--install-extension", "anthropic.claude-code"],
    30e3,
  );
  if (!result.ok) {
    logSharedStateFailure(
      profile.configDir,
      "VS Code extension",
      profile.id,
      new Error(result.error),
    );
  }
}
function scheduleVSCodeProfileSettings(executable, profileName, profile) {
  let attempts = 0;
  const tryWrite = () => {
    attempts += 1;
    if (writeVSCodeProfileSettings(profileName, profile)) {
      installClaudeVSCodeExtension(executable, profileName, profile);
      return;
    }
    if (attempts < 24) setTimeout(tryWrite, 250);
  };
  setTimeout(tryWrite, 250);
}
function prepareProfileState(profile) {
  if (profile.dashboardRole !== "personal") {
    linkSharedState(profile.configDir);
  }
}
var wtPath = () =>
  findOnPath("wt") ?? // Windows Terminal usually lives behind an app-execution alias:
  [
    path4.join(
      process.env.LOCALAPPDATA ?? "",
      "Microsoft",
      "WindowsApps",
      "wt.exe",
    ),
  ].find(fileExists) ??
  null;
var shellExe = () => (findOnPath("pwsh") ? "pwsh" : "powershell");
function innerCommand(profile, run) {
  const isDefault = isHomeDefaultDir(profile.configDir);
  const lines = [
    isDefault
      ? `Remove-Item Env:CLAUDE_CONFIG_DIR -ErrorAction SilentlyContinue`
      : `$env:CLAUDE_CONFIG_DIR=${psSingleQuote2(profile.configDir)}`,
    `$Host.UI.RawUI.WindowTitle='Claude \u2014 ' + ${psSingleQuote2(profile.name)}`,
    `Write-Host ('Claude account: ' + ${psSingleQuote2(profile.name)}) -ForegroundColor Cyan`,
    isDefault
      ? `Write-Host 'Using the machine default profile (~\\.claude)' -ForegroundColor DarkGray`
      : `Write-Host ('CLAUDE_CONFIG_DIR = ' + $env:CLAUDE_CONFIG_DIR) -ForegroundColor DarkGray`,
  ];
  if (run) lines.push(run);
  return lines.join("; ");
}
function encodePs(command) {
  return Buffer.from(command, "utf16le").toString("base64");
}
function buildTerminalInvocation(profile, run) {
  const encoded = encodePs(innerCommand(profile, run));
  const shell3 = shellExe();
  const env = envFor(profile);
  const cwd = os4.homedir();
  const wt = wtPath();
  if (wt) {
    return {
      exe: wt,
      args: [
        "new-tab",
        "--title",
        `Claude \u2014 ${profile.name}`,
        shell3,
        "-NoLogo",
        "-NoExit",
        "-EncodedCommand",
        encoded,
      ],
      env,
      cwd,
    };
  }
  return {
    exe: "cmd.exe",
    args: [
      "/d",
      "/s",
      "/c",
      `start "Claude" ${shell3} -NoLogo -NoExit -EncodedCommand ${encoded}`,
    ],
    env,
    cwd,
  };
}
function openTerminal(profile, run) {
  prepareProfileState(profile);
  const inv = buildTerminalInvocation(profile, run);
  (0, import_node_child_process2.spawn)(inv.exe, inv.args, {
    env: inv.env,
    cwd: inv.cwd,
    detached: true,
    stdio: "ignore",
    windowsVerbatimArguments: inv.exe === "cmd.exe",
  }).unref();
}
function openLoginTerminal(profile) {
  openTerminal(
    profile,
    "Write-Host 'Complete the sign-in in your browser (Anthropic or Google).' -ForegroundColor Yellow; claude auth login",
  );
}
function openVSCode(profile) {
  const executable = vsCodeExecutable();
  if (!executable) {
    return { ok: false, error: "The VS Code executable was not found." };
  }
  prepareProfileState(profile);
  const profileName = vsCodeProfileName(profile);
  const settingsReady = writeVSCodeProfileSettings(profileName, profile);
  if (settingsReady) {
    installClaudeVSCodeExtension(executable, profileName, profile);
  }
  try {
    spawnDetachedExecutable(
      executable,
      ["--new-window", "--profile", profileName],
      {
        env: envFor(profile),
      },
    );
    if (!settingsReady) {
      scheduleVSCodeProfileSettings(executable, profileName, profile);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Could not open VS Code: ${err.message}` };
  }
}
function openSafeCliTerminal(executable, args, title) {
  if (!new Set(["claude", "codex"]).has(executable)) {
    throw new Error("Unsupported session command.");
  }
  const resolved = findOnPath(executable);
  if (!resolved) throw new Error(`${executable} was not found on PATH.`);
  const allowedArguments = args.map((argument) => {
    const value = String(argument);
    if (value.length > 160 || /[\r\n\0]/.test(value)) {
      throw new Error("Unsafe session argument.");
    }
    return psSingleQuote2(value);
  });
  const command = `& ${psSingleQuote2(resolved)} ${allowedArguments.join(" ")}`;
  const encoded = encodePs(command);
  const shell3 = shellExe();
  const wt = wtPath();
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.NODE_OPTIONS;
  const invocation = wt
    ? {
        exe: wt,
        args: [
          "new-tab",
          "--title",
          title,
          shell3,
          "-NoLogo",
          "-NoExit",
          "-EncodedCommand",
          encoded,
        ],
        windowsVerbatimArguments: false,
      }
    : {
        exe: "cmd.exe",
        args: [
          "/d",
          "/s",
          "/c",
          `start "${title.replace(/"/g, "")}" ${shell3} -NoLogo -NoExit -EncodedCommand ${encoded}`,
        ],
        windowsVerbatimArguments: true,
      };
  (0, import_node_child_process2.spawn)(invocation.exe, invocation.args, {
    env,
    cwd: os4.homedir(),
    detached: true,
    stdio: "ignore",
    windowsVerbatimArguments: invocation.windowsVerbatimArguments,
  }).unref();
}
function claudeCliVersion() {
  return new Promise((resolve5) => {
    (0, import_node_child_process2.execFile)(
      "claude",
      ["--version"],
      { windowsHide: true, timeout: 15e3, shell: true },
      (_err, stdout) => resolve5(stdout?.trim() || void 0),
    );
  });
}

// electron/lib/localStats.ts
var fs5 = __toESM(require("node:fs"));
var path5 = __toESM(require("node:path"));
var readline = __toESM(require("node:readline"));
var FIVE_HOURS = 5 * 60 * 60 * 1e3;
var SEVEN_DAYS = 7 * 24 * 60 * 60 * 1e3;
function listTranscripts(configDir) {
  const projectsDir = path5.join(configDir, "projects");
  const out = [];
  let projectDirs = [];
  try {
    projectDirs = fs5
      .readdirSync(projectsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path5.join(projectsDir, d.name));
  } catch {
    return out;
  }
  for (const dir of projectDirs) {
    try {
      for (const entry of fs5.readdirSync(dir)) {
        if (!entry.endsWith(".jsonl")) continue;
        try {
          const st = fs5.statSync(path5.join(dir, entry));
          out.push({
            file: path5.join(dir, entry),
            mtime: st.mtimeMs,
            size: st.size,
          });
        } catch {}
      }
    } catch {}
  }
  return out;
}
function readActivity(configDir) {
  const now = Date.now();
  const transcripts = listTranscripts(configDir);
  const projects = new Set(transcripts.map((t) => path5.dirname(t.file))).size;
  let lastActiveAt;
  let sessions5h = 0;
  let sessions7d = 0;
  for (const t of transcripts) {
    if (!lastActiveAt || t.mtime > lastActiveAt) lastActiveAt = t.mtime;
    if (now - t.mtime <= FIVE_HOURS) sessions5h++;
    if (now - t.mtime <= SEVEN_DAYS) sessions7d++;
  }
  try {
    const h = fs5.statSync(path5.join(configDir, "history.jsonl"));
    if (!lastActiveAt || h.mtimeMs > lastActiveAt) lastActiveAt = h.mtimeMs;
  } catch {}
  return { lastActiveAt, sessions5h, sessions7d, projects };
}
async function estimateFromTranscripts(configDir) {
  const now = Date.now();
  const recent = listTranscripts(configDir)
    .filter((t) => now - t.mtime <= SEVEN_DAYS && t.size <= 8 * 1024 * 1024)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 25);
  let tokens = 0;
  let prompts = 0;
  for (const t of recent) {
    try {
      const rl = readline.createInterface({
        input: fs5.createReadStream(t.file, { encoding: "utf8" }),
        crlfDelay: Infinity,
      });
      for await (const line of rl) {
        if (!line) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.type === "user") prompts++;
          const usage = entry.message?.usage;
          if (usage)
            tokens += (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);
        } catch {}
      }
    } catch {}
  }
  return { estTokens7d: tokens, estPrompts7d: prompts };
}
async function readClaudeDailyHistory(days = 90) {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1e3;
  const totals = /* @__PURE__ */ new Map();
  const profiles = [];
  for (const profile of listProfiles()) {
    const daily = /* @__PURE__ */ new Map();
    const transcripts = listTranscripts(profile.configDir)
      .filter((t) => t.mtime >= cutoff && t.size <= 8 * 1024 * 1024)
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 120);
    for (const transcript of transcripts) {
      try {
        const rl = readline.createInterface({
          input: fs5.createReadStream(transcript.file, { encoding: "utf8" }),
          crlfDelay: Infinity,
        });
        for await (const line of rl) {
          if (!line) continue;
          try {
            const entry = JSON.parse(line);
            const usage = entry.message?.usage;
            if (!usage) continue;
            const timestamp = Date.parse(
              entry.timestamp ??
                entry.created_at ??
                entry.message?.timestamp ??
                new Date(transcript.mtime).toISOString(),
            );
            if (!Number.isFinite(timestamp) || timestamp < cutoff) continue;
            const date = new Date(timestamp).toISOString().slice(0, 10);
            const tokens =
              (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);
            if (!tokens) continue;
            daily.set(date, (daily.get(date) ?? 0) + tokens);
            totals.set(date, (totals.get(date) ?? 0) + tokens);
          } catch {}
        }
      } catch {}
    }
    profiles.push({
      profileId: profile.id,
      name: profile.name,
      dailyUsageBuckets: [...daily.entries()]
        .map(([startDate, tokens]) => ({ startDate, tokens }))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    });
  }
  return {
    fetchedAt: Date.now(),
    days,
    dailyUsageBuckets: [...totals.entries()]
      .map(([startDate, tokens]) => ({ startDate, tokens }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    profiles,
  };
}

// electron/lib/loginWatcher.ts
var fs6 = __toESM(require("node:fs"));
var path6 = __toESM(require("node:path"));
var POLL_MS = 2e3;
var TIMEOUT_MS = 10 * 60 * 1e3;
var active = /* @__PURE__ */ new Map();
function watchForLogin(profileId, configDir, onLogin) {
  stopWatching(profileId);
  const credsFile = path6.join(configDir, ".credentials.json");
  const startedAt = Date.now();
  const timer = setInterval(() => {
    if (Date.now() - startedAt > TIMEOUT_MS) {
      stopWatching(profileId);
      return;
    }
    try {
      const creds = JSON.parse(fs6.readFileSync(credsFile, "utf8"));
      if (creds.claudeAiOauth?.accessToken) {
        stopWatching(profileId);
        onLogin();
      }
    } catch {}
  }, POLL_MS);
  active.set(profileId, timer);
}
function stopWatching(profileId) {
  const timer = active.get(profileId);
  if (timer) clearInterval(timer);
  active.delete(profileId);
}
function stopAll() {
  for (const id of [...active.keys()]) stopWatching(id);
}

// electron/lib/profileStore.ts
var fs7 = __toESM(require("node:fs"));
var os5 = __toESM(require("node:os"));
var path7 = __toESM(require("node:path"));
var import_node_crypto = require("node:crypto");
function load() {
  const data = readJson(profilesFile());
  if (data && Array.isArray(data.profiles)) return data;
  return { version: 1, profiles: [] };
}
function save(store) {
  writeJsonAtomic(profilesFile(), store);
}
function slugify(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug || "account";
}
function listProfiles() {
  return load().profiles;
}
function getProfile(id) {
  return load().profiles.find((p) => p.id === id);
}
function normalizeDashboardRole(role) {
  return role === "work" || role === "personal" ? role : null;
}
function ensureDashboardRoleAvailable(store, role) {
  if (!role) return;
  if (store.profiles.some((p) => p.dashboardRole === role)) {
    throw new Error(
      `A ${role} Claude account is already assigned to the Dashboard.`,
    );
  }
}
function createProfile(name, dashboardRole) {
  const store = load();
  const trimmed = name.trim();
  const role = normalizeDashboardRole(dashboardRole);
  if (!trimmed) throw new Error("Account name is required.");
  if (
    store.profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())
  ) {
    throw new Error(`An account named "${trimmed}" already exists.`);
  }
  ensureDashboardRoleAvailable(store, role);
  const base = path7.join(os5.homedir(), `.claude-${slugify(trimmed)}`);
  let dir = base;
  for (let i = 2; fs7.existsSync(dir); i++) dir = `${base}${i}`;
  fs7.mkdirSync(dir, { recursive: true });
  const profile = {
    id: (0, import_node_crypto.randomUUID)(),
    name: trimmed,
    configDir: dir,
    createdAt: /* @__PURE__ */ new Date().toISOString(),
    ...(role ? { dashboardRole: role } : {}),
  };
  store.profiles.push(profile);
  save(store);
  return profile;
}
function importProfile(name, configDir, dashboardRole) {
  const store = load();
  const trimmed = name.trim();
  const role = normalizeDashboardRole(dashboardRole);
  if (!trimmed) throw new Error("Account name is required.");
  const dir = path7.resolve(configDir);
  if (!fs7.existsSync(dir) || !fs7.statSync(dir).isDirectory()) {
    throw new Error(`Folder does not exist: ${dir}`);
  }
  if (
    store.profiles.some(
      (p) => path7.resolve(p.configDir).toLowerCase() === dir.toLowerCase(),
    )
  ) {
    throw new Error("That folder is already registered as an account.");
  }
  if (
    store.profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())
  ) {
    throw new Error(`An account named "${trimmed}" already exists.`);
  }
  ensureDashboardRoleAvailable(store, role);
  const profile = {
    id: (0, import_node_crypto.randomUUID)(),
    name: trimmed,
    configDir: dir,
    createdAt: /* @__PURE__ */ new Date().toISOString(),
    ...(role ? { dashboardRole: role } : {}),
  };
  store.profiles.push(profile);
  save(store);
  return profile;
}
function renameProfile(id, name) {
  const store = load();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Account name is required.");
  const profile = store.profiles.find((p) => p.id === id);
  if (!profile) throw new Error("Account not found.");
  if (
    store.profiles.some(
      (p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase(),
    )
  ) {
    throw new Error(`An account named "${trimmed}" already exists.`);
  }
  profile.name = trimmed;
  save(store);
  return profile;
}
function removeProfile(id, deleteDir) {
  const store = load();
  const profile = store.profiles.find((p) => p.id === id);
  if (!profile) return;
  store.profiles = store.profiles.filter((p) => p.id !== id);
  save(store);
  if (deleteDir) {
    const home = path7.resolve(os5.homedir()).toLowerCase();
    const target = path7.resolve(profile.configDir);
    if (
      !target.toLowerCase().startsWith(home) ||
      target.toLowerCase() === home
    ) {
      throw new Error(
        "Refusing to delete a folder outside your home directory.",
      );
    }
    fs7.rmSync(target, { recursive: true, force: true });
  }
}
function exportProfiles() {
  return {
    version: 1,
    exportedAt: /* @__PURE__ */ new Date().toISOString(),
    profiles: listProfiles(),
  };
}

// electron/lib/tokenRefresh.ts
var fs8 = __toESM(require("node:fs"));
var path8 = __toESM(require("node:path"));
var TOKEN_ENDPOINT = "https://platform.claude.com/v1/oauth/token";
var CLAUDE_CODE_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
var EXPIRY_MARGIN_MS = 5 * 60 * 1e3;
function credsPath(configDir) {
  return path8.join(configDir, ".credentials.json");
}
function readCreds(configDir) {
  try {
    return JSON.parse(fs8.readFileSync(credsPath(configDir), "utf8"));
  } catch {
    return null;
  }
}
function toMs2(epoch) {
  if (!epoch || !Number.isFinite(epoch)) return 0;
  return epoch > 1e12 ? epoch : epoch * 1e3;
}
function writeCreds(configDir, creds) {
  const file = credsPath(configDir);
  const backup = `${file}.cam-backup`;
  if (fs8.existsSync(file) && !fs8.existsSync(backup)) {
    fs8.copyFileSync(file, backup);
  }
  const tmp = `${file}.${process.pid}.tmp`;
  fs8.writeFileSync(tmp, JSON.stringify(creds), "utf8");
  fs8.renameSync(tmp, file);
}
var TokenError = class extends Error {
  constructor(message, needsRelogin) {
    super(message);
    this.needsRelogin = needsRelogin;
  }
};
async function getValidAccessToken(configDir) {
  const creds = readCreds(configDir);
  const oauth = creds?.claudeAiOauth;
  if (!oauth?.accessToken || !oauth?.refreshToken) {
    throw new TokenError("Not logged in", true);
  }
  const expiresAt = toMs2(oauth.expiresAt);
  if (expiresAt === 0 || expiresAt > Date.now() + EXPIRY_MARGIN_MS) {
    return oauth.accessToken;
  }
  let res;
  try {
    res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: oauth.refreshToken,
        client_id: CLAUDE_CODE_CLIENT_ID,
      }),
    });
  } catch (err) {
    throw new TokenError(
      `Network error during token refresh: ${err.message}`,
      false,
    );
  }
  if (!res.ok) {
    const needsRelogin =
      res.status === 400 || res.status === 401 || res.status === 403;
    throw new TokenError(
      `Token refresh failed (HTTP ${res.status})`,
      needsRelogin,
    );
  }
  const body = await res.json();
  if (!body.access_token) {
    throw new TokenError("Token refresh returned no access token", false);
  }
  const updated = {
    ...creds,
    claudeAiOauth: {
      ...oauth,
      accessToken: body.access_token,
      refreshToken: body.refresh_token || oauth.refreshToken,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1e3,
    },
  };
  writeCreds(configDir, updated);
  return body.access_token;
}

// electron/lib/usageService.ts
var USAGE_ENDPOINT = "https://api.anthropic.com/api/oauth/usage";
var OAUTH_BETA_HEADER = "oauth-2025-04-20";
var USAGE_CACHE_FRESH_MS = 5 * 60 * 1e3;
var USAGE_REQUEST_GAP_MS = 1200;
var USAGE_BACKOFF_BASE_MS = 2 * 60 * 1e3;
var USAGE_BACKOFF_MAX_MS = 30 * 60 * 1e3;
function retryAfterMs(response, fallbackMs) {
  return parseRetryAfter(response.headers.get("retry-after"), fallbackMs);
}
function normalize(raw) {
  const limits = [];
  if (Array.isArray(raw.limits) && raw.limits.length > 0) {
    for (const l of raw.limits) {
      limits.push({
        kind: l.kind ?? "unknown",
        group: l.group,
        percent: typeof l.percent === "number" ? l.percent : 0,
        severity: l.severity ?? "normal",
        resetsAt: l.resets_at,
        modelName: l.scope?.model?.display_name ?? void 0,
        isActive: l.is_active,
      });
    }
  } else {
    if (raw.five_hour) {
      limits.push({
        kind: "session",
        percent: raw.five_hour.utilization ?? 0,
        severity: "normal",
        resetsAt: raw.five_hour.resets_at,
      });
    }
    if (raw.seven_day) {
      limits.push({
        kind: "weekly_all",
        percent: raw.seven_day.utilization ?? 0,
        severity: "normal",
        resetsAt: raw.seven_day.resets_at,
      });
    }
  }
  return {
    fetchedAt: Date.now(),
    ok: true,
    limits,
    extra: raw.extra_usage
      ? {
          enabled: Boolean(raw.extra_usage.is_enabled),
          usedCredits: raw.extra_usage.used_credits,
          monthlyLimit: raw.extra_usage.monthly_limit,
          currency: raw.extra_usage.currency,
          decimalPlaces: raw.extra_usage.decimal_places,
        }
      : void 0,
  };
}
var UsageService = class {
  cache;
  coordinator;
  constructor() {
    this.cache = readNewestJson(snapshotsFile()) ?? {};
    this.coordinator = new SerialRefreshCoordinator({
      gapMs: USAGE_REQUEST_GAP_MS,
    });
    try {
      this.persist();
    } catch {}
  }
  getCached(profileId) {
    return this.cache[profileId] ?? null;
  }
  dropProfile(profileId) {
    delete this.cache[profileId];
    this.persist();
  }
  async refresh(profile, options = {}) {
    const now = Date.now();
    const current = this.cache[profile.id];
    if (current?.retryAt && current.retryAt > now) return current;
    const lastAttempt = current?.lastAttemptAt ?? current?.fetchedAt ?? 0;
    if (!options.force && current && now - lastAttempt < USAGE_CACHE_FRESH_MS) {
      return current;
    }
    return this.coordinator.run(profile.id, () => this.fetchUsage(profile));
  }
  async fetchUsage(profile) {
    let snapshot;
    try {
      const token = await getValidAccessToken(profile.configDir);
      const res = await fetch(USAGE_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
          "anthropic-beta": OAUTH_BETA_HEADER,
        },
      });
      if (!res.ok) {
        const relogin = res.status === 401 || res.status === 403;
        const previousFailures = this.cache[profile.id]?.failureCount ?? 0;
        const exponential = exponentialBackoffMs(
          previousFailures,
          USAGE_BACKOFF_BASE_MS,
          USAGE_BACKOFF_MAX_MS,
        );
        const retryAt =
          res.status === 429 || res.status >= 500
            ? Date.now() + retryAfterMs(res, exponential)
            : void 0;
        snapshot = this.failed(
          profile.id,
          relogin
            ? "Session expired \u2014 log in again from a terminal"
            : res.status === 429
              ? "Usage refresh paused briefly (rate limit)"
              : res.status >= 500
                ? "Claude usage service is temporarily unavailable"
                : `Usage API error (HTTP ${res.status})`,
          { status: res.status, retryAt },
        );
      } else {
        snapshot = {
          ...normalize(await res.json()),
          lastAttemptAt: Date.now(),
          lastSuccessAt: Date.now(),
          failureCount: 0,
        };
      }
    } catch (err) {
      const msg =
        err instanceof TokenError
          ? err.needsRelogin
            ? "Session expired \u2014 log in again from a terminal"
            : err.message
          : `Offline or unreachable: ${err.message}`;
      const previousFailures = this.cache[profile.id]?.failureCount ?? 0;
      const retryAt =
        err instanceof TokenError && err.needsRelogin
          ? void 0
          : Date.now() +
            exponentialBackoffMs(
              previousFailures,
              USAGE_BACKOFF_BASE_MS,
              USAGE_BACKOFF_MAX_MS,
            );
      snapshot = this.failed(profile.id, msg, { retryAt });
    }
    this.cache[profile.id] = snapshot;
    try {
      this.persist();
    } catch (err) {
      logSharedStateFailure(profile.configDir, "usage cache", profile.id, err);
    }
    return snapshot;
  }
  /** Failed fetch keeps the previous limits so the UI can show stale-but-real data. */
  failed(profileId, error, details = {}) {
    return retainFailedSnapshot(this.cache[profileId], error, details);
  }
  persist() {
    writeJsonAtomic(snapshotsFile(), this.cache);
  }
};

// electron/lib/api/analytics.ts
var DAY_MS = 24 * 60 * 60 * 1e3;
var CUMULATIVE_FIELD = {
  cost: "lifetimeCostUsd",
  tokens: "lifetimeTokens",
  requests: "lifetimeRequests",
};
function seriesFor(snapshots, metric) {
  const field = CUMULATIVE_FIELD[metric];
  return snapshots
    .filter(
      (s) => s.ok && typeof s[field] === "number" && Number.isFinite(s[field]),
    )
    .map((s) => ({ at: s.at, value: s[field] }))
    .sort((a, b) => a.at - b.at);
}
function consumptionBetween(series, fromMs, toMs3) {
  const pts = series.filter((p) => p.at >= fromMs && p.at <= toMs3);
  const baseline = [...series].reverse().find((p) => p.at <= fromMs);
  const walk = baseline ? [baseline, ...pts] : pts;
  let total = 0;
  for (let i = 1; i < walk.length; i++) {
    const delta = walk[i].value - walk[i - 1].value;
    if (delta > 0) total += delta;
  }
  return total;
}
function lifetimeConsumption(series) {
  if (series.length === 0) return 0;
  let total = 0;
  for (let i = 1; i < series.length; i++) {
    const delta = series[i].value - series[i - 1].value;
    if (delta > 0) total += delta;
  }
  return series.length === 1 ? series[0].value : total;
}
function startOfLocalDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function windowUsage(snapshots, metric, now) {
  const series = seriesFor(snapshots, metric);
  if (series.length === 0) return { today: 0, week: 0, month: 0, lifetime: 0 };
  const todayStart = startOfLocalDay(now);
  return {
    today: consumptionBetween(series, todayStart, now),
    week: consumptionBetween(series, now - 7 * DAY_MS, now),
    month: consumptionBetween(series, now - 30 * DAY_MS, now),
    lifetime: lifetimeConsumption(series),
  };
}
function localDateKey(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dailyBuckets(snapshots, metric, days, now) {
  const series = seriesFor(snapshots, metric);
  const spanDays = days > 0 ? days : lifetimeSpanDays(series, now);
  const buckets = [];
  let running = 0;
  for (let i = spanDays - 1; i >= 0; i--) {
    const dayStart = startOfLocalDay(now - i * DAY_MS);
    const dayEnd = dayStart + DAY_MS;
    const daily = consumptionBetween(series, dayStart, Math.min(dayEnd, now));
    running += daily;
    buckets.push({ date: localDateKey(dayStart), daily, running });
  }
  return buckets;
}
function lifetimeSpanDays(series, now) {
  if (series.length === 0) return 1;
  const first = series[0].at;
  return Math.max(1, Math.ceil((now - startOfLocalDay(first)) / DAY_MS) + 1);
}
function isSparse(snapshots, metric) {
  const series = seriesFor(snapshots, metric);
  if (series.length < 2) return true;
  return series[series.length - 1].at - series[0].at < DAY_MS / 2;
}
function avgDailySpend(snapshots, now, lookbackDays = 14) {
  const series = seriesFor(snapshots, "cost");
  if (series.length < 2) return null;
  const coverageStart = Math.max(series[0].at, now - lookbackDays * DAY_MS);
  const spent = consumptionBetween(series, coverageStart, now);
  const coveredDays = Math.max(1, (now - coverageStart) / DAY_MS);
  return spent / coveredDays;
}
function projectSpend(snapshots, balanceUsd, now) {
  const avg = avgDailySpend(snapshots, now);
  const projectedMonthly = avg === null ? null : avg * 30;
  let runway = null;
  if (
    avg !== null &&
    avg > 0 &&
    typeof balanceUsd === "number" &&
    balanceUsd >= 0
  ) {
    runway = balanceUsd / avg;
  }
  return {
    avgDailySpendUsd: avg,
    projectedMonthlyUsd: projectedMonthly,
    runwayDays: runway,
  };
}
function computeStatus(params) {
  const { record, latest, monthSpend, runwayDays, balanceUsd } = params;
  if (!latest || !latest.ok) return "unknown";
  if (runwayDays !== null) {
    if (runwayDays < 7) return "red";
    if (runwayDays < 21) return "yellow";
  }
  if (
    runwayDays === null &&
    typeof balanceUsd === "number" &&
    balanceUsd >= 0
  ) {
    if (balanceUsd <= 2) return "red";
    if (balanceUsd <= 10) return "yellow";
  }
  if (
    typeof record.monthlyBudgetUsd === "number" &&
    record.monthlyBudgetUsd > 0
  ) {
    const pct = (monthSpend / record.monthlyBudgetUsd) * 100;
    if (pct >= 100) return "red";
    if (pct >= 80) return "yellow";
  }
  return "green";
}

// electron/lib/api/adapters/base.ts
var DEFAULT_TIMEOUT_MS = 15e3;
async function safeFetch(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    init.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    let json = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        json,
        error: describeStatus(res.status),
      };
    }
    return { ok: true, status: res.status, json };
  } catch (err) {
    const msg =
      err.name === "AbortError"
        ? "Request timed out"
        : "Network error / offline";
    return { ok: false, status: 0, json: null, error: msg };
  } finally {
    clearTimeout(timer);
  }
}
function describeStatus(status) {
  switch (status) {
    case 401:
      return "Key rejected (401) \u2014 invalid or revoked";
    case 403:
      return "Forbidden (403) \u2014 this key lacks permission (may need an admin/management key)";
    case 404:
      return "Endpoint not found (404)";
    case 429:
      return "Rate limited (429) \u2014 try again shortly";
    default:
      return status >= 500
        ? `Provider error (${status})`
        : `Request failed (${status})`;
  }
}
function failedSnapshot(at, error) {
  return { at, ok: false, error };
}

// electron/lib/api/adapters/anthropic.ts
var ANTHROPIC_META = {
  id: "anthropic",
  displayName: "Anthropic (Claude)",
  keyPrefixes: ["sk-ant-api", "sk-ant-admin", "sk-ant-"],
  docsUrl: "https://platform.claude.com/docs/en/manage-claude/usage-cost-api",
  accent: "#d97757",
  // coral
  supportsAdminKey: true,
  billingModel: "postpaid",
  // Cost/usage need an admin key; balance never available; rate limits admin-only.
  capabilities: {
    balance: "none",
    usage: "admin",
    cost: "admin",
    rateLimits: "admin",
  },
};
var API_VERSION = "2023-06-01";
var DAY_MS2 = 24 * 60 * 60 * 1e3;
var LOOKBACK_DAYS = 30;
function num(v) {
  const n =
    typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
}
async function validate(secret) {
  const res = await safeFetch("https://api.anthropic.com/v1/models", {
    headers: { "x-api-key": secret, "anthropic-version": API_VERSION },
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
var anthropicAdapter = {
  meta: ANTHROPIC_META,
  detectKeyKind(secret) {
    const s = secret.trim();
    return {
      valid: s.startsWith("sk-ant-"),
      isAdminKey: s.startsWith("sk-ant-admin"),
    };
  },
  async fetchSnapshot(secret, record) {
    const at = Date.now();
    const isAdmin =
      record.isAdminKey || secret.trim().startsWith("sk-ant-admin");
    if (!isAdmin) {
      const v = await validate(secret);
      if (!v.ok) return failedSnapshot(at, v.error ?? "Validation failed");
      return {
        at,
        ok: true,
        currency: "USD",
        balanceUsd: null,
        lifetimeCostUsd: null,
        tier: "standard key \u2014 add an admin key for cost/usage",
      };
    }
    const startingAt = new Date(at - LOOKBACK_DAYS * DAY_MS2).toISOString();
    const endingAt = new Date(at).toISOString();
    const adminHeaders = {
      "x-api-key": secret,
      "anthropic-version": API_VERSION,
    };
    const costRes = await safeFetch(
      `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${encodeURIComponent(
        startingAt,
      )}&ending_at=${encodeURIComponent(endingAt)}`,
      { headers: adminHeaders },
    );
    if (!costRes.ok)
      return failedSnapshot(at, costRes.error ?? "Cost report failed");
    const costEnv = costRes.json;
    const todayStart = new Date(at).setHours(0, 0, 0, 0);
    let costToday = 0;
    let costWeek = 0;
    let costMonth = 0;
    for (const bucket of costEnv.data ?? []) {
      const bucketMs = bucket.starting_at
        ? Date.parse(bucket.starting_at)
        : NaN;
      const amount = (bucket.results ?? []).reduce(
        (sum, r) => sum + num(r.amount ?? r.cost),
        0,
      );
      costMonth += amount;
      if (Number.isFinite(bucketMs)) {
        if (bucketMs >= at - 7 * DAY_MS2) costWeek += amount;
        if (bucketMs >= todayStart) costToday += amount;
      }
    }
    let tokensMonth = 0;
    let requestsMonth = 0;
    const usageRes = await safeFetch(
      `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${encodeURIComponent(
        startingAt,
      )}&ending_at=${encodeURIComponent(endingAt)}&bucket_width=1d`,
      { headers: adminHeaders },
    );
    if (usageRes.ok) {
      const env = usageRes.json;
      for (const bucket of env.data ?? []) {
        for (const r of bucket.results ?? []) {
          tokensMonth +=
            num(r.uncached_input_tokens) +
            num(r.cache_creation_input_tokens) +
            num(r.cache_read_input_tokens) +
            num(r.output_tokens) +
            num(r.input_tokens);
          requestsMonth += num(r.num_requests ?? r.request_count);
        }
      }
    }
    return {
      at,
      ok: true,
      currency: "USD",
      balanceUsd: null,
      lifetimeCostUsd: costMonth,
      lifetimeTokens: tokensMonth || null,
      lifetimeRequests: requestsMonth || null,
      directCost: {
        today: costToday,
        week: costWeek,
        month: costMonth,
        lifetime: costMonth,
      },
      tier: "admin key",
    };
  },
};

// electron/lib/api/adapters/gemini.ts
var GEMINI_META = {
  id: "gemini",
  displayName: "Google Gemini",
  keyPrefixes: ["AIza", "AQ."],
  docsUrl: "https://ai.google.dev/gemini-api/docs/rate-limits",
  accent: "#eda100",
  // yellow
  supportsAdminKey: false,
  billingModel: "postpaid",
  // AI Studio keys expose nothing but validity; everything else is unavailable.
  capabilities: {
    balance: "none",
    usage: "none",
    cost: "estimated",
    rateLimits: "none",
  },
};
var geminiAdapter = {
  meta: GEMINI_META,
  detectKeyKind(secret) {
    const s = secret.trim();
    return { valid: s.length > 10, isAdminKey: false };
  },
  async fetchSnapshot(secret, _record) {
    const at = Date.now();
    const res = await safeFetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(secret)}`,
    );
    if (!res.ok) return failedSnapshot(at, res.error ?? "Validation failed");
    return {
      at,
      ok: true,
      currency: "USD",
      balanceUsd: null,
      lifetimeCostUsd: null,
      tier: "AI Studio key \u2014 no usage/billing API (see provider notes)",
    };
  },
};

// electron/lib/api/adapters/openai.ts
var OPENAI_META = {
  id: "openai",
  displayName: "OpenAI",
  keyPrefixes: ["sk-proj-", "sk-admin-", "sk-svcacct-", "sk-"],
  docsUrl: "https://platform.openai.com/docs/api-reference/usage",
  accent: "#1baf7a",
  // aqua/green
  supportsAdminKey: true,
  billingModel: "postpaid",
  capabilities: {
    balance: "none",
    usage: "admin",
    cost: "admin",
    rateLimits: "none",
  },
};
var DAY_MS3 = 24 * 60 * 60 * 1e3;
var LOOKBACK_DAYS2 = 30;
async function validate2(secret) {
  const res = await safeFetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
var openAiAdapter = {
  meta: OPENAI_META,
  detectKeyKind(secret) {
    const s = secret.trim();
    return {
      valid: s.startsWith("sk-"),
      isAdminKey: s.startsWith("sk-admin-"),
    };
  },
  async fetchSnapshot(secret, record) {
    const at = Date.now();
    const isAdmin = record.isAdminKey || secret.trim().startsWith("sk-admin-");
    if (!isAdmin) {
      const v = await validate2(secret);
      if (!v.ok) return failedSnapshot(at, v.error ?? "Validation failed");
      return {
        at,
        ok: true,
        currency: "USD",
        balanceUsd: null,
        lifetimeCostUsd: null,
        tier: "project key \u2014 add an admin key for cost/usage",
      };
    }
    const startTime = Math.floor((at - LOOKBACK_DAYS2 * DAY_MS3) / 1e3);
    const auth = { Authorization: `Bearer ${secret}` };
    const costRes = await safeFetch(
      `https://api.openai.com/v1/organization/costs?start_time=${startTime}&bucket_width=1d&limit=31`,
      { headers: auth },
    );
    if (!costRes.ok)
      return failedSnapshot(at, costRes.error ?? "Costs endpoint failed");
    const costEnv = costRes.json;
    const todayStart = Math.floor(new Date(at).setHours(0, 0, 0, 0) / 1e3);
    let costToday = 0;
    let costWeek = 0;
    let costMonth = 0;
    const weekStart = Math.floor((at - 7 * DAY_MS3) / 1e3);
    for (const bucket of costEnv.data ?? []) {
      const t = bucket.start_time ?? 0;
      const amount = (bucket.results ?? []).reduce(
        (sum, r) => sum + (r.amount?.value ?? 0),
        0,
      );
      costMonth += amount;
      if (t >= weekStart) costWeek += amount;
      if (t >= todayStart) costToday += amount;
    }
    let tokensMonth = 0;
    let requestsMonth = 0;
    const usageRes = await safeFetch(
      `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&bucket_width=1d&limit=31`,
      { headers: auth },
    );
    if (usageRes.ok) {
      const env = usageRes.json;
      for (const bucket of env.data ?? []) {
        for (const r of bucket.results ?? []) {
          tokensMonth += (r.input_tokens ?? 0) + (r.output_tokens ?? 0);
          requestsMonth += r.num_model_requests ?? 0;
        }
      }
    }
    return {
      at,
      ok: true,
      currency: "USD",
      balanceUsd: null,
      lifetimeCostUsd: costMonth,
      lifetimeTokens: tokensMonth || null,
      lifetimeRequests: requestsMonth || null,
      directCost: {
        today: costToday,
        week: costWeek,
        month: costMonth,
        lifetime: costMonth,
      },
      tier: "admin key",
    };
  },
};

// electron/lib/api/adapters/openrouter.ts
var OPENROUTER_META = {
  id: "openrouter",
  displayName: "OpenRouter",
  keyPrefixes: ["sk-or-"],
  docsUrl: "https://openrouter.ai/docs/api-reference/limits",
  accent: "#4a3aa7",
  // violet
  supportsAdminKey: false,
  billingModel: "prepaid",
  capabilities: {
    balance: "exact",
    usage: "exact",
    cost: "exact",
    rateLimits: "exact",
  },
};
var openRouterAdapter = {
  meta: OPENROUTER_META,
  detectKeyKind(secret) {
    return { valid: /^sk-or-\S+/.test(secret.trim()), isAdminKey: false };
  },
  async fetchSnapshot(secret, _record) {
    const at = Date.now();
    const auth = { Authorization: `Bearer ${secret}` };
    const keyRes = await safeFetch("https://openrouter.ai/api/v1/key", {
      headers: auth,
    });
    if (!keyRes.ok)
      return failedSnapshot(at, keyRes.error ?? "Failed to read key info");
    const d = keyRes.json.data ?? {};
    let balanceUsd = null;
    let creditLimitUsd = null;
    const creditsRes = await safeFetch("https://openrouter.ai/api/v1/credits", {
      headers: auth,
    });
    if (creditsRes.ok) {
      const c = creditsRes.json.data ?? {};
      if (typeof c.total_credits === "number") {
        creditLimitUsd = c.total_credits;
        balanceUsd = c.total_credits - (c.total_usage ?? 0);
      }
    }
    if (balanceUsd === null && typeof d.limit_remaining === "number") {
      balanceUsd = d.limit_remaining;
      creditLimitUsd = typeof d.limit === "number" ? d.limit : null;
    }
    const rpmLimit =
      d.rate_limit && typeof d.rate_limit.requests === "number"
        ? d.rate_limit.requests
        : null;
    return {
      at,
      ok: true,
      currency: "USD",
      balanceUsd,
      creditLimitUsd,
      lifetimeCostUsd: typeof d.usage === "number" ? d.usage : null,
      rpmLimit,
      tier: d.is_free_tier ? "free" : void 0,
      directCost: {
        today: d.usage_daily,
        week: d.usage_weekly,
        month: d.usage_monthly,
        lifetime: d.usage,
      },
    };
  },
};

// electron/lib/api/adapters/index.ts
var ADAPTERS = {
  anthropic: anthropicAdapter,
  openai: openAiAdapter,
  gemini: geminiAdapter,
  openrouter: openRouterAdapter,
};
var PROVIDER_ORDER = ["openrouter", "anthropic", "openai", "gemini"];
var PROVIDER_META = {
  anthropic: ANTHROPIC_META,
  openai: OPENAI_META,
  gemini: GEMINI_META,
  openrouter: OPENROUTER_META,
};
function getAdapter(id) {
  const adapter = ADAPTERS[id];
  if (!adapter) throw new Error(`No adapter for provider "${id}"`);
  return adapter;
}
function allProviderMeta() {
  return PROVIDER_ORDER.map((id) => PROVIDER_META[id]);
}

// electron/lib/api/keyStore.ts
var import_electron2 = require("electron");
var import_node_crypto2 = require("node:crypto");
function loadRecords() {
  const data = readJson(apiKeysFile());
  if (data && Array.isArray(data.records)) return data;
  return { version: 1, records: [] };
}
function saveRecords(shape) {
  writeJsonAtomic(apiKeysFile(), shape);
}
function loadVault() {
  const data = readJson(apiKeyVaultFile());
  if (data && data.secrets) return data;
  return { version: 1, secrets: {} };
}
function saveVault(shape) {
  writeJsonAtomic(apiKeyVaultFile(), shape);
}
function isEncryptionAvailable() {
  try {
    return import_electron2.safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}
function maskKey(secret) {
  const trimmed = secret.trim();
  if (trimmed.length <= 8) return "*".repeat(Math.max(4, trimmed.length));
  const secondHyphen = trimmed.indexOf("-", trimmed.indexOf("-") + 1);
  const prefixLen =
    secondHyphen >= 0 && secondHyphen <= 9
      ? secondHyphen + 1
      : Math.min(6, trimmed.length - 4);
  const prefix = trimmed.slice(0, prefixLen);
  const suffix = trimmed.slice(-4);
  const stars = "*".repeat(
    Math.max(6, Math.min(24, trimmed.length - prefix.length - 4)),
  );
  return `${prefix}${stars}${suffix}`;
}
function listRecords() {
  return loadRecords().records;
}
function getRecord(id) {
  return loadRecords().records.find((r) => r.id === id);
}
function getSecret(id) {
  const vault = loadVault();
  const enc = vault.secrets[id];
  if (!enc) return null;
  try {
    return import_electron2.safeStorage.decryptString(
      Buffer.from(enc, "base64"),
    );
  } catch {
    return null;
  }
}
function addKey(input) {
  if (!isEncryptionAvailable()) {
    throw new Error(
      "OS encryption (DPAPI) is unavailable, so the key cannot be stored securely. Aborting.",
    );
  }
  const nickname = input.nickname.trim();
  const secret = input.secret.trim();
  if (!nickname) throw new Error("A nickname is required.");
  if (!secret) throw new Error("The API key is required.");
  const records = loadRecords();
  if (
    records.records.some(
      (r) => r.nickname.toLowerCase() === nickname.toLowerCase(),
    )
  ) {
    throw new Error(`A key named "${nickname}" already exists.`);
  }
  const id = (0, import_node_crypto2.randomUUID)();
  const record = {
    id,
    provider: input.provider,
    nickname,
    maskedKey: maskKey(secret),
    createdAt: /* @__PURE__ */ new Date().toISOString(),
    isAdminKey: input.isAdminKey ?? false,
    monthlyBudgetUsd: input.monthlyBudgetUsd ?? null,
  };
  const vault = loadVault();
  vault.secrets[id] = import_electron2.safeStorage
    .encryptString(secret)
    .toString("base64");
  saveVault(vault);
  records.records.push(record);
  saveRecords(records);
  return record;
}
function updateKey(id, patch) {
  const records = loadRecords();
  const record = records.records.find((r) => r.id === id);
  if (!record) throw new Error("Key not found.");
  if (patch.nickname !== void 0) {
    const nickname = patch.nickname.trim();
    if (!nickname) throw new Error("A nickname is required.");
    if (
      records.records.some(
        (r) =>
          r.id !== id && r.nickname.toLowerCase() === nickname.toLowerCase(),
      )
    ) {
      throw new Error(`A key named "${nickname}" already exists.`);
    }
    record.nickname = nickname;
  }
  if (patch.isAdminKey !== void 0) record.isAdminKey = patch.isAdminKey;
  if (patch.monthlyBudgetUsd !== void 0)
    record.monthlyBudgetUsd = patch.monthlyBudgetUsd;
  if (patch.secret !== void 0) {
    const secret = patch.secret.trim();
    if (!secret) throw new Error("The API key is required.");
    if (!isEncryptionAvailable())
      throw new Error("OS encryption is unavailable; cannot rotate the key.");
    const vault = loadVault();
    vault.secrets[id] = import_electron2.safeStorage
      .encryptString(secret)
      .toString("base64");
    saveVault(vault);
    record.maskedKey = maskKey(secret);
  }
  saveRecords(records);
  return record;
}
function removeKey(id) {
  const records = loadRecords();
  records.records = records.records.filter((r) => r.id !== id);
  saveRecords(records);
  const vault = loadVault();
  if (vault.secrets[id]) {
    delete vault.secrets[id];
    saveVault(vault);
  }
}
function exportRecords() {
  return {
    version: 1,
    exportedAt: /* @__PURE__ */ new Date().toISOString(),
    records: listRecords(),
  };
}

// electron/lib/api/snapshotStore.ts
var MAX_PER_KEY = 2e3;
function load2() {
  const data = readJson(apiSnapshotsFile());
  if (data && data.series) return data;
  return { version: 1, series: {} };
}
function save2(shape) {
  writeJsonAtomic(apiSnapshotsFile(), shape);
}
function getSeries(keyId) {
  return load2().series[keyId] ?? [];
}
function sameCumulative(a, b) {
  return (
    a.ok &&
    b.ok &&
    a.lifetimeCostUsd === b.lifetimeCostUsd &&
    a.lifetimeTokens === b.lifetimeTokens &&
    a.lifetimeRequests === b.lifetimeRequests &&
    a.balanceUsd === b.balanceUsd
  );
}
function appendSnapshot(keyId, snapshot) {
  const shape = load2();
  const series = shape.series[keyId] ?? [];
  const last = series[series.length - 1];
  if (
    last &&
    sameCumulative(last, snapshot) &&
    series.length >= 2 &&
    sameCumulative(series[series.length - 2], last)
  ) {
    series[series.length - 1] = snapshot;
  } else {
    series.push(snapshot);
  }
  if (series.length > MAX_PER_KEY)
    series.splice(0, series.length - MAX_PER_KEY);
  shape.series[keyId] = series;
  save2(shape);
}
function seedHistory(keyId, history) {
  if (history.length === 0) return;
  const shape = load2();
  const existing = shape.series[keyId] ?? [];
  const merged = [...history, ...existing].sort((a, b) => a.at - b.at);
  shape.series[keyId] = merged.slice(-MAX_PER_KEY);
  save2(shape);
}
function dropSeries(keyId) {
  const shape = load2();
  if (shape.series[keyId]) {
    delete shape.series[keyId];
    save2(shape);
  }
}

// electron/lib/api/apiService.ts
var RANGE_DAYS = { "1d": 1, "7d": 7, "30d": 30, lifetime: 0 };
function costWindows(series, latest, now) {
  const derived = windowUsage(series, "cost", now);
  const direct = latest?.ok ? latest.directCost : void 0;
  if (!direct) return derived;
  return {
    today: direct.today ?? derived.today,
    week: direct.week ?? derived.week,
    month: direct.month ?? derived.month,
    lifetime: direct.lifetime ?? derived.lifetime,
  };
}
function fakeHistory(record, now) {
  const DAY = 24 * 60 * 60 * 1e3;
  const hasBalance = record.provider === "openrouter";
  const reportsCost = record.provider === "openrouter" || record.isAdminKey;
  if (!reportsCost) return [];
  const out = [];
  let cumulative = 0;
  const limit = 50;
  for (let i = 14; i >= 0; i--) {
    const at = now - i * DAY;
    const daily = 0.4 + ((i * 37) % 11) / 10;
    cumulative += daily;
    out.push({
      at,
      ok: true,
      currency: "USD",
      lifetimeCostUsd: Number(cumulative.toFixed(4)),
      lifetimeTokens: Math.round(cumulative * 9e4),
      lifetimeRequests: Math.round(cumulative * 40),
      balanceUsd: hasBalance ? Number((limit - cumulative).toFixed(4)) : null,
      creditLimitUsd: hasBalance ? limit : null,
    });
  }
  return out;
}
function permissionCapability(value, detail) {
  return { value, detail };
}
async function probeProviderPermissions(provider, secret, adapter, kind) {
  const base = {
    provider,
    isAdminKey: kind.isAdminKey,
    docsUrl: adapter.meta.docsUrl,
  };
  if (provider === "openai") {
    const trimmed = secret.trim();
    if (!kind.isAdminKey) {
      const auth = await validate2(secret);
      const keyKind = trimmed.startsWith("sk-svcacct-")
        ? "Project service-account key"
        : trimmed.startsWith("sk-proj-")
          ? "Project key"
          : "Standard API key";
      return {
        ...base,
        ok: auth.ok,
        keyKind,
        analyticsReady: false,
        checks: [
          {
            label: "API authentication",
            status: auth.ok ? "pass" : "fail",
            detail: auth.ok ? "Models endpoint accepted the key." : auth.error,
          },
          {
            label: "Organization usage & cost",
            status: "info",
            detail: "Project keys cannot read organization analytics.",
          },
        ],
        capabilities: {
          validation: permissionCapability(auth.ok ? "available" : "failed"),
          usage: permissionCapability(
            "unavailable",
            "Requires an OpenAI admin key.",
          ),
          cost: permissionCapability(
            "unavailable",
            "Requires an OpenAI admin key.",
          ),
          balance: permissionCapability(
            "unavailable",
            "OpenAI exposes costs rather than a key balance.",
          ),
        },
        recommendation: auth.ok
          ? "This key can make API requests, but it will not populate organization spend or token analytics. Use an sk-admin- key for those panels."
          : null,
        error: auth.ok ? null : auth.error,
      };
    }
    const at = Date.now();
    const startTime = Math.floor((at - DAY_MS3) / 1e3);
    const headers = { Authorization: `Bearer ${secret}` };
    const [cost, usage] = await Promise.all([
      safeFetch(
        `https://api.openai.com/v1/organization/costs?start_time=${startTime}&bucket_width=1d&limit=2`,
        { headers },
      ),
      safeFetch(
        `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&bucket_width=1d&limit=2`,
        { headers },
      ),
    ]);
    const authenticated = cost.status !== 401 && usage.status !== 401;
    return {
      ...base,
      ok: authenticated,
      keyKind: "Organization admin key",
      analyticsReady: cost.ok && usage.ok,
      checks: [
        {
          label: "Organization costs",
          status: cost.ok ? "pass" : "fail",
          detail: cost.ok ? "Cost reporting is available." : cost.error,
        },
        {
          label: "Organization token usage",
          status: usage.ok ? "pass" : "fail",
          detail: usage.ok ? "Usage reporting is available." : usage.error,
        },
      ],
      capabilities: {
        validation: permissionCapability(
          authenticated ? "available" : "failed",
        ),
        usage: permissionCapability(
          usage.ok ? "available" : "unavailable",
          usage.error,
        ),
        cost: permissionCapability(
          cost.ok ? "available" : "unavailable",
          cost.error,
        ),
        balance: permissionCapability(
          "unavailable",
          "OpenAI exposes costs rather than a key balance.",
        ),
      },
      recommendation:
        cost.ok && usage.ok
          ? "All OpenAI analytics permissions are ready."
          : "The key is recognized as an admin key, but one or more organization permissions are missing.",
      error: authenticated ? null : (cost.error ?? usage.error),
    };
  }
  if (provider === "anthropic") {
    if (!kind.isAdminKey) {
      const auth = await validate(secret);
      return {
        ...base,
        ok: auth.ok,
        keyKind: "Standard API key",
        analyticsReady: false,
        checks: [
          {
            label: "API authentication",
            status: auth.ok ? "pass" : "fail",
            detail: auth.ok ? "Models endpoint accepted the key." : auth.error,
          },
          {
            label: "Organization usage & cost",
            status: "info",
            detail: "Standard keys cannot read organization analytics.",
          },
        ],
        capabilities: {
          validation: permissionCapability(auth.ok ? "available" : "failed"),
          usage: permissionCapability(
            "unavailable",
            "Requires an Anthropic admin key.",
          ),
          cost: permissionCapability(
            "unavailable",
            "Requires an Anthropic admin key.",
          ),
          balance: permissionCapability(
            "unavailable",
            "Anthropic does not expose key balances.",
          ),
        },
        recommendation: auth.ok
          ? "This key can make API requests, but organization analytics require an sk-ant-admin key."
          : null,
        error: auth.ok ? null : auth.error,
      };
    }
    const at = Date.now();
    const startingAt = new Date(at - DAY_MS2).toISOString();
    const endingAt = new Date(at).toISOString();
    const headers = { "x-api-key": secret, "anthropic-version": API_VERSION };
    const [cost, usage] = await Promise.all([
      safeFetch(
        `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${encodeURIComponent(startingAt)}&ending_at=${encodeURIComponent(endingAt)}`,
        { headers },
      ),
      safeFetch(
        `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${encodeURIComponent(startingAt)}&ending_at=${encodeURIComponent(endingAt)}&bucket_width=1d`,
        { headers },
      ),
    ]);
    const authenticated = cost.status !== 401 && usage.status !== 401;
    return {
      ...base,
      ok: authenticated,
      keyKind: "Organization admin key",
      analyticsReady: cost.ok && usage.ok,
      checks: [
        {
          label: "Organization costs",
          status: cost.ok ? "pass" : "fail",
          detail: cost.ok ? "Cost reporting is available." : cost.error,
        },
        {
          label: "Organization token usage",
          status: usage.ok ? "pass" : "fail",
          detail: usage.ok ? "Usage reporting is available." : usage.error,
        },
      ],
      capabilities: {
        validation: permissionCapability(
          authenticated ? "available" : "failed",
        ),
        usage: permissionCapability(
          usage.ok ? "available" : "unavailable",
          usage.error,
        ),
        cost: permissionCapability(
          cost.ok ? "available" : "unavailable",
          cost.error,
        ),
        balance: permissionCapability(
          "unavailable",
          "Anthropic does not expose key balances.",
        ),
      },
      recommendation:
        cost.ok && usage.ok
          ? "All Anthropic analytics permissions are ready."
          : "The key is recognized as an admin key, but one or more organization permissions are missing.",
      error: authenticated ? null : (cost.error ?? usage.error),
    };
  }
  const probe = await adapter.fetchSnapshot(secret, {
    id: "probe",
    provider,
    nickname: "probe",
    maskedKey: "",
    createdAt: /* @__PURE__ */ new Date().toISOString(),
    isAdminKey: false,
  });
  const isOpenRouter = provider === "openrouter";
  return {
    ...base,
    ok: probe.ok,
    keyKind: isOpenRouter ? "OpenRouter key" : "Google AI Studio key",
    analyticsReady: isOpenRouter && probe.ok,
    checks: [
      {
        label: "API authentication",
        status: probe.ok ? "pass" : "fail",
        detail: probe.ok ? "The provider accepted the key." : probe.error,
      },
    ],
    capabilities: isOpenRouter
      ? {
          validation: permissionCapability(probe.ok ? "available" : "failed"),
          usage: permissionCapability(probe.ok ? "available" : "unavailable"),
          cost: permissionCapability(probe.ok ? "available" : "unavailable"),
          balance: permissionCapability(probe.ok ? "available" : "unavailable"),
        }
      : {
          validation: permissionCapability(probe.ok ? "available" : "failed"),
          usage: permissionCapability(
            "unavailable",
            "Google AI Studio has no per-key usage API.",
          ),
          cost: permissionCapability(
            "estimated",
            "Cost can only be estimated from locally recorded requests.",
          ),
          balance: permissionCapability(
            "unavailable",
            "Google AI Studio has no per-key balance API.",
          ),
        },
    recommendation: isOpenRouter
      ? "This key can populate balance, spend, and usage analytics."
      : "The key can be validated, but Google does not expose billing or usage totals for AI Studio keys.",
    error: probe.ok ? null : probe.error,
  };
}
var ApiService = class {
  get fake() {
    return process.env.CAM_FAKE_PROVIDERS === "1";
  }
  /** Poll one key and persist the result (+ optional history backfill on first run). */
  async refreshKey(id) {
    let record = getRecord(id);
    if (!record) return;
    if (this.fake) {
      if (getSeries(id).length === 0)
        seedHistory(id, fakeHistory(record, Date.now()));
      const hist = getSeries(id);
      const last = hist[hist.length - 1];
      appendSnapshot(id, {
        at: Date.now(),
        ok: true,
        currency: "USD",
        lifetimeCostUsd: last?.lifetimeCostUsd ?? 0,
        lifetimeTokens: last?.lifetimeTokens ?? null,
        lifetimeRequests: last?.lifetimeRequests ?? null,
        balanceUsd: last?.balanceUsd ?? null,
        creditLimitUsd: last?.creditLimitUsd ?? null,
        directCost:
          record.provider === "openrouter" || record.isAdminKey
            ? {
                today: 1.2,
                week: 7.1,
                month: 14.3,
                lifetime: last?.lifetimeCostUsd ?? 0,
              }
            : void 0,
        tier:
          record.provider === "gemini"
            ? "AI Studio key \u2014 no usage/billing API"
            : void 0,
      });
      return;
    }
    const secret = getSecret(id);
    if (!secret) {
      appendSnapshot(id, {
        at: Date.now(),
        ok: false,
        error: "Stored key could not be decrypted",
      });
      return;
    }
    const adapter = getAdapter(record.provider);
    const detectedKind = adapter.detectKeyKind(secret);
    if (
      detectedKind.valid &&
      Boolean(record.isAdminKey) !== Boolean(detectedKind.isAdminKey)
    ) {
      record = updateRecord(id, {
        isAdminKey: Boolean(detectedKind.isAdminKey),
      });
    }
    const hadHistory = getSeries(id).length > 0;
    if (!hadHistory && adapter.fetchHistory) {
      try {
        const history = await adapter.fetchHistory(secret, record);
        seedHistory(id, history);
      } catch {}
    }
    const snapshot = await adapter.fetchSnapshot(secret, record);
    appendSnapshot(id, snapshot);
  }
  async refreshAll(id) {
    const records = listRecords().filter((r) => !id || r.id === id);
    await Promise.allSettled(records.map((r) => this.refreshKey(r.id)));
  }
  /** Validate a candidate key without storing it. Never persists the secret. */
  async validate(provider, secret) {
    const adapter = getAdapter(provider);
    const kind = adapter.detectKeyKind(secret);
    if (!kind.valid) {
      return {
        ok: false,
        isAdminKey: kind.isAdminKey,
        error: "That doesn't look like a valid key for this provider.",
      };
    }
    if (this.fake)
      return {
        ok: true,
        isAdminKey: kind.isAdminKey,
        keyKind: kind.isAdminKey ? "Admin key" : "Standard key",
        analyticsReady: kind.isAdminKey || provider === "openrouter",
        checks: [
          { label: "API authentication", status: "pass", detail: "Test mode" },
        ],
        capabilities: {},
      };
    return probeProviderPermissions(provider, secret, adapter, kind);
  }
  buildKeyState(record, now) {
    const series = getSeries(record.id);
    const latest = series.length ? series[series.length - 1] : null;
    const meta = PROVIDER_META[record.provider];
    const usage = {
      cost: costWindows(series, latest, now),
      tokens: windowUsage(series, "tokens", now),
      requests: windowUsage(series, "requests", now),
    };
    const balanceUsd =
      latest?.ok && typeof latest.balanceUsd === "number"
        ? latest.balanceUsd
        : null;
    const creditLimitUsd =
      latest?.ok && typeof latest.creditLimitUsd === "number"
        ? latest.creditLimitUsd
        : null;
    const projection = projectSpend(series, balanceUsd, now);
    const status = computeStatus({
      record,
      latest,
      monthSpend: usage.cost.month,
      runwayDays: projection.runwayDays,
      balanceUsd,
    });
    return {
      record,
      meta,
      latest,
      status,
      usage,
      derivedFromSnapshots: !(latest?.ok && latest.directCost),
      balanceUsd,
      creditLimitUsd,
      currency: latest?.currency ?? "USD",
      lastUpdated: latest?.at ?? null,
      avgDailySpendUsd: projection.avgDailySpendUsd,
      projectedMonthlyUsd: projection.projectedMonthlyUsd,
      runwayDays: projection.runwayDays,
    };
  }
  buildKeyStates(now = Date.now()) {
    return listRecords().map((r) => this.buildKeyState(r, now));
  }
  buildChart(id, metric, range, now = Date.now()) {
    const series = getSeries(id);
    return {
      metric,
      range,
      buckets: dailyBuckets(series, metric, RANGE_DAYS[range], now),
      sparse: isSparse(series, metric),
    };
  }
  buildSummary(now = Date.now()) {
    const states = this.buildKeyStates(now);
    let totalBalance = 0;
    let hasBalance = false;
    let spendToday = 0;
    let spendWeek = 0;
    let spendMonth = 0;
    let avgDaily = 0;
    const perProvider = /* @__PURE__ */ new Map();
    for (const s of states) {
      if (s.balanceUsd !== null) {
        totalBalance += s.balanceUsd;
        hasBalance = true;
      }
      spendToday += s.usage.cost.today;
      spendWeek += s.usage.cost.week;
      spendMonth += s.usage.cost.month;
      avgDaily += s.avgDailySpendUsd ?? 0;
      perProvider.set(
        s.record.provider,
        (perProvider.get(s.record.provider) ?? 0) + s.usage.cost.month,
      );
    }
    const perProviderMonthSpend = PROVIDER_ORDER.filter((p) =>
      perProvider.has(p),
    ).map((provider) => ({
      provider,
      displayName: PROVIDER_META[provider].displayName,
      spend: perProvider.get(provider) ?? 0,
    }));
    const top = [...perProviderMonthSpend].sort((a, b) => b.spend - a.spend)[0];
    let shortestRunway = null;
    for (const s of states) {
      if (s.runwayDays !== null && Number.isFinite(s.runwayDays)) {
        if (!shortestRunway || s.runwayDays < shortestRunway.days) {
          shortestRunway = {
            keyId: s.record.id,
            nickname: s.record.nickname,
            days: s.runwayDays,
          };
        }
      }
    }
    const mostUsedModel = null;
    return {
      totalBalanceUsd: hasBalance ? totalBalance : null,
      spendToday,
      spendWeek,
      spendMonth,
      avgDailySpendUsd: avgDaily,
      projectedMonthlyUsd: avgDaily * 30,
      topProvider:
        top && top.spend > 0
          ? {
              provider: top.provider,
              displayName: top.displayName,
              spendMonth: top.spend,
            }
          : null,
      mostUsedModel,
      shortestRunway,
      perProviderMonthSpend,
    };
  }
  onRemoveKey(id) {
    dropSeries(id);
  }
};

// electron/lib/api/localLedger.ts
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
var import_node_os = __toESM(require("node:os"));
var DIR = import_node_path.default.join(
  process.env.APPDATA ??
    import_node_path.default.join(
      import_node_os.default.homedir(),
      "AppData",
      "Roaming",
    ),
  "LiftedPDFTools",
);
var PRICES = [
  ["haiku", 1, 5],
  ["sonnet", 3, 15],
  ["opus", 15, 75],
  ["fable", 15, 75],
];
function costOf(r) {
  const m = (r.model ?? "").toLowerCase();
  let pin = 3;
  let pout = 15;
  for (const [sub, i, o] of PRICES) {
    if (m.includes(sub)) {
      pin = i;
      pout = o;
      break;
    }
  }
  const usd =
    ((r.in || 0) / 1e6) * pin +
    ((r.cw || 0) / 1e6) * pin * 1.25 +
    ((r.cr || 0) / 1e6) * pin * 0.1 +
    ((r.out || 0) / 1e6) * pout;
  return usd * (r.batch ? 0.5 : 1);
}
function loadRows() {
  const rows = [];
  let files = [];
  try {
    files = import_node_fs.default
      .readdirSync(DIR)
      .filter((f) => /^api_usage.*\.jsonl$/.test(f))
      .map((f) => import_node_path.default.join(DIR, f));
  } catch {
    return rows;
  }
  for (const file of files) {
    let text = "";
    try {
      text = import_node_fs.default.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line);
        const dt = new Date(r.ts).getTime();
        if (Number.isNaN(dt)) continue;
        rows.push({ ...r, _dt: dt, _cost: costOf(r) });
      } catch {}
    }
  }
  rows.sort((a, b) => a._dt - b._dt);
  return rows;
}
var WINDOWS = [
  ["day", 1],
  ["week", 7],
  ["month", 30],
  ["lifetime", null],
];
function readLocalLedger() {
  const rows = loadRows();
  const now = Date.now();
  const empty = () => ({ day: 0, week: 0, month: 0, lifetime: 0 });
  const cost = empty();
  const calls = empty();
  const perApp = /* @__PURE__ */ new Map();
  for (const r of rows) {
    for (const [w, days] of WINDOWS) {
      if (days !== null && r._dt < now - days * 864e5) continue;
      cost[w] += r._cost;
      calls[w] += 1;
      let a = perApp.get(r.app || "unknown");
      if (!a) {
        a = empty();
        perApp.set(r.app || "unknown", a);
      }
      a[w] += r._cost;
    }
  }
  return {
    available: rows.length > 0,
    rows: rows.length,
    since: rows.length ? rows[0].ts.slice(0, 10) : "",
    ledgerDir: DIR,
    cost,
    calls,
    byApp: [...perApp.entries()]
      .map(([app5, windows]) => ({ app: app5, windows }))
      .sort((a, b) => b.windows.lifetime - a.windows.lifetime),
  };
}

// electron/lib/gptUsageService.ts
var GPT_USAGE_TIMEOUT_MS = 2e4;
function existingCodexCandidate(candidate, priority) {
  if (!candidate || !fs11.existsSync(candidate)) return null;
  try {
    if (!fs11.statSync(candidate).isFile()) return null;
    return {
      candidate,
      priority,
      modifiedAt: fs11.statSync(candidate).mtimeMs,
    };
  } catch {
    return null;
  }
}
function childDirectoryCandidates(root, relativeExecutable, priority) {
  if (!root || !fs11.existsSync(root)) return [];
  try {
    return fs11
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) =>
        existingCodexCandidate(
          path11.join(root, entry.name, ...relativeExecutable),
          priority,
        ),
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}
function codexExecutable() {
  if (process.env.CODEX_CLI_PATH) return process.env.CODEX_CLI_PATH;
  const candidates = [];
  const add = (candidate, priority) => {
    const result = existingCodexCandidate(candidate, priority);
    if (result) candidates.push(result);
  };
  if (process.env.LOCALAPPDATA) {
    const localAppData = process.env.LOCALAPPDATA;
    candidates.push(
      ...childDirectoryCandidates(
        path11.join(localAppData, "OpenAI", "Codex", "bin"),
        ["codex.exe"],
        100,
      ),
    );
    add(path11.join(localAppData, "Microsoft", "WindowsApps", "codex.exe"), 90);
  }
  if (process.env.APPDATA) {
    const npmRoot = path11.join(
      process.env.APPDATA,
      "npm",
      "node_modules",
      "@openai",
      "codex",
    );
    add(
      path11.join(
        npmRoot,
        "node_modules",
        "@openai",
        "codex-win32-x64",
        "vendor",
        "x86_64-pc-windows-msvc",
        "codex",
        "codex.exe",
      ),
      80,
    );
    add(
      path11.join(
        npmRoot,
        "vendor",
        "x86_64-pc-windows-msvc",
        "codex",
        "codex.exe",
      ),
      80,
    );
  }
  if (process.env.USERPROFILE) {
    for (const editorFolder of [".vscode", ".vscode-insiders"]) {
      const extensionsRoot = path11.join(
        process.env.USERPROFILE,
        editorFolder,
        "extensions",
      );
      let extensions = [];
      try {
        extensions = fs11
          .readdirSync(extensionsRoot, { withFileTypes: true })
          .filter(
            (entry) =>
              entry.isDirectory() && entry.name.startsWith("openai.chatgpt-"),
          );
      } catch {}
      for (const extension of extensions) {
        add(
          path11.join(
            extensionsRoot,
            extension.name,
            "bin",
            "windows-x86_64",
            "codex.exe",
          ),
          70,
        );
        add(
          path11.join(
            extensionsRoot,
            extension.name,
            "bin",
            "windows-arm64",
            "codex.exe",
          ),
          70,
        );
      }
    }
  }
  candidates.sort(
    (a, b) => b.priority - a.priority || b.modifiedAt - a.modifiedAt,
  );
  return candidates[0]?.candidate ?? "codex.exe";
}
function readGptUsage() {
  return new Promise((resolve5) => {
    let child;
    let settled = false;
    let stdoutBuffer = "";
    const results = {};
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child?.kill();
      } catch {}
      resolve5({ ...value, fetchedAt: Date.now() });
    };
    const send = (message) => {
      try {
        child.stdin.write(`${JSON.stringify(message)}\n`);
      } catch (err) {
        finish({
          ok: false,
          error: `Could not query Codex usage: ${err.message}`,
        });
      }
    };
    const timer = setTimeout(
      () =>
        finish({
          ok: false,
          error:
            "Codex usage did not respond in time. Make sure Codex is installed and signed in.",
        }),
      GPT_USAGE_TIMEOUT_MS,
    );
    try {
      child = (0, import_node_child_process4.spawn)(
        codexExecutable(),
        ["app-server"],
        {
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
    } catch (err) {
      finish({
        ok: false,
        error: `Could not start Codex: ${err.message}`,
      });
      return;
    }
    child.on("error", (err) =>
      finish({
        ok: false,
        error:
          err.code === "ENOENT"
            ? "Codex is not installed or is not available on PATH."
            : `Could not start Codex: ${err.message}`,
      }),
    );
    child.on("exit", (code) => {
      if (!settled)
        finish({
          ok: false,
          error: `Codex usage service exited before replying (code ${code ?? "unknown"}).`,
        });
    });
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          continue;
        }
        if (message.id === 1) {
          if (message.error) {
            finish({
              ok: false,
              error: message.error.message ?? "Codex initialization failed.",
            });
            continue;
          }
          send({ method: "initialized", params: {} });
          send({
            method: "account/read",
            id: 2,
            params: { refreshToken: false },
          });
          send({ method: "account/rateLimits/read", id: 3 });
          send({ method: "account/usage/read", id: 4 });
          continue;
        }
        if (message.id === 2 || message.id === 3 || message.id === 4) {
          results[message.id] = message.error
            ? { error: message.error.message ?? "Request failed." }
            : message.result;
          if (results[2] && results[3] && results[4]) {
            const account = results[2]?.account ?? null;
            const rateLimitsError = results[3]?.error;
            const usageError = results[4]?.error;
            if (!account) {
              finish({
                ok: false,
                error: "Codex is not signed in with a ChatGPT account.",
              });
            } else if (rateLimitsError && usageError) {
              finish({
                ok: false,
                account,
                error: rateLimitsError,
              });
            } else {
              finish({
                ok: true,
                account,
                rateLimits: rateLimitsError ? null : results[3],
                usage: usageError ? null : results[4],
                warning: rateLimitsError ?? usageError ?? null,
              });
            }
          }
        }
      }
    });
    send({
      method: "initialize",
      id: 1,
      params: {
        clientInfo: {
          name: "claude_account_manager",
          title: "AI Account Manager",
          version: import_electron4.app.getVersion(),
        },
      },
    });
  });
}

// electron/lib/skillsSync.ts
var import_node_child_process3 = require("node:child_process");
var fs10 = __toESM(require("node:fs"));
var path10 = __toESM(require("node:path"));
var import_electron3 = require("electron");
var ENGINE_EXE = "AIEnvironmentManager.exe";
var ENGINE_TIMEOUT_MS = 12e4;
function candidatePaths() {
  const desktop = import_electron3.app.getPath("desktop");
  return [
    path10.join(desktop, "AI Environment Manager", ENGINE_EXE),
    path10.join(
      import_electron3.app.getPath("home"),
      "Desktop",
      "AI Environment Manager",
      ENGINE_EXE,
    ),
    path10.join(
      process.env.LOCALAPPDATA ?? "",
      "Programs",
      "AI Environment Manager",
      ENGINE_EXE,
    ),
    path10.join(
      import_electron3.app.getPath("home"),
      "AI-Environment-Manager",
      "dist",
      "app",
      ENGINE_EXE,
    ),
  ];
}
function findEngine() {
  for (const candidate of candidatePaths()) {
    try {
      if (candidate && fs10.existsSync(candidate)) return candidate;
    } catch {}
  }
  return null;
}
function runEngine(exe, args) {
  return new Promise((resolve5, reject) => {
    (0, import_node_child_process3.execFile)(
      exe,
      args,
      {
        timeout: ENGINE_TIMEOUT_MS,
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
      },
      (err, stdout) => {
        const code = err?.code;
        if (err && typeof code !== "number") {
          reject(err);
          return;
        }
        resolve5({
          stdout: stdout ?? "",
          code: typeof code === "number" ? code : 0,
        });
      },
    );
  });
}
function parseJson(stdout) {
  const start = stdout.indexOf("{");
  if (start < 0) throw new Error("Engine returned no JSON output.");
  return JSON.parse(stdout.slice(start));
}
async function skillsOverview() {
  const exe = findEngine();
  if (!exe) {
    return {
      engineFound: false,
      skills: [],
      profiles: [],
      matrix: [],
      error:
        "AIEnvironmentManager.exe was not found. Install AI Environment Manager (Desktop folder or installer) to enable Skills Sync.",
    };
  }
  try {
    const version = await runEngine(exe, ["--version"]);
    const status = await runEngine(exe, ["--skills-status", "--json"]);
    const parsed = parseJson(status.stdout);
    return {
      engineFound: true,
      enginePath: exe,
      engineVersion:
        version.stdout.trim().replace(/^AI Environment Manager\s*/i, "") ||
        void 0,
      libraryPath: parsed.libraryPath ?? void 0,
      skills: parsed.skills ?? [],
      profiles: parsed.profiles ?? [],
      matrix: parsed.matrix ?? [],
    };
  } catch (err) {
    return {
      engineFound: true,
      enginePath: exe,
      skills: [],
      profiles: [],
      matrix: [],
      error: `Engine call failed: ${err.message}`,
    };
  }
}
async function installSkills(opts) {
  const exe = findEngine();
  if (!exe) {
    return {
      ok: false,
      error: "AIEnvironmentManager.exe not found.",
      results: [],
    };
  }
  const args = ["--install-skills", "--json"];
  if (opts.profiles?.length) args.push("--profiles", opts.profiles.join(","));
  if (opts.skills?.length) args.push("--skills", opts.skills.join(","));
  if (opts.dryRun) args.push("--dry-run");
  if (opts.force) args.push("--force");
  try {
    const run = await runEngine(exe, args);
    const parsed = parseJson(run.stdout);
    const results = parsed.results ?? [];
    return { ok: results.every((r) => r.success), results };
  } catch (err) {
    return { ok: false, error: err.message, results: [] };
  }
}
async function runAudit() {
  const exe = findEngine();
  if (!exe) return { ok: false, output: "AIEnvironmentManager.exe not found." };
  try {
    const run = await runEngine(exe, ["--audit"]);
    return { ok: run.code === 0, output: run.stdout.trim() };
  } catch (err) {
    return { ok: false, output: err.message };
  }
}
function openApp() {
  const exe = findEngine();
  if (!exe) return { ok: false, error: "AIEnvironmentManager.exe not found." };
  const child = (0, import_node_child_process3.spawn)(exe, [], {
    detached: true,
    stdio: "ignore",
    cwd: path10.dirname(exe),
  });
  child.unref();
  return { ok: true };
}

// electron/lib/ipc.ts
var POLL_INTERVAL_MS = 10 * 60 * 1e3;
var API_POLL_INTERVAL_MS = 10 * 60 * 1e3;
var FOCUS_REFRESH_MIN_GAP_MS = 5 * 60 * 1e3;
var DEFAULT_ALERT_SETTINGS = {
  enabled: true,
  thresholds: [70, 85, 100],
  resetReminders: true,
  resetReminderMinutes: 30,
  credentialExpiry: true,
  credentialExpiryHours: 24,
};
var DEFAULT_UPDATE_SETTINGS = {
  autoCheck: true,
  manifestUrl: "",
};
function loadSettings() {
  const saved = readJson(settingsFile()) ?? {};
  const migrated = migrateSettingsContainer(saved);
  const normalized = {
    ...migrated,
    theme: saved.theme ?? "system",
    alerts: { ...DEFAULT_ALERT_SETTINGS, ...(saved.alerts ?? {}) },
    alertState: saved.alertState ?? {},
    updates: { ...DEFAULT_UPDATE_SETTINGS, ...(saved.updates ?? {}) },
    automation: migrated.automation,
    hiddenProfileIds: normalizeHiddenProfileIds(saved.hiddenProfileIds),
    otherAccountsLayout: normalizeOtherAccountsLayout(
      saved.otherAccountsLayout,
    ),
  };
  if (JSON.stringify(saved) !== JSON.stringify(normalized)) {
    writeJsonAtomic(settingsFile(), normalized);
  }
  return normalized;
}
function saveSettings(patch) {
  writeJsonAtomic(settingsFile(), { ...loadSettings(), ...patch });
}
function sanitizeAlertSettings(input) {
  const thresholds = [...new Set((input?.thresholds ?? []).map(Number))]
    .filter((n) => Number.isFinite(n) && n > 0 && n <= 100)
    .sort((a, b) => a - b);
  return {
    enabled: input?.enabled !== false,
    thresholds: thresholds.length ? thresholds : [70, 85, 100],
    resetReminders: input?.resetReminders !== false,
    resetReminderMinutes: Math.max(
      5,
      Math.min(1440, Number(input?.resetReminderMinutes) || 30),
    ),
    credentialExpiry: input?.credentialExpiry !== false,
    credentialExpiryHours: Math.max(
      1,
      Math.min(168, Number(input?.credentialExpiryHours) || 24),
    ),
  };
}
function semverParts(version) {
  return String(version ?? "0")
    .replace(/^v/i, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0)
    .slice(0, 3);
}
function isNewerVersion(candidate, current) {
  const a = semverParts(candidate);
  const b = semverParts(current);
  for (let index = 0; index < 3; index++) {
    if ((a[index] ?? 0) > (b[index] ?? 0)) return true;
    if ((a[index] ?? 0) < (b[index] ?? 0)) return false;
  }
  return false;
}
function automationHelperExecutable() {
  return import_electron4.app.isPackaged
    ? path11.join(
        process.resourcesPath,
        "automation",
        "AIAccountManager.Automation.exe",
      )
    : path11.resolve(
        __dirname,
        "..",
        "..",
        "automation",
        "artifacts",
        "win-x64",
        "AIAccountManager.Automation.exe",
      );
}
function summarizeAutomationActivity(record) {
  if (!record || typeof record !== "object") return null;
  return {
    timestamp: Number(record.timestamp) || Date.now(),
    provider: redactText(record.provider, 40) || "unknown",
    surface: redactText(record.surface, 40) || "unknown",
    requestedAction: redactText(record.requestedAction, 40) || "none",
    method: redactText(record.method, 60) || "unknown",
    result: redactText(record.result, 40) || "unknown",
    dryRun: record.dryRun === true,
    errorCode: redactText(record.errorCode, 80),
  };
}
function isSuccessfulSafeAction(record) {
  return (
    record?.result === "success" &&
    record?.dryRun !== true &&
    ["approve", "apply-native-mode", "launch"].includes(record?.requestedAction)
  );
}
var Backend = class {
  constructor(getWindow) {
    this.getWindow = getWindow;
    this.automationHost = new AutomationHostClient(
      automationHelperExecutable(),
    );
    this.sessions = new SessionLauncher(appDataDir());
    this.automationStatus = {
      state: "Off",
      running: false,
      dryRun: true,
      pausedUntil: null,
    };
    this.automationHost.on("status", (status) => {
      this.automationStatus = { ...this.automationStatus, ...status };
      void this.pushAutomationState();
    });
    this.automationHost.on("activity", (record) => {
      this.updateAutomationActivitySummary([record], false);
      this.getWindow()?.webContents.send("automation:activity-changed");
      void this.pushAutomationState();
    });
  }
  usage = new UsageService();
  api = new ApiService();
  defaultDir = null;
  lastFocusRefresh = 0;
  usageRetryTimers = new Map();
  gptUsage = null;
  updateState = { checking: false, checkedAt: null, update: null, error: null };
  guideWin = null;
  registeredEmergencyHotkey = null;
  automationAttention = null;
  recentAutomationActivity = [];
  lastSafeAction = null;
  async init() {
    this.defaultDir = await getDefaultConfigDir().catch(() => null);
    for (const profile of listProfiles()) {
      if (profile.dashboardRole === "personal") continue;
      try {
        linkSharedState(profile.configDir);
      } catch (err) {
        logSharedStateFailure(profile.configDir, "profile", profile.id, err);
      }
    }
    this.registerHandlers();
    this.registerApiKeyHandlers();
    this.registerSkillsHandlers();
    this.registerAutomationHandlers();
    await this.applyAutomationSettings(loadSettings().automation, false);
    setInterval(() => void this.refreshAll(), POLL_INTERVAL_MS);
    setInterval(() => void this.refreshApiKeys(), API_POLL_INTERVAL_MS);
    setInterval(() => void this.refreshGptUsage(), POLL_INTERVAL_MS);
    import_electron4.app.on("browser-window-focus", () => {
      if (Date.now() - this.lastFocusRefresh > FOCUS_REFRESH_MIN_GAP_MS) {
        this.lastFocusRefresh = Date.now();
        void this.refreshAll();
        void this.refreshApiKeys();
        void this.refreshGptUsage();
      }
    });
    setTimeout(() => void this.refreshAll(), 800);
    setTimeout(() => void this.refreshGptUsage(), 1e3);
    setTimeout(() => void this.refreshApiKeys(), 1200);
    if (loadSettings().updates.autoCheck)
      setTimeout(() => void this.checkForUpdates(), 1800);
    if (process.env.CAM_OPEN_GUIDE)
      setTimeout(() => this.openGuideWindow(), 600);
  }
  async applyAutomationSettings(settings, push = true) {
    this.automationAttention = null;
    import_electron4.app.setLoginItemSettings({
      openAtLogin: settings.startWithWindows === true,
      args: ["--background"],
    });
    if (this.registeredEmergencyHotkey) {
      import_electron4.globalShortcut.unregister(
        this.registeredEmergencyHotkey,
      );
      this.registeredEmergencyHotkey = null;
    }
    if (settings.automationEnabled) {
      let hotkeyError = null;
      const accelerator = String(settings.emergencyHotkey).replace(
        /^Ctrl\+/i,
        "CommandOrControl+",
      );
      if (
        import_electron4.globalShortcut.register(accelerator, () => {
          void this.emergencyPause();
        })
      ) {
        this.registeredEmergencyHotkey = accelerator;
      } else {
        hotkeyError = `Emergency hotkey ${settings.emergencyHotkey} is already in use.`;
        this.automationAttention = hotkeyError;
      }
      try {
        this.automationStatus = await this.automationHost.configure(settings);
        if (hotkeyError) {
          this.automationStatus = {
            ...this.automationStatus,
            state: "Needs attention",
            lastError: hotkeyError,
          };
        }
      } catch (err) {
        this.automationStatus = {
          ...this.automationStatus,
          state: "Error",
          lastError: err.message,
        };
      }
    } else if (this.automationHost.socket) {
      try {
        this.automationStatus = await this.automationHost.configure(settings);
      } catch {}
    } else {
      this.automationStatus = {
        state: "Off",
        running: false,
        dryRun: settings.dryRun,
        pausedUntil: settings.pausedUntil,
      };
    }
    syncTray();
    if (push) await this.pushAutomationState();
  }
  async emergencyPause() {
    const current = loadSettings().automation;
    const next = sanitizeAutomationSettings({
      ...current,
      pausedUntil: Date.now() + 365 * 24 * 60 * 60 * 1e3,
    });
    saveSettings({ automation: next });
    try {
      this.automationStatus = await this.automationHost.configure(next);
    } catch {}
    this.showNotification(
      "Unattended permissions paused",
      "The emergency hotkey stopped all automated invocation. Resume explicitly in Automation & Sessions.",
    );
    await this.pushAutomationState();
  }
  async updateAutomationSettings(patch) {
    const current = loadSettings().automation;
    const merged = {
      ...current,
      ...(patch ?? {}),
      providers: {
        ...current.providers,
        ...(patch?.providers ?? {}),
      },
    };
    const next = sanitizeAutomationSettings(merged);
    saveSettings({ automation: next });
    await this.applyAutomationSettings(next);
    return next;
  }
  async buildAutomationState() {
    const settings = loadSettings().automation;
    const discovery = await this.sessions.discover();
    if (this.automationHost.socket) {
      try {
        this.automationStatus = await this.automationHost.request("status");
        const records = await this.automationHost.request("activity:list", {
          limit: 25,
        });
        this.updateAutomationActivitySummary(records);
      } catch {}
    }
    if (this.automationAttention) {
      this.automationStatus = {
        ...this.automationStatus,
        state: "Needs attention",
        lastError: this.automationAttention,
      };
    }
    return {
      settings,
      status: this.automationStatus,
      profiles: this.sessions.list(),
      discovery,
      capabilities: capabilityMatrix(discovery),
      recentActivity: this.recentAutomationActivity,
      lastSafeAction: this.lastSafeAction,
    };
  }
  updateAutomationActivitySummary(records, replace = true) {
    const safeRecords = Array.isArray(records) ? records : [];
    const summaries = safeRecords
      .slice(0, 5)
      .map(summarizeAutomationActivity)
      .filter(Boolean);
    this.recentAutomationActivity = replace
      ? summaries
      : [...summaries, ...this.recentAutomationActivity].slice(0, 5);
    const successful = safeRecords.find(isSuccessfulSafeAction);
    if (successful)
      this.lastSafeAction = summarizeAutomationActivity(successful);
    else if (replace) this.lastSafeAction = null;
  }
  async pushAutomationState() {
    const window = this.getWindow();
    if (!window || window.isDestroyed()) return;
    window.webContents.send(
      "automation:changed",
      await this.buildAutomationState(),
    );
  }
  recordSessionActivity(profile, result, errorCode = "") {
    const record = appendAudit(appDataDir(), {
      timestamp: Date.now(),
      durationMs: 0,
      provider: profile.provider,
      surface: profile.surface,
      process: "session-launcher",
      window: "",
      label: profile.name,
      requestedAction: "launch",
      method: profile.surface,
      result,
      dryRun: false,
      confidenceSignals: [],
      retryCount: 0,
      errorCode,
    });
    this.updateAutomationActivitySummary([record], false);
    this.getWindow()?.webContents.send("automation:activity-changed", record);
    void this.pushAutomationState();
  }
  // ---- Usage tracking guide (in-app PDF viewer) ----------------------
  guidePdfPath() {
    return import_electron4.app.isPackaged
      ? path11.join(process.resourcesPath, "USAGE_TRACKING_GUIDE.pdf")
      : path11.join(__dirname, "..", "docs", "USAGE_TRACKING_GUIDE.pdf");
  }
  openGuideWindow() {
    if (this.guideWin && !this.guideWin.isDestroyed()) {
      this.guideWin.focus();
      return;
    }
    const w = new import_electron4.BrowserWindow({
      width: 980,
      height: 920,
      minWidth: 660,
      minHeight: 480,
      autoHideMenuBar: true,
      backgroundColor: "#0d0f12",
      title: "API Usage Tracking Guide",
      webPreferences: {
        preload: path11.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        plugins: true,
        // Chromium's built-in PDF viewer needs the plugin
      },
    });
    w.on("closed", () => (this.guideWin = null));
    this.guideWin = w;
    void w.loadFile(path11.join(__dirname, "guide-viewer.html"), {
      query: {
        pdf: (0, import_node_url.pathToFileURL)(this.guidePdfPath()).href,
      },
    });
  }
  pushApiKeys() {
    this.getWindow()?.webContents.send(
      "apikeys:changed",
      this.api.buildKeyStates(),
    );
  }
  async refreshApiKeys(id) {
    await this.api.refreshAll(id);
    this.pushApiKeys();
  }
  pushGptUsage() {
    this.getWindow()?.webContents.send("gpt:usage-changed", this.gptUsage);
  }
  async refreshGptUsage() {
    this.gptUsage = await readGptUsage();
    this.evaluateGptAlerts(this.gptUsage);
    this.pushGptUsage();
    return this.gptUsage;
  }
  showNotification(title, body) {
    try {
      if (!import_electron4.Notification.isSupported()) return;
      new import_electron4.Notification({ title, body, silent: false }).show();
    } catch {}
  }
  recordAlert(key, title, body) {
    const settings = loadSettings();
    const state = settings.alertState ?? {};
    if (state[key]) return false;
    state[key] = Date.now();
    const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1e3;
    for (const [savedKey, at] of Object.entries(state)) {
      if (!Number.isFinite(at) || at < cutoff) delete state[savedKey];
    }
    saveSettings({ alertState: state });
    this.showNotification(title, body);
    return true;
  }
  evaluateLimitAlerts(source, owner, limits) {
    const alerts = loadSettings().alerts;
    if (!alerts.enabled) return;
    const now = Date.now();
    for (const limit of limits) {
      const percent = Number(limit.percent);
      const resetMs = limit.resetsAt
        ? typeof limit.resetsAt === "number"
          ? limit.resetsAt * 1e3
          : Date.parse(limit.resetsAt)
        : NaN;
      const threshold = alerts.thresholds
        .filter((value) => percent >= value)
        .sort((a, b) => b - a)[0];
      const cycle = Number.isFinite(resetMs)
        ? Math.floor(resetMs / 6e4)
        : "open";
      if (threshold) {
        this.recordAlert(
          `${source}:${owner}:${limit.id}:${cycle}:threshold:${threshold}`,
          `${owner} usage is ${Math.round(percent)}%`,
          `${limit.label} has reached the ${threshold}% alert threshold.`,
        );
      }
      if (
        alerts.resetReminders &&
        Number.isFinite(resetMs) &&
        resetMs > now &&
        resetMs - now <= alerts.resetReminderMinutes * 60 * 1e3
      ) {
        this.recordAlert(
          `${source}:${owner}:${limit.id}:${cycle}:reset`,
          `${owner} usage resets soon`,
          `${limit.label} resets in about ${Math.max(1, Math.round((resetMs - now) / 6e4))} minutes.`,
        );
      }
    }
  }
  evaluateGptAlerts(usage) {
    if (!usage?.ok) return;
    const byId = usage.rateLimits?.rateLimitsByLimitId;
    const buckets = byId
      ? Object.values(byId)
      : usage.rateLimits?.rateLimits
        ? [usage.rateLimits.rateLimits]
        : [];
    const limits = [];
    for (const bucket of buckets) {
      for (const [name, value] of [
        ["primary", bucket?.primary],
        ["secondary", bucket?.secondary],
      ]) {
        if (!value || !Number.isFinite(value.usedPercent)) continue;
        limits.push({
          id: `${bucket.limitId ?? "codex"}:${name}`,
          label: `${bucket.limitName || bucket.limitId || "Codex"} ${value.windowDurationMins ? `(${value.windowDurationMins} min window)` : "usage"}`,
          percent: value.usedPercent,
          resetsAt: value.resetsAt,
        });
      }
    }
    this.evaluateLimitAlerts("gpt", "GPT / Codex", limits);
  }
  evaluateClaudeAlerts(states) {
    const alerts = loadSettings().alerts;
    for (const state of states) {
      const limits = (state.usage?.limits ?? []).map((limit, index) => ({
        id: `${limit.kind ?? "usage"}:${limit.modelName ?? index}`,
        label: limit.modelName
          ? `${limit.modelName} ${limit.kind?.replace(/_/g, " ") ?? "usage"}`
          : (limit.kind?.replace(/_/g, " ") ?? "Claude usage"),
        percent: limit.percent,
        resetsAt: limit.resetsAt,
      }));
      this.evaluateLimitAlerts("claude", state.profile.name, limits);
      const expiresAt = state.identity?.tokenExpiresAt;
      if (
        alerts.enabled &&
        alerts.credentialExpiry &&
        Number.isFinite(expiresAt) &&
        expiresAt - Date.now() <= alerts.credentialExpiryHours * 60 * 60 * 1e3
      ) {
        const expiryCycle = Math.floor(expiresAt / 36e5);
        this.recordAlert(
          `claude:${state.profile.id}:credential:${expiryCycle}`,
          `${state.profile.name} needs attention`,
          expiresAt <= Date.now()
            ? "The Claude sign-in has expired. Sign in again from the account card."
            : `The Claude sign-in expires within ${alerts.credentialExpiryHours} hours.`,
        );
      }
    }
  }
  async checkForUpdates() {
    const currentVersion = import_electron4.app.getVersion();
    const manifestUrl = loadSettings().updates.manifestUrl?.trim();
    if (!manifestUrl) {
      this.updateState = {
        checking: false,
        checkedAt: Date.now(),
        configured: false,
        currentVersion,
        update: null,
        error: null,
      };
      return this.updateState;
    }
    if (!manifestUrl.startsWith("https://")) {
      this.updateState = {
        checking: false,
        checkedAt: Date.now(),
        configured: true,
        currentVersion,
        update: null,
        error: "Update manifests must use HTTPS.",
      };
      return this.updateState;
    }
    this.updateState = { ...this.updateState, checking: true, error: null };
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok)
        throw new Error(`Update server returned ${response.status}.`);
      const manifest = await response.json();
      if (
        !manifest?.version ||
        !manifest?.downloadUrl ||
        !String(manifest.downloadUrl).startsWith("https://") ||
        !/^[a-f0-9]{64}$/i.test(manifest.sha256 ?? "")
      ) {
        throw new Error(
          "Update manifest is missing a version, HTTPS download URL, or SHA-256 checksum.",
        );
      }
      this.updateState = {
        checking: false,
        checkedAt: Date.now(),
        configured: true,
        currentVersion,
        update: isNewerVersion(manifest.version, currentVersion)
          ? {
              version: manifest.version,
              downloadUrl: manifest.downloadUrl,
              sha256: manifest.sha256,
              notes: manifest.notes ?? "",
              publishedAt: manifest.publishedAt ?? null,
            }
          : null,
        error: null,
      };
    } catch (err) {
      this.updateState = {
        checking: false,
        checkedAt: Date.now(),
        configured: true,
        currentVersion,
        update: null,
        error: err.message,
      };
    }
    return this.updateState;
  }
  // ---- Automation & Sessions ---------------------------------------
  registerAutomationHandlers() {
    import_electron4.ipcMain.handle("automation:getState", () =>
      this.buildAutomationState(),
    );
    import_electron4.ipcMain.handle(
      "automation:setSettings",
      async (_event, patch) => {
        try {
          const settings = await this.updateAutomationSettings(patch ?? {});
          return { ok: true, settings };
        } catch (err) {
          return { ok: false, error: err.message };
        }
      },
    );
    import_electron4.ipcMain.handle(
      "automation:pause",
      async (_event, minutes) => {
        const duration = [5, 15, 60].includes(Number(minutes))
          ? Number(minutes)
          : 5;
        const settings = await this.updateAutomationSettings({
          pausedUntil: Date.now() + duration * 60 * 1e3,
        });
        return { ok: true, settings };
      },
    );
    import_electron4.ipcMain.handle("automation:resume", async () => {
      const settings = await this.updateAutomationSettings({
        pausedUntil: null,
      });
      return { ok: true, settings };
    });
    import_electron4.ipcMain.handle("automation:diagnostics", async () => {
      try {
        await this.automationHost.ensureStarted();
        return {
          ok: true,
          report: await this.automationHost.request(
            "diagnostics",
            {},
            { timeout: 45e3 },
          ),
        };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("automation:inspect", async () => {
      const window = this.getWindow();
      try {
        await this.automationHost.ensureStarted();
        window?.hide();
        const report = await this.automationHost.request(
          "inspect",
          { delayMs: 3e3 },
          { timeout: 45e3 },
        );
        return { ok: true, report };
      } catch (err) {
        return { ok: false, error: err.message };
      } finally {
        if (window && !window.isDestroyed()) {
          window.show();
          window.focus();
        }
      }
    });
    import_electron4.ipcMain.handle(
      "automation:applyNativeMode",
      async (_event, mode) => {
        try {
          if (!["manual", "auto", "skip"].includes(mode)) {
            throw new Error("Unsupported native mode.");
          }
          if (mode !== "manual") {
            throw new Error(
              "Native Auto and Skip are unavailable until the live Claude menu and an expiring trusted-session policy are validated. Manual restore remains available.",
            );
          }
          await this.automationHost.ensureStarted();
          return await this.automationHost.request("native-mode", { mode });
        } catch (err) {
          return { ok: false, error: err.message };
        }
      },
    );
    import_electron4.ipcMain.handle("automation:activity", async () => {
      try {
        await this.automationHost.ensureStarted();
        return {
          ok: true,
          records: await this.automationHost.request("activity:list", {
            limit: 1e3,
          }),
        };
      } catch (err) {
        return { ok: false, error: err.message, records: [] };
      }
    });
    import_electron4.ipcMain.handle("automation:clearActivity", async () => {
      try {
        await this.automationHost.ensureStarted();
        await this.automationHost.request("activity:clear");
        this.recentAutomationActivity = [];
        this.lastSafeAction = null;
        this.getWindow()?.webContents.send("automation:activity-changed");
        await this.pushAutomationState();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("automation:exportActivity", async () => {
      const window = this.getWindow();
      if (!window) return { ok: false, error: "No window" };
      try {
        await this.automationHost.ensureStarted();
        const records = await this.automationHost.request("activity:list", {
          limit: 5e3,
        });
        const { canceled, filePath } =
          await import_electron4.dialog.showSaveDialog(window, {
            title: "Export redacted automation activity",
            defaultPath: "automation-activity-redacted.json",
            filters: [{ name: "JSON", extensions: ["json"] }],
          });
        if (canceled || !filePath) return { ok: false };
        writeJsonAtomic(filePath, records);
        return { ok: true, path: filePath };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle(
      "automation:exportDiagnostics",
      async (_event, reviewedReport) => {
        const window = this.getWindow();
        if (!window) return { ok: false, error: "No window" };
        try {
          const report = sanitizeReviewedDiagnosticReport(reviewedReport);
          const { canceled, filePath } =
            await import_electron4.dialog.showSaveDialog(window, {
              title: "Export reviewed redacted diagnostics",
              defaultPath: "automation-diagnostics-redacted.json",
              filters: [{ name: "JSON", extensions: ["json"] }],
            });
          if (canceled || !filePath) return { ok: false };
          writeJsonAtomic(filePath, report);
          return { ok: true, path: filePath };
        } catch (err) {
          return { ok: false, error: err.message };
        }
      },
    );
    import_electron4.ipcMain.handle("sessions:discover", () =>
      this.sessions.discover(),
    );
    import_electron4.ipcMain.handle("sessions:list", () =>
      this.sessions.list(),
    );
    import_electron4.ipcMain.handle("sessions:save", async (_event, input) => {
      try {
        const profile = this.sessions.save(input ?? {});
        await this.pushAutomationState();
        return { ok: true, profile };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("sessions:remove", async (_event, id) => {
      try {
        const result = this.sessions.remove(id);
        await this.pushAutomationState();
        return result;
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle(
      "sessions:cleanupData",
      async (_event, id) => {
        try {
          const result = this.sessions.cleanupProfileData(id);
          await this.pushAutomationState();
          return result;
        } catch (err) {
          return { ok: false, error: err.message };
        }
      },
    );
    import_electron4.ipcMain.handle(
      "sessions:quickLaunch",
      async (_event, provider) => {
        try {
          if (!["claude", "chatgpt"].includes(provider)) {
            throw new Error("Unsupported provider.");
          }
          const result = await this.sessions.quickLaunch(provider);
          this.recordSessionActivity(
            {
              provider,
              surface: `${provider}-desktop`,
              name: provider === "claude" ? "New Claude" : "New GPT",
            },
            result.ok ? "success" : "failed",
            result.ok ? "" : "native-launch-unavailable",
          );
          return result;
        } catch (err) {
          return { ok: false, error: err.message };
        }
      },
    );
    import_electron4.ipcMain.handle("sessions:launch", async (_event, id) => {
      let profile;
      try {
        profile = this.sessions.list().find((item) => item.id === id);
        if (!profile) throw new Error("Session profile not found.");
        if (
          ["claude-code", "codex"].includes(profile.surface) &&
          profile.unattendedMode !== "manual"
        ) {
          throw new Error(
            "This saved Auto/Skip intent cannot launch until an expiring trusted-session policy is available. Edit the profile to Manual.",
          );
        }
        let result;
        if (["claude-web", "chatgpt-web"].includes(profile.surface)) {
          result = await this.sessions.launchBrowserProfile(id);
        } else if (
          ["claude-desktop", "chatgpt-desktop"].includes(profile.surface)
        ) {
          result = await this.sessions.quickLaunch(profile.provider);
        } else {
          const command = this.sessions.cliCommand(id);
          if (profile.surface === "claude-code") {
            const linked = profile.linkedClaudeProfileId
              ? getProfile(profile.linkedClaudeProfileId)
              : null;
            if (profile.linkedClaudeProfileId && !linked) {
              throw new Error("The linked Claude account no longer exists.");
            }
            const account = linked ?? {
              id: "machine-default",
              name: profile.name,
              configDir: path11.join(os4.homedir(), ".claude"),
            };
            const safeArgs = command.args
              .map((argument) => psSingleQuote2(String(argument)))
              .join(" ");
            openTerminal(account, `claude ${safeArgs}`);
          } else {
            openSafeCliTerminal(command.executable, command.args, profile.name);
          }
          result = { ok: true, message: `Launched ${profile.name}.` };
        }
        this.recordSessionActivity(profile, "success");
        await this.pushAutomationState();
        return result;
      } catch (err) {
        if (profile)
          this.recordSessionActivity(profile, "failed", "launch-failed");
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle(
      "sessions:openLoginLink",
      async (_event, id, loginUrl) => {
        let profile;
        try {
          profile = this.sessions.list().find((item) => item.id === id);
          if (!profile) throw new Error("Session profile not found.");
          const result = await this.sessions.launchBrowserProfile(id, loginUrl);
          this.recordSessionActivity(profile, "success");
          await this.pushAutomationState();
          return result;
        } catch (err) {
          if (profile)
            this.recordSessionActivity(profile, "failed", "login-link-failed");
          return { ok: false, error: err.message };
        }
      },
    );
  }
  async shutdown() {
    if (this.registeredEmergencyHotkey) {
      import_electron4.globalShortcut.unregister(
        this.registeredEmergencyHotkey,
      );
      this.registeredEmergencyHotkey = null;
    }
    await this.automationHost.shutdown();
  }
  // ---- Skills Sync (AI Environment Manager engine bridge) -------------
  registerSkillsHandlers() {
    import_electron4.ipcMain.handle("skills:overview", () => skillsOverview());
    import_electron4.ipcMain.handle("skills:install", (_e, opts) =>
      installSkills(opts ?? {}),
    );
    import_electron4.ipcMain.handle("skills:audit", () => runAudit());
    import_electron4.ipcMain.handle("skills:openApp", () => openApp());
  }
  registerApiKeyHandlers() {
    import_electron4.ipcMain.handle("providers:meta", () => allProviderMeta());
    import_electron4.ipcMain.handle("apikeys:localLedger", () =>
      readLocalLedger(),
    );
    import_electron4.ipcMain.handle("apikeys:list", () =>
      this.api.buildKeyStates(),
    );
    import_electron4.ipcMain.handle("apikeys:summary", () =>
      this.api.buildSummary(),
    );
    import_electron4.ipcMain.handle("apikeys:chart", (_e, id, metric, range) =>
      this.api.buildChart(id, metric, range),
    );
    import_electron4.ipcMain.handle(
      "apikeys:validate",
      async (_e, provider, secret) => this.api.validate(provider, secret),
    );
    import_electron4.ipcMain.handle("apikeys:add", async (_e, input) => {
      try {
        const record = addKey(input);
        await this.refreshApiKeys(record.id);
        return { ok: true, record };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("apikeys:update", async (_e, id, patch) => {
      try {
        const record = updateKey(id, patch);
        await this.refreshApiKeys(id);
        return { ok: true, record };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("apikeys:remove", (_e, id) => {
      try {
        removeKey(id);
        this.api.onRemoveKey(id);
        this.pushApiKeys();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("apikeys:refresh", async (_e, id) => {
      await this.refreshApiKeys(id);
    });
    import_electron4.ipcMain.handle("apikeys:export", async () => {
      const win2 = this.getWindow();
      if (!win2) return { ok: false, error: "No window" };
      const { canceled, filePath } =
        await import_electron4.dialog.showSaveDialog(win2, {
          title: "Export API key list (no secrets)",
          defaultPath: "api-keys.json",
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
      if (canceled || !filePath) return { ok: false };
      writeJsonAtomic(filePath, exportRecords());
      return { ok: true, path: filePath };
    });
  }
  norm(p) {
    return path11.resolve(p).toLowerCase();
  }
  async buildStates() {
    const profiles = listProfiles();
    const hiddenProfileIds = new Set(loadSettings().hiddenProfileIds);
    return Promise.all(
      profiles.map(async (profile) => {
        const identity = readIdentity(profile.configDir);
        const activity = readActivity(profile.configDir);
        let usage = this.usage.getCached(profile.id);
        if (usage && !usage.ok && identity.loggedIn) {
          try {
            const est = await estimateFromTranscripts(profile.configDir);
            activity.estTokens7d = est.estTokens7d;
            activity.estPrompts7d = est.estPrompts7d;
          } catch {}
        }
        const isDefault = this.defaultDir
          ? this.norm(this.defaultDir) === this.norm(profile.configDir)
          : isHomeDefaultDir(profile.configDir);
        return {
          profile,
          identity,
          usage,
          activity,
          isDefault,
          hidden: hiddenProfileIds.has(profile.id),
          dashboardRole:
            normalizeDashboardRole(profile.dashboardRole) ??
            (isDefault ? "work" : null),
        };
      }),
    );
  }
  async pushState() {
    const states = await this.buildStates();
    this.evaluateClaudeAlerts(states);
    this.getWindow()?.webContents.send("state:changed", states);
  }
  clearUsageRetry(profileId) {
    const timer = this.usageRetryTimers.get(profileId);
    if (timer) clearTimeout(timer);
    this.usageRetryTimers.delete(profileId);
  }
  scheduleUsageRetry(profileId, retryAt) {
    this.clearUsageRetry(profileId);
    const delay = Math.max(1e3, Math.min(60 * 60 * 1e3, retryAt - Date.now()));
    const timer = setTimeout(() => {
      this.usageRetryTimers.delete(profileId);
      void this.refreshAll(profileId, true);
    }, delay + 250);
    this.usageRetryTimers.set(profileId, timer);
  }
  async refreshAll(profileId, force = false) {
    const profiles = listProfiles().filter(
      (p) => !profileId || p.id === profileId,
    );
    await Promise.allSettled(
      profiles.map(async (p) => {
        if (readIdentity(p.configDir).loggedIn) {
          const snapshot = await this.usage.refresh(p, { force });
          if (snapshot?.retryAt && snapshot.retryAt > Date.now()) {
            this.scheduleUsageRetry(p.id, snapshot.retryAt);
          } else {
            this.clearUsageRetry(p.id);
          }
        }
      }),
    );
    await this.pushState();
  }
  registerHandlers() {
    import_electron4.ipcMain.handle("state:get", () => this.buildStates());
    import_electron4.ipcMain.handle("claude:history", (_e, days) =>
      readClaudeDailyHistory(Math.max(7, Math.min(90, Number(days) || 90))),
    );
    import_electron4.ipcMain.handle("gpt:usage", () => this.gptUsage);
    import_electron4.ipcMain.handle("gpt:refresh", () =>
      this.refreshGptUsage(),
    );
    import_electron4.ipcMain.handle("profiles:create", (_e, name, role) => {
      try {
        const profile = createProfile(name, role);
        if (normalizeDashboardRole(role) !== "personal") {
          linkSharedState(profile.configDir);
        }
        void this.pushState();
        return { ok: true, profile };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle(
      "profiles:import",
      (_e, name, dir, role) => {
        try {
          const profile = importProfile(name, dir, role);
          if (normalizeDashboardRole(role) !== "personal") {
            linkSharedState(profile.configDir);
          }
          void this.refreshAll(profile.id, true);
          return { ok: true, profile };
        } catch (err) {
          return { ok: false, error: err.message };
        }
      },
    );
    import_electron4.ipcMain.handle("profiles:rename", (_e, id, name) => {
      try {
        const profile = renameProfile(id, name);
        void this.pushState();
        return { ok: true, profile };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("profiles:remove", (_e, id, deleteDir) => {
      try {
        stopWatching(id);
        removeProfile(id, deleteDir);
        this.usage.dropProfile(id);
        const settings = loadSettings();
        saveSettings({
          hiddenProfileIds: settings.hiddenProfileIds.filter(
            (profileId) => profileId !== id,
          ),
        });
        void this.pushState();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("profiles:export", async () => {
      const win2 = this.getWindow();
      if (!win2) return { ok: false, error: "No window" };
      const { canceled, filePath } =
        await import_electron4.dialog.showSaveDialog(win2, {
          title: "Export account list",
          defaultPath: "claude-accounts.json",
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
      if (canceled || !filePath) return { ok: false };
      writeJsonAtomic(filePath, exportProfiles());
      return { ok: true, path: filePath };
    });
    import_electron4.ipcMain.handle("sys:pickFolder", async () => {
      const win2 = this.getWindow();
      if (!win2) return null;
      const { canceled, filePaths } =
        await import_electron4.dialog.showOpenDialog(win2, {
          title: "Select an existing CLAUDE_CONFIG_DIR",
          properties: ["openDirectory", "showHiddenFiles"],
        });
      return canceled ? null : (filePaths[0] ?? null);
    });
    import_electron4.ipcMain.handle("usage:refresh", async (_e, profileId) => {
      await this.refreshAll(profileId, true);
      return { ok: true };
    });
    import_electron4.ipcMain.handle(
      "profiles:launchVSCode",
      (_e, profileId) => {
        const profile = getProfile(profileId);
        if (!profile) return { ok: false, error: "Account not found." };
        try {
          return openVSCode(profile);
        } catch (err) {
          return { ok: false, error: err.message };
        }
      },
    );
    import_electron4.ipcMain.handle("profiles:login", (_e, profileId) => {
      const profile = getProfile(profileId);
      if (!profile) return { ok: false, error: "Account not found." };
      try {
        openLoginTerminal(profile);
        watchForLogin(
          profile.id,
          profile.configDir,
          () => void this.refreshAll(profile.id, true),
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("launchers:claudeCowork", () =>
      launchClaudeCowork(),
    );
    import_electron4.ipcMain.handle("launchers:codexChat", () =>
      launchCodexChat(),
    );
    import_electron4.ipcMain.handle("launchers:vscodeCodex", () =>
      launchVsCodeCodex(),
    );
    import_electron4.ipcMain.handle("launchers:vscodeProject", async () => {
      const win2 = this.getWindow();
      if (!win2) return { ok: false, error: "No window is available." };
      const { canceled, filePaths } =
        await import_electron4.dialog.showOpenDialog(win2, {
          title: "Choose a project for VS Code Codex",
          properties: ["openDirectory"],
        });
      if (canceled || !filePaths[0]) return { ok: true, cancelled: true };
      try {
        const selected = validateProjectDirectory(filePaths[0], (candidate) => {
          try {
            return fs11.statSync(candidate).isDirectory();
          } catch {
            return false;
          }
        });
        return launchVsCodeCodex(selected.path);
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("launchers:help", (_e, target) =>
      openAllowedExternal(target, "Could not open the help page."),
    );
    import_electron4.ipcMain.handle("profiles:visibility:get", () => ({
      hiddenProfileIds: loadSettings().hiddenProfileIds,
    }));
    import_electron4.ipcMain.handle(
      "profiles:visibility:setHidden",
      async (_e, profileId, hidden) => {
        if (typeof hidden !== "boolean" || !getProfile(profileId)) {
          return { ok: false, error: "Account visibility request is invalid." };
        }
        const settings = loadSettings();
        const ids = setProfileHidden(
          settings.hiddenProfileIds,
          profileId,
          hidden,
        );
        saveSettings({ hiddenProfileIds: ids });
        await this.pushState();
        return { ok: true, hiddenProfileIds: ids };
      },
    );
    import_electron4.ipcMain.handle("profiles:visibility:showAll", async () => {
      saveSettings({ hiddenProfileIds: [] });
      await this.pushState();
      return { ok: true, hiddenProfileIds: [] };
    });
    import_electron4.ipcMain.handle(
      "profiles:otherAccountsLayout:get",
      () => loadSettings().otherAccountsLayout,
    );
    import_electron4.ipcMain.handle(
      "profiles:otherAccountsLayout:set",
      (_e, requestedLayout) => {
        if (requestedLayout !== "grid" && requestedLayout !== "wide") {
          return {
            ok: false,
            error: "The requested account layout is invalid.",
          };
        }
        const layout = normalizeOtherAccountsLayout(requestedLayout);
        saveSettings({ otherAccountsLayout: layout });
        return { ok: true, layout };
      },
    );
    import_electron4.ipcMain.handle("default:set", async (_e, profileId) => {
      try {
        let dir = profileId ? (getProfile(profileId)?.configDir ?? null) : null;
        if (profileId && !dir)
          return { ok: false, error: "Account not found." };
        if (dir && isHomeDefaultDir(dir)) dir = null;
        await setDefaultConfigDir(dir);
        this.defaultDir = dir;
        void this.pushState();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("sys:reveal", (_e, profileId) => {
      const profile = getProfile(profileId);
      if (profile) import_electron4.shell.openPath(profile.configDir);
    });
    import_electron4.ipcMain.handle("ui:getTheme", () => loadSettings().theme);
    import_electron4.ipcMain.handle("ui:setTheme", (_e, theme) => {
      saveSettings({ theme });
    });
    import_electron4.ipcMain.handle("alerts:get", () => loadSettings().alerts);
    import_electron4.ipcMain.handle("alerts:set", (_e, alerts) => {
      const sanitized = sanitizeAlertSettings(alerts);
      saveSettings({ alerts: sanitized });
      return sanitized;
    });
    import_electron4.ipcMain.handle("alerts:test", () => {
      this.showNotification(
        "Usage alerts are ready",
        "AI Account Manager can notify you about quota thresholds, resets, and expiring Claude sign-ins.",
      );
      return { ok: import_electron4.Notification.isSupported() };
    });
    import_electron4.ipcMain.handle("updates:get", () => ({
      ...this.updateState,
      settings: loadSettings().updates,
    }));
    import_electron4.ipcMain.handle("updates:check", () =>
      this.checkForUpdates(),
    );
    import_electron4.ipcMain.handle("updates:configure", (_e, updates) => {
      const current = loadSettings().updates;
      const next = {
        autoCheck: updates?.autoCheck !== false,
        manifestUrl: String(
          updates?.manifestUrl ?? current.manifestUrl ?? "",
        ).trim(),
      };
      saveSettings({ updates: next });
      return next;
    });
    import_electron4.ipcMain.handle("updates:openDownload", async () => {
      const url = this.updateState.update?.downloadUrl;
      if (!url || !url.startsWith("https://"))
        return {
          ok: false,
          error: "No verified update download is available.",
        };
      await import_electron4.shell.openExternal(url);
      return { ok: true };
    });
    import_electron4.ipcMain.handle("sys:versions", async () => {
      return {
        app: import_electron4.app.getVersion(),
        claudeCli: await claudeCliVersion(),
      };
    });
    import_electron4.ipcMain.handle("guide:open", () => this.openGuideWindow());
    import_electron4.ipcMain.handle("guide:acrobat", async () => {
      const pdf = this.guidePdfPath();
      const candidates = [
        "C:\\Program Files\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe",
        "C:\\Program Files (x86)\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe",
        "C:\\Program Files\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe",
        "C:\\Program Files (x86)\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe",
      ];
      const exe = candidates.find((p) => fs11.existsSync(p));
      if (exe) {
        (0, import_node_child_process4.spawn)(exe, [pdf], {
          detached: true,
          stdio: "ignore",
        }).unref();
        return { ok: true, how: "acrobat" };
      }
      const err = await import_electron4.shell.openPath(pdf);
      return { ok: !err, how: "default", error: err || void 0 };
    });
  }
};

// electron/main.ts
var win = null;
var backend = null;
var tray = null;
var isQuitting = false;
var startInBackground = process.argv.includes("--background");

// Keep the safeStorage (DPAPI) master key with the app across the product
// rename, so the API key vault in %APPDATA%\ClaudeAccountManager stays
// readable. Must run before app.whenReady(); see the module for the contract.
var { adoptLegacySafeStorageKey } = require("./safe-storage-continuity.cjs");
adoptLegacySafeStorageKey({
  userDataDir: import_electron5.app.getPath("userData"),
  appDataRoot: import_electron5.app.getPath("appData"),
});
if (!import_electron5.app.requestSingleInstanceLock()) {
  import_electron5.app.quit();
} else {
  import_electron5.app.on("second-instance", () => {
    showMainWindow();
  });
}
function createWindow() {
  win = new import_electron5.BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 880,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: import_electron5.nativeTheme.shouldUseDarkColors
      ? "#101014"
      : "#f5f5f7",
    title: "AI Account Manager",
    webPreferences: {
      preload: path12.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  win.once("ready-to-show", () => {
    const automation = loadSettings().automation;
    if (!startInBackground || !automation.automationEnabled) win?.show();
    startInBackground = false;
  });
  win.on("close", (event) => {
    const automation = loadSettings().automation;
    if (
      !isQuitting &&
      automation.automationEnabled &&
      automation.runInBackground
    ) {
      event.preventDefault();
      win?.hide();
      syncTray();
    }
  });
  win.on("closed", () => (win = null));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://"))
      void import_electron5.shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(path12.join(__dirname, "..", "dist", "index.html"));
  }
}
function showMainWindow() {
  if (!win || win.isDestroyed()) createWindow();
  if (win?.isMinimized()) win.restore();
  win?.show();
  win?.focus();
}
function syncTray() {
  if (!import_electron5.app.isReady()) return;
  const automation = loadSettings().automation;
  const needed = automation.automationEnabled && automation.runInBackground;
  if (!needed) {
    tray?.destroy();
    tray = null;
    return;
  }
  if (!tray) {
    const iconPath = import_electron5.app.isPackaged
      ? path12.join(process.resourcesPath, "icon.ico")
      : path12.resolve(__dirname, "..", "..", "build", "icon.ico");
    tray = new import_electron5.Tray(
      import_electron5.nativeImage.createFromPath(iconPath),
    );
    tray.setToolTip("AI Account Manager — automation monitoring");
    tray.on("double-click", showMainWindow);
  }
  const paused = Boolean(
    automation.pausedUntil && automation.pausedUntil > Date.now(),
  );
  tray.setContextMenu(
    import_electron5.Menu.buildFromTemplate([
      { label: "Open AI Account Manager", click: showMainWindow },
      { type: "separator" },
      paused
        ? {
            label: "Resume unattended permissions",
            click: () =>
              void backend?.updateAutomationSettings({ pausedUntil: null }),
          }
        : {
            label: "Emergency pause",
            click: () => void backend?.emergencyPause(),
          },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          import_electron5.app.quit();
        },
      },
    ]),
  );
}
void import_electron5.app.whenReady().then(async () => {
  backend = new Backend(() => win);
  await backend.init();
  createWindow();
  syncTray();
  import_electron5.app.on("activate", () => {
    showMainWindow();
  });
});
import_electron5.app.on("window-all-closed", () => {
  stopAll();
  const automation = loadSettings().automation;
  if (
    isQuitting ||
    !automation.automationEnabled ||
    !automation.runInBackground
  ) {
    import_electron5.app.quit();
  }
});
import_electron5.app.on("before-quit", () => {
  isQuitting = true;
  import_electron5.globalShortcut.unregisterAll();
  void backend?.shutdown();
});
