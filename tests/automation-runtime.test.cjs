"use strict";

const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  AutomationHostClient,
  SessionLauncher,
  capabilityMatrix,
} = require("../app/dist-electron/automation-runtime.cjs");

function fixture(options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aam-session-test-"));
  const browserDirectory = path.join(root, "browser");
  const browser = path.join(browserDirectory, "chrome.exe");
  fs.mkdirSync(browserDirectory, { recursive: true });
  fs.writeFileSync(browser, "test-only", "utf8");
  const discovery = {
    browsers: [{ name: "Google Chrome", path: browser }],
    nativeApps: { claude: null, chatgpt: null },
    claudeChromeExtensionIds: [],
    cli: { claude: null, codex: null },
  };
  const launcher = new SessionLauncher(root, {
    discoverInstallations: async () => discovery,
    ...options,
  });
  return {
    root,
    launcher,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function fakeChild(pid) {
  const child = new EventEmitter();
  child.pid = pid;
  return child;
}

function fakeAutomationChild(pid) {
  const child = fakeChild(pid);
  child.exitCode = null;
  child.stderr = new EventEmitter();
  child.kill = () => {
    if (child.exitCode !== null) return;
    child.exitCode = 0;
    queueMicrotask(() => child.emit("exit", 0));
  };
  return child;
}

function fakeAutomationSocket(processId, requests) {
  const socket = new EventEmitter();
  socket.destroyed = false;
  socket.write = (line, callback) => {
    const message = JSON.parse(line);
    requests.push(message);
    const payload =
      message.type === "hello"
        ? { protocol: 1, processId }
        : message.type === "configure"
          ? {
              state: message.payload.automationEnabled
                ? message.payload.pausedUntil
                  ? "Paused"
                  : message.payload.dryRun
                    ? "Dry run"
                    : "Monitoring"
                : "Off",
              running: true,
              dryRun: message.payload.dryRun,
              pausedUntil: message.payload.pausedUntil,
              selectorRevision: "2026-08-v3",
            }
          : {};
    queueMicrotask(() => {
      callback?.();
      socket.emit(
        "data",
        Buffer.from(
          `${JSON.stringify({ id: message.id, ok: true, payload })}\n`,
        ),
      );
    });
    return true;
  };
  socket.destroy = () => {
    if (socket.destroyed) return;
    socket.destroyed = true;
    socket.emit("close");
  };
  socket.end = socket.destroy;
  queueMicrotask(() => socket.emit("connect"));
  return socket;
}

async function waitFor(check, timeout = 1_000) {
  const started = Date.now();
  while (!check()) {
    if (Date.now() - started > timeout) {
      throw new Error("Timed out waiting for the synthetic helper restart.");
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

test("automation helper restart reapplies the last safe configuration", async () => {
  const children = [];
  const requests = [];
  let processId = 10_000;
  const client = new AutomationHostClient("synthetic-helper.exe", {
    fileExists: () => true,
    restartDelay: () => 5,
    spawnProcess() {
      const child = fakeAutomationChild(processId++);
      children.push(child);
      return child;
    },
    createConnection() {
      return fakeAutomationSocket(processId, requests);
    },
  });
  const settings = {
    automationEnabled: true,
    dryRun: true,
    pausedUntil: null,
    providers: { claudeDesktop: { enabled: true, method: "uia-fallback" } },
  };
  try {
    assert.equal((await client.configure(settings)).state, "Dry run");
    assert.equal(children.length, 1);
    assert.deepEqual(
      requests.filter((request) => request.type === "configure").at(-1).payload,
      settings,
    );

    children[0].exitCode = 1;
    children[0].emit("exit", 1);
    await waitFor(
      () =>
        children.length === 2 &&
        requests.filter((request) => request.type === "configure").length === 2,
    );

    assert.deepEqual(
      requests.filter((request) => request.type === "configure").at(-1).payload,
      settings,
    );
    assert.equal((await client.request("status")).constructor, Object);
  } finally {
    await client.shutdown();
  }
});

test("capability matrix keeps unvalidated and high-impact paths non-live", () => {
  const capabilities = capabilityMatrix({
    browsers: [{ name: "Chrome", path: "C:/Chrome/chrome.exe" }],
    nativeApps: { claude: { appId: "Claude" }, chatgpt: { appId: "ChatGPT" } },
    claudeChromeExtensionIds: ["synthetic-extension"],
    cli: { claude: "claude", codex: "codex" },
  });
  const claudeUia = capabilities.find(
    (item) => item.capability === "Residual permission-card UIA",
  );
  const highImpact = capabilities.find(
    (item) => item.provider === "High-impact approvals",
  );
  const webProfiles = capabilities.find(
    (item) => item.capability === "Persistent isolated browser profile",
  );
  assert.equal(claudeUia.status, "Partial live validation");
  assert.equal(highImpact.status, "Unavailable");
  assert.equal(webProfiles.status, "Needs account test");
  assert.match(highImpact.detail, /live UIA remain locked/i);
});

test("isolated launches use direct argument arrays and hold an exclusive profile lock", async () => {
  const children = [];
  const calls = [];
  const context = fixture({
    spawnProcess(file, args, options) {
      calls.push({ file, args, options });
      const child = fakeChild(7_000 + children.length);
      children.push(child);
      return child;
    },
  });
  try {
    const profile = context.launcher.save({
      name: "GPT Work",
      surface: "chatgpt-web",
    });
    const first = await context.launcher.launchBrowserProfile(profile.id);
    assert.equal(first.ok, true);
    assert.equal(calls[0].file.endsWith("chrome.exe"), true);
    assert.equal(calls[0].options.shell, undefined);
    assert.deepEqual(calls[0].args.slice(1), [
      "--no-first-run",
      "--app=https://chatgpt.com/",
    ]);
    assert.match(calls[0].args[0], /^--user-data-dir=/);
    await assert.rejects(
      context.launcher.launchBrowserProfile(profile.id),
      /already running|already locked/i,
    );
    children[0].emit("exit", 0);
    assert.equal(
      (await context.launcher.launchBrowserProfile(profile.id)).ok,
      true,
    );
    children[1].emit("exit", 0);
  } finally {
    context.cleanup();
  }
});

test("a failed browser spawn releases the managed profile lock", async () => {
  let fail = true;
  let child;
  const context = fixture({
    spawnProcess() {
      if (fail) throw new Error("synthetic launch failure");
      child = fakeChild(8_001);
      return child;
    },
  });
  try {
    const profile = context.launcher.save({
      name: "Claude Test",
      surface: "claude-web",
    });
    await assert.rejects(
      context.launcher.launchBrowserProfile(profile.id),
      /synthetic launch failure/,
    );
    fail = false;
    assert.equal(
      (await context.launcher.launchBrowserProfile(profile.id)).ok,
      true,
    );
    child.emit("exit", 0);
  } finally {
    context.cleanup();
  }
});

test("login links are ephemeral and profile removal retains browser data by default", async () => {
  let child;
  const calls = [];
  const context = fixture({
    spawnProcess(file, args) {
      calls.push({ file, args });
      child = fakeChild(9_001);
      return child;
    },
  });
  try {
    const profile = context.launcher.save({
      name: "Claude Colleague",
      surface: "claude-web",
    });
    fs.mkdirSync(profile.profileDataDir, { recursive: true });
    const secretLink = "https://claude.ai/login?code=one-time-value";
    await context.launcher.launchBrowserProfile(profile.id, secretLink);
    const firstChild = child;
    assert.match(
      calls[0].args.at(-1),
      /^--app=http:\/\/127\.0\.0\.1:\d+\/[a-f0-9]{64}$/,
    );
    assert.equal(calls[0].args.join(" ").includes("one-time-value"), false);
    const relayUrl = calls[0].args.at(-1).slice("--app=".length);
    const redirect = await new Promise((resolve, reject) => {
      http
        .get(relayUrl, (response) => {
          response.resume();
          response.once("end", () => resolve(response));
        })
        .once("error", reject);
    });
    assert.equal(redirect.statusCode, 302);
    assert.equal(redirect.headers.location, secretLink);
    const second = await context.launcher.launchBrowserProfile(
      profile.id,
      "https://claude.ai/login?code=second-one-time-value",
    );
    assert.equal(second.ok, true);
    assert.equal(
      calls[1].args.join(" ").includes("second-one-time-value"),
      false,
    );
    firstChild.emit("exit", 0);
    const metadata = fs.readFileSync(
      path.join(context.root, "automation", "session-profiles.json"),
      "utf8",
    );
    assert.equal(metadata.includes("one-time-value"), false);
    assert.equal(context.launcher.remove(profile.id).retainedProfileData, true);
    assert.equal(fs.existsSync(profile.profileDataDir), true);
    context.launcher.cleanupProfileData(profile.id);
    assert.equal(fs.existsSync(profile.profileDataDir), false);
  } finally {
    context.cleanup();
  }
});
