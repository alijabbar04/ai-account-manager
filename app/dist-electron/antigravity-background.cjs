"use strict";
const path = require("node:path");
const fs = require("node:fs");
const { execFile } = require("node:child_process");

// A private stdio channel, never a listening port. The helper independently
// watches this process's lifetime, including forced installer termination.
function createWindowsLayer(options = {}) {
  let child,
    buffer = "",
    nextId = 0,
    dead = false;
  const pending = new Map();
  function open() {
    if (dead) throw new Error("Background helper stopped");
    if (child) return;
    const script =
      options.script ?? path.join(__dirname, "antigravity-background.ps1");
    // PowerShell cannot load a -File from inside asar.
    const actual = script.replace(/app\.asar([\\/])/, "app.asar.unpacked$1");
    if (!fs.existsSync(actual))
      throw new Error("Background helper unavailable");
    child = (options.execFile ?? execFile)(
      "powershell.exe",
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        actual,
        "-OwnerId",
        String(process.pid),
      ],
      { windowsHide: true, maxBuffer: 1024 * 1024 },
    );
    // execFile normally buffers all output. This is a long-lived streaming helper.
    child.stdout.removeAllListeners("data");
    child.stderr.removeAllListeners("data");
    child.stderr.resume();
    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        try {
          const response = JSON.parse(line);
          const slot = pending.get(response.id);
          if (slot) {
            pending.delete(response.id);
            clearTimeout(slot.timer);
            response.ok
              ? slot.resolve(response.result)
              : slot.reject(new Error("Background action unavailable"));
          }
        } catch {}
      }
    });
    const failed = () => {
      dead = true;
      for (const slot of pending.values()) {
        clearTimeout(slot.timer);
        slot.reject(new Error("Background helper stopped"));
      }
      pending.clear();
      // Do not restart after a broken helper: ownership cannot be reconstructed.
    };
    child.on("error", failed);
    child.on("exit", failed);
    child.stdin.on("error", failed);
  }
  function command(action, data = {}) {
    return new Promise((resolve, reject) => {
      try {
        open();
        const id = ++nextId;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error("Background action timed out"));
        }, 15000);
        pending.set(id, { resolve, reject, timer });
        child.stdin.write(JSON.stringify({ id, action, ...data }) + "\n");
      } catch (error) {
        reject(error);
      }
    });
  }
  return {
    snapshot: () => command("snapshot"),
    launch: (executable) => command("launch", { executable }),
    manage: (targets, hide, throttle) =>
      command("manage", { targets, hide, throttle }),
    release: (targets) => command("release", { targets }),
    close: (targets) => command("close", { targets }),
    force: (targets) => command("force", { targets }),
    stop: async () => {
      if (child && !dead) {
        await command("stop").catch(() => {});
        child.stdin.end();
      }
    },
  };
}

