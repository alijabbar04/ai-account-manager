"use strict";

const crypto = require("node:crypto");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn, execFile } = require("node:child_process");
const { promisify } = require("node:util");
const {
  buildBrowserLaunchCommand,
  buildCliArguments,
  redactAuditRecord,
  sanitizeLoginUrl,
  sanitizeSessionProfile,
} = require("./automation-domain.cjs");

const execFileAsync = promisify(execFile);
const PROTOCOL_VERSION = 1;

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, file);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createEphemeralLoginRelay(loginUrl) {
  const target = sanitizeLoginUrl(loginUrl);
  const token = crypto.randomBytes(32).toString("hex");
  let expectedHost = "";
  let timer = null;
  let used = false;
  let closed = false;
  const server = http.createServer((request, response) => {
    if (
      used ||
      request.method !== "GET" ||
      request.url !== `/${token}` ||
      request.headers.host !== expectedHost
    ) {
      response.writeHead(404, {
        "Cache-Control": "no-store",
        Connection: "close",
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end("Not found.");
      return;
    }
    used = true;
    response.writeHead(302, {
      "Cache-Control": "no-store",
      Connection: "close",
      Location: target,
      "Referrer-Policy": "no-referrer",
    });
    response.end();
    setImmediate(close);
  });
  const close = () => {
    if (closed) return;
    closed = true;
    if (timer) clearTimeout(timer);
    try {
      server.close();
    } catch {}
  };
  return new Promise((resolve, reject) => {
    const initialError = (error) => reject(error);
    server.once("error", initialError);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", initialError);
      server.on("error", close);
      const address = server.address();
      if (!address || typeof address === "string") {
        close();
        reject(new Error("The temporary login relay did not bind safely."));
        return;
      }
      expectedHost = `127.0.0.1:${address.port}`;
      timer = setTimeout(close, 30_000);
      timer.unref?.();
      server.unref?.();
      resolve({ url: `http://${expectedHost}/${token}`, close });
    });
  });
}

class AutomationHostClient extends EventEmitter {
  constructor(helperPath, dependencies = {}) {
    super();
    this.helperPath = helperPath;
    this.spawnProcess = dependencies.spawnProcess ?? spawn;
    this.createConnection =
      dependencies.createConnection ??
      ((pipePath) => net.createConnection(pipePath));
    this.fileExists = dependencies.fileExists ?? fs.existsSync;
    this.restartDelay =
      dependencies.restartDelay ??
      ((attempt) => Math.min(500 * 2 ** Math.min(attempt, 5), 15_000));
    this.child = null;
    this.socket = null;
    this.buffer = "";
    this.pending = new Map();
    this.connecting = null;
    this.desired = false;
    this.restartAttempt = 0;
    this.lastError = null;
    this.lastSettings = null;
  }

