"use strict";

const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  SessionLauncher,
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