function createAntigravityBackground(options = {}) {
  const layer = options.layer ?? createWindowsLayer(options);
  const now = options.now ?? Date.now;
  const sleep =
    options.sleep ??
    ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const schedule = options.setInterval ?? setInterval;
  const unschedule = options.clearInterval ?? clearInterval;
  let enabled = false,
    stopped = false,
    released = false,
    attempted = false,
    launching = false,
    ticking = false;
  let executable,
    startedAt = 0,
    timer,
    operation = Promise.resolve(),
    closing;
  const owned = new Map();
  const identity = (row) => String(row.pid) + ":" + row.startedAt;
  const samePath = (a, b) =>
    a &&
    b &&
    path.win32.normalize(a).toLowerCase() ===
      path.win32.normalize(b).toLowerCase();
  const eligible = (row) =>
    !/^agy(?:\.exe)?$/i.test(row.name || "") &&
    (samePath(row.executablePath, executable) ||
      samePath(
        row.executablePath,
        path.win32.join(
          path.win32.dirname(executable),
          "resources",
          "bin",
          "language_server.exe",
        ),
      ));
  function serialize(task) {
    const result = operation.then(task);
    operation = result.catch(() => {});
    return result;
  }
  function reconcile(rows) {
    const live = new Map(rows.map((row) => [identity(row), row]));
    for (const key of owned.keys()) if (!live.has(key)) owned.delete(key);
    let added;
    do {
      added = false;
      for (const row of rows) {
        if (owned.has(identity(row)) || !eligible(row)) continue;
        const parent = [...owned.values()].find(
          (p) =>
            p.pid === row.parentPid &&
            Number(p.startedAt) <= Number(row.startedAt),
        );
        if (parent) {
          owned.set(identity(row), row);
          added = true;
        }
      }
    } while (added);
  }
  async function release() {
    // Commands are serialized: acknowledge handover before dropping ownership.
    await layer.release([...owned.values()]);
    released = true;
    if (timer) unschedule(timer);
    owned.clear();
  }
  async function tick() {
    if (stopped || released || !owned.size) return;
    const snapshot = await layer.snapshot();
    reconcile(snapshot.processes);
    const userStarted = snapshot.processes.some(
      (row) =>
        samePath(row.executablePath, executable) && !owned.has(identity(row)),
    );
    if (snapshot.activated || userStarted) return release();
    // Keep every owned window hidden and throttled for as long as we own it:
    // Antigravity opens extra windows long after start-up.
    await layer.manage([...owned.values()], true, true);
  }
  async function start() {
    if (
      !enabled ||
      stopped ||
      released ||
      attempted ||
      (options.platform ?? process.platform) !== "win32"
    )
      return;
    executable = await options.discover();
    if (stopped || !enabled) return;
    if (
      !executable ||
      !/^Antigravity\.exe$/i.test(path.win32.basename(executable))
    )
      return;
    const snapshot = await layer.snapshot();
    if (
      snapshot.processes.some((row) => samePath(row.executablePath, executable))
    )
      return;
    if (stopped || !enabled) return;
    attempted = true;
    const root = await layer.launch(executable);
    if (!root) return; // The helper repeats the running-instance check at launch.
    owned.set(identity(root), root);
    startedAt = now();
    await tick().catch(() => {}); // The watchdog minimises on native failure.
    if (!stopped && !released && owned.size) {
      timer = schedule(() => {
        if (ticking) return;
        ticking = true;
        void serialize(tick)
          .catch(() => {})
          .finally(() => {
            ticking = false;
          });
      }, 500);
      timer.unref?.();
    }
  }
  async function shutdown() {
    if (closing) return closing;
    stopped = true;
    if (timer) unschedule(timer);
    closing = serialize(async () => {
      if (!released && owned.size) {
        try {
          const snapshot = await layer.snapshot();
          reconcile(snapshot.processes);
          if (
            snapshot.activated ||
            snapshot.processes.some(
              (row) =>
                samePath(row.executablePath, executable) &&
                !owned.has(identity(row)),
            )
          ) {
            await release();
          } else {
            await layer.close([...owned.values()]);
            await sleep(5000);
            const remaining = await layer.snapshot();
            reconcile(remaining.processes);
            if (
              remaining.activated ||
              remaining.processes.some(
                (row) =>
                  samePath(row.executablePath, executable) &&
                  !owned.has(identity(row)),
              )
            )
              await release();
            else await layer.force([...owned.values()]);
          }
        } catch {} // The independent helper still owns its watchdog cleanup.
      }
      await layer.stop?.();
      owned.clear();
    });
    return closing;
  }
  return {
    configure: (value) => {
      enabled = value !== false;
      if (!enabled) return shutdown();
      launching = true;
      return serialize(start)
        .catch(() => {})
        .finally(() => {
          launching = false;
        });
    },
    tick: () => serialize(tick),
    show: () =>
      serialize(async () => {
        if (!owned.size || released) return false;
        await release();
        return true;
      }),
    shutdown,
    state: () => ({
      starting:
        enabled &&
        !released &&
        !stopped &&
        (launching || (owned.size > 0 && now() - startedAt < 60000)),
      managed: owned.size > 0 && !released,
    }),
  };
}
module.exports = { createAntigravityBackground, createWindowsLayer };