  async ensureStarted() {
    this.desired = true;
    if (this.socket && !this.socket.destroyed) return;
    if (this.connecting) return this.connecting;
    this.connecting = this.#start();
    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  async #start() {
    if (!this.fileExists(this.helperPath)) {
      throw new Error(
        "Automation host is not built. Run npm run automation:publish.",
      );
    }
    const suffix = crypto.randomBytes(12).toString("hex");
    const pipeName = `aam-automation-${process.pid}-${suffix}`;
    const secret = crypto.randomBytes(32).toString("base64url");
    const child = this.spawnProcess(
      this.helperPath,
      ["--pipe", pipeName, "--parent-pid", String(process.pid)],
      {
        windowsHide: true,
        stdio: ["ignore", "ignore", "pipe"],
        env: { ...process.env, AAM_AUTOMATION_SECRET: secret },
      },
    );
    this.child = child;
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr = `${stderr}${chunk.toString("utf8")}`.slice(-500);
    });
    child.once("exit", (code) => {
      this.child = null;
      this.socket?.destroy();
      this.socket = null;
      this.lastError = stderr.trim() || `Automation host exited (${code}).`;
      this.#rejectPending(new Error(this.lastError));
      this.emit("status", {
        state: "Error",
        running: false,
        lastError: this.lastError,
      });
      if (this.desired) this.#scheduleRestart();
    });

    const pipePath = `\\\\.\\pipe\\${pipeName}`;
    let connected = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (child.exitCode !== null) break;
      try {
        await this.#connect(pipePath);
        connected = true;
        break;
      } catch {
        await delay(Math.min(50 + attempt * 20, 300));
      }
    }
    if (!connected) {
      child.kill();
      throw new Error(stderr.trim() || "Automation host pipe did not start.");
    }
    const hello = await this.request(
      "hello",
      {},
      { protocol: PROTOCOL_VERSION, secret, timeout: 5_000 },
    );
    if (hello.protocol !== PROTOCOL_VERSION) {
      throw new Error("Automation host protocol version did not match.");
    }
    let restoredStatus = null;
    if (this.lastSettings) {
      try {
        restoredStatus = await this.request("configure", this.lastSettings);
      } catch (error) {
        this.lastError = `Automation host settings restore failed: ${error.message}`;
        this.emit("status", {
          state: "Error",
          running: false,
          lastError: this.lastError,
        });
        child.kill();
        throw new Error(this.lastError);
      }
    }
    this.restartAttempt = 0;
    this.lastError = null;
    this.emit(
      "status",
      restoredStatus ?? {
        state: "Monitoring",
        running: true,
        processId: hello.processId,
      },
    );
    return restoredStatus;
  }

  #connect(pipePath) {
    return new Promise((resolve, reject) => {
      const socket = this.createConnection(pipePath);
      const failed = (error) => {
        socket.destroy();
        reject(error);
      };
      socket.once("error", failed);
      socket.once("connect", () => {
        socket.removeListener("error", failed);
        socket.on("error", (error) => {
          this.lastError = error.message;
          this.#rejectPending(error);
        });
        socket.on("data", (chunk) => this.#onData(chunk));
        socket.on("close", () => {
          if (this.socket === socket) this.socket = null;
        });
        this.socket = socket;
        resolve();
      });
    });
  }

  #onData(chunk) {
    this.buffer += chunk.toString("utf8");
    if (this.buffer.length > 2_000_000) {
      this.buffer = "";
      this.socket?.destroy(
        new Error("Automation host response exceeded limits."),
      );
      return;
    }
    let newline;
    while ((newline = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      if (message.type === "event") {
        this.emit(message.event, message.payload);
        continue;
      }
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      message.ok
        ? pending.resolve(message.payload)
        : pending.reject(
            new Error(message.error || "Automation host request failed."),
          );
    }
  }

  request(type, payload = {}, options = {}) {
    const socket = this.socket;
    if (!socket || socket.destroyed) {
      return Promise.reject(new Error("Automation host is not connected."));
    }
    const id = crypto.randomUUID();
    const message = {
      id,
      type,
      payload,
      ...(options.protocol ? { protocol: options.protocol } : {}),
      ...(options.secret ? { secret: options.secret } : {}),
    };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${type} timed out.`));
      }, options.timeout ?? 20_000);
      this.pending.set(id, { resolve, reject, timer });
      socket.write(`${JSON.stringify(message)}\n`, (error) => {
        if (!error) return;
        const pending = this.pending.get(id);
        if (!pending) return;
        this.pending.delete(id);
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  async configure(settings) {
    this.lastSettings = settings;
    if (!this.socket || this.socket.destroyed) {
      const restoredStatus = await this.ensureStarted();
      if (restoredStatus) return restoredStatus;
    }
    return this.request("configure", settings);
  }

  async shutdown() {
    this.desired = false;
    try {
      if (this.socket && !this.socket.destroyed) {
        await this.request("shutdown", {}, { timeout: 2_000 });
      }
    } catch {}
    this.socket?.end();
    await delay(150);
    if (this.child && this.child.exitCode === null) this.child.kill();
    this.child = null;
    this.socket = null;
    this.lastSettings = null;
    this.#rejectPending(new Error("Automation host stopped."));
  }

  #scheduleRestart() {
    const attempt = this.restartAttempt++;
    const wait = this.restartDelay(attempt);
    setTimeout(() => {
      if (!this.desired || this.connecting || this.socket) return;
      this.ensureStarted().catch((error) => {
        this.lastError = error.message;
      });
    }, wait).unref?.();
  }

  #rejectPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

class SessionLauncher {
  constructor(applicationDataRoot, dependencies = {}) {
    this.root = path.join(applicationDataRoot, "automation");
    this.profileRoot = path.join(this.root, "browser-profiles");
    this.locksRoot = path.join(this.root, "profile-locks");
    this.file = path.join(this.root, "session-profiles.json");
    this.active = new Map();
    this.spawnProcess = dependencies.spawnProcess ?? spawn;
    this.discoverInstallations = dependencies.discoverInstallations ?? null;
    fs.mkdirSync(this.profileRoot, { recursive: true });
    fs.mkdirSync(this.locksRoot, { recursive: true });
  }

  list() {
    const shape = readJson(this.file, { schemaVersion: 1, profiles: [] });
    return (shape.profiles ?? []).map((profile) => ({
      ...profile,
      running: this.active.has(profile.id),
    }));
  }

  save(input) {
    const profiles = this.list().map(
      ({ running: _running, ...profile }) => profile,
    );
    const existing = input?.id
      ? profiles.find((profile) => profile.id === input.id)
      : null;
    const profile = sanitizeSessionProfile(input, this.profileRoot, existing);
    const duplicate = profiles.find(
      (item) =>
        item.id !== profile.id &&
        item.name.toLowerCase() === profile.name.toLowerCase(),
    );
    if (duplicate)
      throw new Error("A session profile with that name already exists.");
    const next = existing
      ? profiles.map((item) => (item.id === profile.id ? profile : item))
      : [...profiles, profile];
    writeJsonAtomic(this.file, { schemaVersion: 1, profiles: next });
    return profile;
  }

  remove(id) {
    if (this.active.has(id))
      throw new Error("Stop the running profile before removing it.");
    const profiles = this.list().filter((profile) => profile.id !== id);
    writeJsonAtomic(this.file, {
      schemaVersion: 1,
      profiles: profiles.map(({ running: _running, ...profile }) => profile),
    });
    // Logged-in browser data is deliberately retained for separately confirmed cleanup.
    return { ok: true, retainedProfileData: true };
  }

  cleanupProfileData(id) {
    if (this.active.has(id))
      throw new Error(
        "Stop the running profile before deleting its browser data.",
      );
    if (!/^[a-f0-9-]{16,64}$/i.test(String(id ?? ""))) {
      throw new Error("Invalid managed profile identifier.");
    }
    const target = path.resolve(this.profileRoot, id);
    const relative = path.relative(path.resolve(this.profileRoot), target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Managed profile path escaped its data root.");
    }
    if (fs.existsSync(target))
      fs.rmSync(target, { recursive: true, force: false });
    return { ok: true };
  }

  async discover() {
    if (this.discoverInstallations) return this.discoverInstallations();
    const browsers = discoverBrowsers();
    const startApps = await discoverStartApps();
    const extensions = discoverClaudeChromeExtensions();
    return {
      browsers,
      nativeApps: {
        claude: selectStartApp(startApps, "claude"),
        chatgpt: selectStartApp(startApps, "chatgpt"),
      },
      claudeChromeExtensionIds: extensions,
      cli: {
        claude: findOnPath("claude.exe") ?? findOnPath("claude.cmd"),
        codex: findOnPath("codex.exe") ?? findOnPath("codex.cmd"),
      },
    };
  }

  async quickLaunch(provider) {
    const discovery = await this.discover();
    const app = discovery.nativeApps[provider];
    if (app?.appId) {
      launchStartApp(app.appId);
      return {
        ok: true,
        capability: "best-effort",
        message: `Opened or focused ${provider === "claude" ? "Claude" : "ChatGPT"}. Vendor single-instance behavior decides whether this is a new window.`,
      };
    }
    const url =
      provider === "claude" ? "https://claude.ai/new" : "https://chatgpt.com/";
    return {
      ok: false,
      error: `Native app was not found. Create an isolated web profile for ${url}.`,
    };
  }

  async launchBrowserProfile(id, loginUrl) {
    const profile = this.list().find((item) => item.id === id);
    if (!profile) throw new Error("Session profile not found.");
    const discovery = await this.discover();
    const browser = discovery.browsers[0];
    if (!browser) throw new Error("Chrome or Edge was not found.");
    const relay = loginUrl ? await createEphemeralLoginRelay(loginUrl) : null;
    const command = buildBrowserLaunchCommand({
      executable: browser.path,
      managedRoot: this.profileRoot,
      profile,
      launchUrl: relay?.url,
    });
    fs.mkdirSync(command.profileDataDir, { recursive: true });
    const alreadyRunning = this.active.has(profile.id);
    const lock =
      alreadyRunning && loginUrl ? null : this.#acquireLock(profile.id);
    let child;
    try {
      child = this.spawnProcess(command.file, command.args, {
        detached: false,
        stdio: "ignore",
        windowsHide: false,
      });
    } catch (error) {
      relay?.close();
      lock?.release();
      throw error;
    }
    if (!alreadyRunning) {
      this.active.set(profile.id, child.pid);
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        this.active.delete(profile.id);
        lock?.release();
      };
      child.once("exit", finish);
      child.once("error", finish);
    } else {
      child.once("error", () => relay?.close());
    }
    this.#markLaunched(profile.id);
    return {
      ok: true,
      processId: child.pid,
      message: loginUrl
        ? "Opened the login link in this isolated profile; the URL was not saved."
        : "Opened the isolated browser app profile.",
    };
  }

  cliCommand(id) {
    const profile = this.list().find((item) => item.id === id);
    if (!profile) throw new Error("Session profile not found.");
    const command = buildCliArguments(profile);
    this.#markLaunched(profile.id);
    return { profile, ...command };
  }

  #markLaunched(id) {
    const profiles = this.list().map(({ running: _running, ...profile }) =>
      profile.id === id ? { ...profile, lastLaunch: Date.now() } : profile,
    );
    writeJsonAtomic(this.file, { schemaVersion: 1, profiles });
  }

  #acquireLock(id) {
    if (this.active.has(id))
      throw new Error("This isolated profile is already running.");
    const lockPath = path.join(this.locksRoot, `${id}.lock`);
    try {
      const previous = readJson(lockPath, null);
      if (previous?.pid) {
        try {
          process.kill(previous.pid, 0);
          throw new Error(
            "This isolated profile is already locked by another process.",
          );
        } catch (error) {
          if (error.message.includes("already locked")) throw error;
        }
      }
      if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
      const handle = fs.openSync(lockPath, "wx");
      fs.writeFileSync(
        handle,
        JSON.stringify({ pid: process.pid, at: Date.now() }),
        "utf8",
      );
      fs.closeSync(handle);
      return {
        release: () => {
          try {
            fs.unlinkSync(lockPath);
          } catch {}
        },
      };
    } catch (error) {
      throw new Error(error.message || "Could not lock this isolated profile.");
    }
  }
}

function findOnPath(executable) {
  const search = String(process.env.PATH ?? "").split(path.delimiter);
  for (const directory of search) {
    if (!directory) continue;
    const candidate = path.join(directory.replace(/^"|"$/g, ""), executable);
    if (fs.existsSync(candidate)) return path.resolve(candidate);
  }
  return null;
}

function discoverBrowsers() {
  const candidates = [
    process.env.PROGRAMFILES &&
      path.join(
        process.env.PROGRAMFILES,
        "Google",
        "Chrome",
        "Application",
        "chrome.exe",
      ),
    process.env["PROGRAMFILES(X86)"] &&
      path.join(
        process.env["PROGRAMFILES(X86)"],
        "Microsoft",
        "Edge",
        "Application",
        "msedge.exe",
      ),
    findOnPath("chrome.exe"),
    findOnPath("msedge.exe"),
  ].filter(Boolean);
  return [...new Set(candidates.map((item) => path.resolve(item)))]
    .filter((item) => fs.existsSync(item))
    .map((item) => ({
      name:
        path.basename(item).toLowerCase() === "chrome.exe"
          ? "Google Chrome"
          : "Microsoft Edge",
      path: item,
    }));
}

async function discoverStartApps() {
  const command = [
    "$apps = Get-StartApps | Where-Object { $_.Name -match 'Claude|ChatGPT|Codex' } | Select-Object Name,AppID",
    "$apps | ConvertTo-Json -Compress",
  ].join("; ");
  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", command],
      { timeout: 10_000, windowsHide: true, maxBuffer: 128 * 1024 },
    );
    const parsed = stdout.trim() ? JSON.parse(stdout.trim()) : [];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function selectStartApp(apps, provider) {
  const allowed =
    provider === "claude"
      ? /^Claude_pzs8sxrjxfjjc!/i
      : /^OpenAI\.(?:Codex|ChatGPT-Desktop)_2p2nqsd0c76g0!/i;
  const candidates = apps.filter((item) =>
    allowed.test(String(item.AppID ?? "")),
  );
  const preferred =
    provider === "claude"
      ? candidates.find((item) => /^Claude$/i.test(item.Name))
      : candidates.find((item) => /^(?:ChatGPT|Codex)$/i.test(item.Name));
  const selected = preferred ?? candidates[0];
  return selected ? { name: selected.Name, appId: selected.AppID } : null;
}

function launchStartApp(appId) {
  if (
    !/^(?:Claude_pzs8sxrjxfjjc|OpenAI\.(?:Codex|ChatGPT-Desktop)_2p2nqsd0c76g0)![\w.-]+$/i.test(
      appId,
    )
  ) {
    throw new Error("Untrusted packaged-app identifier.");
  }
  const explorer = path.join(
    process.env.WINDIR ?? "C:\\Windows",
    "explorer.exe",
  );
  const child = spawn(explorer, [`shell:AppsFolder\\${appId}`], {
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
}

function discoverClaudeChromeExtensions() {
  const userData = path.join(
    process.env.LOCALAPPDATA ?? "",
    "Google",
    "Chrome",
    "User Data",
  );
  if (!fs.existsSync(userData)) return [];
  const ids = new Set();
  let profiles = [];
  try {
    profiles = fs
      .readdirSync(userData, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          (entry.name === "Default" || /^Profile \d+$/.test(entry.name)),
      )
      .slice(0, 20);
  } catch {
    return [];
  }
  for (const profile of profiles) {
    const extensionRoot = path.join(userData, profile.name, "Extensions");
    let extensions = [];
    try {
      extensions = fs
        .readdirSync(extensionRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .slice(0, 200);
    } catch {
      continue;
    }
    for (const extension of extensions) {
      let versions = [];
      try {
        versions = fs
          .readdirSync(path.join(extensionRoot, extension.name), {
            withFileTypes: true,
          })
          .filter((entry) => entry.isDirectory())
          .slice(-3);
      } catch {
        continue;
      }
      for (const version of versions) {
        try {
          const manifest = fs.readFileSync(
            path.join(
              extensionRoot,
              extension.name,
              version.name,
              "manifest.json",
            ),
            "utf8",
          );
          if (/Claude|Anthropic/i.test(manifest)) ids.add(extension.name);
        } catch {}
      }
    }
  }
  return [...ids];
}

function appendAudit(applicationDataRoot, input) {
  const record = redactAuditRecord(input);
  const directory = path.join(applicationDataRoot, "automation");
  fs.mkdirSync(directory, { recursive: true });
  const date = new Date(record.timestamp);
  const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  fs.appendFileSync(
    path.join(directory, `activity-${month}.jsonl`),
    `${JSON.stringify(record)}\n`,
    "utf8",
  );
  return record;
}

function capabilityMatrix(discovery) {
  return [
    {
      provider: "Claude Desktop / Cowork",
      capability: "Native Auto and Skip mode",
      status: discovery.nativeApps.claude
        ? "Partial live validation"
        : "Blocked",
      detail:
        "The installed package is trusted, but the live menu action and an expiring trusted-session policy are not validated. Auto/Skip is unavailable; Manual restore remains available.",
    },
    {
      provider: "Claude Desktop / Cowork",
      capability: "Residual permission-card UIA",
      status: "Partial live validation",
      detail:
        "Real Gmail-draft and Windows-MCP cards were recognized in Dry run. Paused-card, simultaneous-window, and one user-controlled Allow once invocation gates remain; production invocation is locked.",
    },
    {
      provider: "Claude in Chrome",
      capability: "Auto/Skip plus UIA residual prompts",
      status: discovery.claudeChromeExtensionIds.length
        ? "Needs live test"
        : "Best effort",
      detail:
        "Google signer and Claude subtree are required. Production invocation is disabled until a live side-panel tree is captured.",
    },
    {
      provider: "Claude Code",
      capability: "Profile-scoped permission launch",
      status: discovery.cli.claude ? "Verified" : "Blocked",
      detail:
        "Manual per-launch mode is available without changing global settings. Saved Auto/Skip intent is refused until an expiring trusted-session policy exists.",
    },
    {
      provider: "ChatGPT / Codex desktop",
      capability: "Trusted package discovery and diagnostics",
      status: discovery.nativeApps.chatgpt ? "Verified" : "Blocked",
      detail:
        "Unified and legacy package families are recognized separately; diagnostics remain redacted.",
    },
    {
      provider: "ChatGPT / Codex desktop",
      capability: "Permission-card UIA",
      status: "Needs live test",
      detail:
        "Installed package identity is verified; no action labels are guessed before live inspection.",
    },
    {
      provider: "ChatGPT browser",
      capability: "Permission-card UIA",
      status: "Unsupported",
      detail:
        "No exact trusted browser permission surface has been established; arbitrary pages are never actionable.",
    },
    {
      provider: "Codex CLI",
      capability: "Profile-scoped permission launch",
      status: discovery.cli.codex ? "Verified" : "Blocked",
      detail:
        "Manual on-request launch is available and global config is untouched. No-prompts/auto-review intent is refused until an expiring trusted-session policy exists.",
    },
    {
      provider: "Claude / ChatGPT web",
      capability: "Persistent isolated browser profile",
      status: discovery.browsers.length ? "Needs account test" : "Blocked",
      detail:
        "App-managed user-data directories isolate cookies; command construction and locks are verified, while a two-account login still needs a live test.",
    },
    {
      provider: "High-impact approvals",
      capability: "Expiring trusted-session policy",
      status: "Unavailable",
      detail:
        "Sending messages, purchases, account-security changes, and other high-impact unattended actions are not enabled. Native Auto/Skip and live UIA remain locked until a selected provider/profile can be trusted temporarily, warned visibly, paused, expired, and audited.",
    },
    {
      provider: "Claude native desktop",
      capability: "Isolated user-data directory and callback routing",
      status: "Experimental",
      detail:
        "Deliberately disabled until update, Cowork, and OAuth callback behavior can be proven; use isolated web profiles.",
    },
    {
      provider: "Native desktop profiles",
      capability: "Arbitrary multi-account OAuth callback routing",
      status: "Unsupported by vendor",
      detail:
        "No protocol hijacking or token proxy is attempted; use isolated web profiles when routing is ambiguous.",
    },
    {
      provider: "Claude Cowork",
      capability: "Cloud versus local-computer boundary",
      status: "Verified",
      detail:
        "Cloud work may continue remotely; local files, browser, and computer use require the connected desktop app.",
    },
  ];
}

module.exports = {
  AutomationHostClient,
  SessionLauncher,
  appendAudit,
  capabilityMatrix,
  discoverBrowsers,
};
