"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { EventEmitter } = require("node:events");
const { PassThrough } = require("node:stream");
const {
  createAntigravityBackground,
  createWindowsLayer,
} = require("../app/dist-electron/antigravity-background.cjs");
const exe = String.raw`C:\Local\Programs\antigravity\Antigravity.exe`;
const server = path.win32.join(
  path.win32.dirname(exe),
  "resources",
  "bin",
  "language_server.exe",
);
const row = (pid, parentPid = 0, executablePath = exe, startedAt = "1000") => ({
  pid,
  parentPid,
  executablePath,
  startedAt,
  name: path.win32.basename(executablePath),
});
function fixture(initial = []) {
  let clock = 0,
    activated = false,
    timer;
  let processes = initial;
  const calls = [],
    windows = new Map(),
    priorities = new Map();
  const layer = {
    snapshot: async () => ({ processes: [...processes], activated }),
    launch: async (executable) => {
      calls.push(["launch", executable]);
      const root = row(10);
      processes.push(root);
      windows.set(10, "visible");
      return root;
    },
    manage: async (targets, hide, throttle) => {
      calls.push(["manage", targets.map((p) => p.pid), hide, throttle]);
      for (const p of targets) {
        if (hide) windows.set(p.pid, "hidden");
        if (throttle) priorities.set(p.pid, "Idle+EcoQoS");
      }
    },
    release: async (targets) => {
      calls.push(["release", targets.map((p) => p.pid)]);
      targets.forEach((p) => {
        windows.set(p.pid, "visible");
        priorities.set(p.pid, "Normal");
      });
    },
    close: async (targets) => calls.push(["close", targets.map((p) => p.pid)]),
    force: async (targets) => {
      calls.push(["force", targets.map((p) => p.pid)]);
      processes = processes.filter(
        (p) =>
          !targets.some((t) => t.pid === p.pid && t.startedAt === p.startedAt),
      );
    },
    stop: async () => calls.push(["stop"]),
  };
  const manager = createAntigravityBackground({
    layer,
    platform: "win32",
    discover: async () => exe,
    now: () => clock,
    setInterval: (callback) => {
      timer = callback;
      return { unref() {} };
    },
    clearInterval: () => {
      timer = undefined;
    },
    sleep: async (ms) => {
      calls.push(["sleep", ms]);
      clock += ms;
    },
  });
  return {
    manager,
    calls,
    windows,
    priorities,
    layer,
    add: (p) => processes.push(p),
    replace: (rows) => {
      processes = rows;
    },
    clock: (value) => {
      clock = value;
    },
    activate: () => {
      activated = true;
    },
    timer: () => timer,
  };
}
test("launch once only when no native app is running; launch layer repeats race check", async () => {
  const f = fixture();
  await Promise.all([f.manager.configure(true), f.manager.configure(true)]);
  assert.deepEqual(
    f.calls.filter((c) => c[0] === "launch"),
    [["launch", exe]],
  );
  const running = fixture([row(80)]);
  await running.manager.configure(true);
  assert.deepEqual(running.calls, []);
  const raced = fixture();
  raced.layer.launch = async () => null;
  await raced.manager.configure(true);
  assert.equal(raced.manager.state().managed, false);
});
test("OFF never queries, hides, throttles or launches Antigravity", async () => {
  const f = fixture([row(80)]);
  await f.manager.configure(false);
  assert.deepEqual(f.calls, [["stop"]]);
});
test("owned windows are re-hidden for as long as they are owned, including late windows", async () => {
  const f = fixture();
  await f.manager.configure(true);
  assert.equal(f.windows.get(10), "hidden");
  f.windows.set(10, "visible");
  f.clock(59999);
  await f.manager.tick();
  assert.equal(f.windows.get(10), "hidden");
  f.windows.set(10, "visible");
  f.clock(6 * 60 * 60 * 1000);
  await f.manager.tick();
  assert.equal(f.windows.get(10), "hidden");
  assert.equal(f.manager.state().starting, false);
});
test("throttle only owned app/server descendants; never agy or a standalone language server", async () => {
  const f = fixture([row(80, 0, server)]);
  await f.manager.configure(true);
  f.add(row(11, 10));
  f.add(row(12, 11, server));
  f.add(row(13, 10, String.raw`C:\Gemini\agy.exe`));
  f.add(row(14, 10, String.raw`C:\Other\Antigravity.exe`));
  await f.manager.tick();
  assert.deepEqual([...f.priorities.keys()].sort(), [10, 11, 12]);
  assert.equal(f.priorities.get(12), "Idle+EcoQoS");
  f.clock(179999);
  await f.manager.tick();
  assert.equal(f.calls.at(-1)[3], true);
  f.clock(180000);
  await f.manager.tick();
  assert.equal(f.calls.at(-1)[3], true); // throttling stays on while owned
});
test("quit requests graceful close then waits five seconds before force close", async () => {
  const f = fixture();
  await f.manager.configure(true);
  f.add(row(11, 10, server));
  await f.manager.shutdown();
  assert.deepEqual(f.calls.slice(-4), [
    ["close", [10, 11]],
    ["sleep", 5000],
    ["force", [10, 11]],
    ["stop"],
  ]);
  assert.equal(f.timer(), undefined);
  await f.manager.shutdown();
  assert.equal(f.calls.filter((c) => c[0] === "close").length, 1);
});
test("processes that exit gracefully are never force killed", async () => {
  const f = fixture();
  await f.manager.configure(true);
  f.layer.close = async () => {
    f.replace([]);
  };
  await f.manager.shutdown();
  assert.deepEqual(
    f.calls.find((c) => c[0] === "force"),
    ["force", []],
  );
});
test("pre-existing user instance is never hidden, throttled, closed or killed", async () => {
  const f = fixture([row(80)]);
  await f.manager.configure(true);
  await f.manager.tick();
  await f.manager.shutdown();
  assert.deepEqual(f.calls, [["stop"]]);
});
test("user launch restores existing windows and scheduling, and relinquishes lifetime", async () => {
  const f = fixture();
  await f.manager.configure(true);
  f.add(row(81));
  await f.manager.tick();
  assert.equal(f.windows.get(10), "visible");
  assert.equal(f.priorities.get(10), "Normal");
  assert.equal(f.manager.state().managed, false);
  await f.manager.shutdown();
  assert.ok(!f.calls.some((c) => ["close", "force"].includes(c[0])));
  assert.deepEqual(
    f.calls.find((c) => c[0] === "release"),
    ["release", [10]],
  );
});
test("activation of reused Electron window hands it over without a second launch", async () => {
  const f = fixture();
  await f.manager.configure(true);
  f.activate();
  await f.manager.tick();
  await f.manager.shutdown();
  assert.equal(f.calls.filter((c) => c[0] === "launch").length, 1);
  assert.ok(!f.calls.some((c) => ["close", "force"].includes(c[0])));
});
test("Open Antigravity explicitly hands over the background copy", async () => {
  const f = fixture();
  await f.manager.configure(true);
  assert.equal(await f.manager.show(), true);
  assert.equal(await f.manager.show(), false);
  await f.manager.shutdown();
  assert.ok(!f.calls.some((c) => ["close", "force"].includes(c[0])));
});
test("PID reuse and a child predating its parent cannot establish ownership", async () => {
  const f = fixture();
  await f.manager.configure(true);
  f.add(row(11, 10, server, "999"));
  await f.manager.tick();
  assert.deepEqual(f.calls.at(-1)[1], [10]);
  f.replace([row(10, 0, exe, "2000")]);
  await f.manager.shutdown();
  assert.ok(!f.calls.some((c) => ["close", "force"].includes(c[0])));
});
test("a user opening during graceful-close deadline is never force killed", async () => {
  const f = fixture();
  await f.manager.configure(true);
  f.layer.close = async (targets) => {
    f.calls.push(["close", targets.map((p) => p.pid)]);
    f.add(row(81));
  };
  await f.manager.shutdown();
  assert.ok(!f.calls.some((c) => c[0] === "force"));
  assert.ok(f.calls.some((c) => c[0] === "release"));
});
test("discovery and native-layer failure do not crash or launch unverified executables", async () => {
  const f = fixture();
  f.layer.snapshot = async () => {
    throw new Error("Access denied");
  };
  await f.manager.configure(true);
  assert.deepEqual(f.calls, []);
  await f.manager.shutdown();
  const manager = createAntigravityBackground({
    platform: "win32",
    discover: async () => String.raw`C:\Gemini\agy.exe`,
    layer: f.layer,
  });
  await manager.configure(true);
  assert.deepEqual(f.calls, [["stop"]]);
});
test("PowerShell stdio adapter uses execFile/windowsHide, unpacks script, and streams without growing execFile buffers", async () => {
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = new PassThrough();
  child.stdout.on("data", () =>
    assert.fail("execFile collector should be removed"),
  );
  child.stderr.on("data", () =>
    assert.fail("execFile collector should be removed"),
  );
  const layer = createWindowsLayer({
    script: path.resolve(
      __dirname,
      "../app/dist-electron/antigravity-background.ps1",
    ),
    execFile: (exe, args, options) => {
      assert.equal(exe, "powershell.exe");
      assert.equal(options.windowsHide, true);
      assert.ok(args.includes("-File"));
      assert.ok(args.includes("-OwnerId"));
      return child;
    },
  });
  child.stdin.on("data", (chunk) => {
    const command = JSON.parse(chunk.toString());
    child.stdout.write(
      JSON.stringify({ id: command.id, ok: true, result: { processes: [] } }) +
        "\n",
    );
  });
  assert.deepEqual(await layer.snapshot(), { processes: [] });
  await layer.stop();
});

test("quitting during discovery cancels the pending background launch", async () => {
  let complete;
  const f = fixture();
  const manager = createAntigravityBackground({
    layer: f.layer,
    platform: "win32",
    discover: () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  });
  const starting = manager.configure(true);
  await Promise.resolve();
  const quitting = manager.shutdown();
  complete(exe);
  await Promise.all([starting, quitting]);
  assert.ok(!f.calls.some((c) => c[0] === "launch"));
});
test("a window-layer failure retries management and retains ownership for cleanup", async () => {
  const f = fixture();
  const manage = f.layer.manage;
  f.layer.manage = async () => {
    throw new Error("Win32 unavailable");
  };
  await f.manager.configure(true);
  assert.ok(f.timer());
  assert.equal(f.manager.state().managed, true);
  f.layer.manage = manage;
  await f.manager.tick();
  assert.equal(f.windows.get(10), "hidden");
  await f.manager.shutdown();
  assert.ok(f.calls.some((c) => c[0] === "force"));
});
test("polling does not queue unlimited snapshots when the native layer is slow", async () => {
  const f = fixture();
  await f.manager.configure(true);
  let complete,
    snapshots = 0;
  f.layer.snapshot = () => {
    snapshots++;
    return new Promise((resolve) => {
      complete = () => resolve({ processes: [row(10)], activated: false });
    });
  };
  const callback = f.timer();
  callback();
  await Promise.resolve();
  await Promise.resolve();
  callback();
  callback();
  callback();
  assert.equal(snapshots, 1);
  complete();
  await new Promise((resolve) => setImmediate(resolve));
});
test("an exited PowerShell helper rejects new commands promptly", async () => {
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = new PassThrough();
  const layer = createWindowsLayer({
    script: path.resolve(
      __dirname,
      "../app/dist-electron/antigravity-background.ps1",
    ),
    execFile: () => child,
  });
  const request = layer.snapshot();
  child.emit("exit", 1);
  await assert.rejects(request, /helper stopped/);
  await assert.rejects(layer.snapshot(), /helper stopped/);
  await layer.stop();
});
