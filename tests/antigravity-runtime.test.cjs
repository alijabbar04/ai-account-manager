const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  createRuntime,
  detectedPlan,
  quotaLimits,
  isNativeServer,
  parseNetstat,
} = require("../app/dist-electron/antigravity-runtime.cjs");

function runtimeFixture(overrides = {}) {
  const calls = [];
  const fixture = {
    platform: "win32",
    path: path.win32,
    env: { LOCALAPPDATA: "C:\\Local" },
    fs: {
      statSync(candidate) {
        if (candidate !== "C:\\Local\\Programs\\Antigravity\\Antigravity.exe")
          throw new Error("Missing");
        return { isFile: () => true };
      },
    },
    listServers: async () => [
      { name: "agy.exe", pid: 10, ports: [3100] },
      {
        name: "Antigravity.exe",
        pid: 20,
        executablePath: "C:\\Local\\Programs\\Antigravity\\Antigravity.exe",
        ports: [3200],
      },
    ],
    spawnDetachedExecutable: (...args) => calls.push(["spawn", ...args]),
    requestLocal: async (service, method) => {
      calls.push([service.port, method]);
      if (!method)
        return '<script>window.__APP_CONFIG__ = {"productName":"antigravity","csrfToken":"test-csrf"};</script>';
      if (method === "HasAuthToken") return { hasToken: true };
      if (method === "GetAuthStatus")
        return {
          authResult: { hasValidAuth: true, grantedScopes: ["private-scope"] },
        };
      if (method === "GetUserStatus")
        return {
          userStatus: {
            email: "person@example.test",
            userTier: { name: "Google AI Pro" },
            accessToken: "private-access",
            profilePictureUrl: "private-picture",
          },
        };
      if (method === "GetLoadCodeAssist")
        return {
          response: {
            paidTier: { name: "Google AI Pro" },
            allowedTiers: [{ name: "Google AI Ultra" }],
          },
        };
      if (method === "RetrieveUserQuotaSummary")
        return {
          response: {
            groups: [
              {
                displayName: "Gemini models",
                buckets: [
                  {
                    window: "weekly",
                    remainingFraction: 0.65,
                    resetTime: "2026-10-08T12:00:00Z",
                  },
                  { window: "5h", remainingFraction: 1 },
                ],
              },
            ],
          },
        };
      if (method === "Login") return { authResult: {} };
      throw new Error("Unexpected method");
    },
    ...overrides,
  };
  return { runtime: createRuntime(fixture), calls, fixture };
}

test("native Antigravity account and quotas are read without exposing credentials", async () => {
  const { runtime, calls } = runtimeFixture();
  const status = await runtime.status();
  assert.equal(status.loggedIn, true);
  assert.equal(status.account.planLabel, "Google AI Pro");
  assert.equal(status.account.email, "person@example.test");
  assert.equal(status.limits[0].usedPercent, 35);
  assert.equal(
    status.limits[0].resetsAt,
    Date.parse("2026-10-08T12:00:00Z") / 1000,
  );
  assert.ok(calls.every(([port]) => port === 3200));
  assert.doesNotMatch(
    JSON.stringify(status),
    /private-|csrf|Token|grantedScopes/,
  );
});

test("plan changes are detected on every refresh rather than inferred from upgrade options", async () => {
  let plan = "Google AI Pro";
  const { fixture } = runtimeFixture();
  const original = fixture.requestLocal;
  const runtime = createRuntime({
    ...fixture,
    requestLocal: async (service, method, body) => {
      if (method === "GetLoadCodeAssist") {
        assert.equal(body.forceRefresh, true);
        return {
          response: {
            paidTier: { name: plan },
            allowedTiers: [{ name: "Enterprise" }],
          },
        };
      }
      return original(service, method, body);
    },
  });
  assert.equal((await runtime.status()).account.planLabel, "Google AI Pro");
  plan = "Google AI Ultra";
  assert.equal((await runtime.status()).account.planLabel, "Google AI Ultra");
});

test("signed-out native app is not mistaken for a signed-in extension", async () => {
  const { fixture } = runtimeFixture();
  const original = fixture.requestLocal;
  const runtime = createRuntime({
    ...fixture,
    requestLocal: (service, method, body) =>
      method === "HasAuthToken"
        ? { hasToken: false }
        : original(service, method, body),
  });
  const status = await runtime.status();
  assert.equal(status.loggedIn, false);
  assert.equal(status.account, null);
  assert.equal(status.usageAvailable, false);
  assert.deepEqual(status.limits, []);
});

test("an extension alone neither substitutes account data nor opens VS Code", async () => {
  const { runtime, calls } = runtimeFixture({
    listServers: async () => [{ name: "agy.exe", ports: [3100] }],
    fs: {
      statSync() {
        throw new Error("Missing");
      },
    },
    execFile: (_exe, _args, _options, callback) => callback(null, "[]"),
  });
  const status = await runtime.status();
  assert.equal(status.nativeInstalled, false);
  assert.equal(status.loggedIn, null);
  assert.equal((await runtime.launch()).ok, false);
  assert.deepEqual(calls, []);
});

test("native app launching and sign-in use the real app and its Login RPC", async () => {
  const { runtime, calls } = runtimeFixture();
  assert.deepEqual(await runtime.launch(), { ok: true });
  const result = await runtime.signIn();
  assert.deepEqual(result, { ok: true, pending: true });
  assert.equal(
    calls.find(([first]) => first === "spawn")[1],
    "C:\\Local\\Programs\\Antigravity\\Antigravity.exe",
  );
  assert.deepEqual(calls.find(([first]) => first === "spawn")[2], []);
  assert.ok(
    calls.some(([port, method]) => port === 3200 && method === "Login"),
  );
});

test("service discovery rejects foreign product pages and invalid local ports", async () => {
  const ports = [];
  const { runtime } = runtimeFixture({
    listServers: async () => [
      {
        name: "Antigravity.exe",
        pid: 20,
        executablePath: "C:\\Local\\Programs\\Antigravity\\Antigravity.exe",
        ports: [-1, 65536, 3400],
      },
    ],
    requestLocal: async (service) => {
      ports.push(service.port);
      return '<script>window.__APP_CONFIG__ = {"productName":"other","csrfToken":"private"};</script>';
    },
  });
  assert.equal((await runtime.status()).loggedIn, null);
  assert.deepEqual(ports, [3400, 3400]);
});

test("unknown plans remain unknown; quota fractions map correctly and disabled windows are omitted", () => {
  assert.equal(
    detectedPlan({}, { allowedTiers: [{ name: "Google AI Ultra" }] }),
    null,
  );
  assert.equal(
    detectedPlan({ userTier: { id: "g1-pro-tier" } }),
    "Google AI Pro",
  );
  assert.equal(
    detectedPlan(
      { userTier: { name: "Google AI Pro" } },
      { paidTier: { id: "g1-ultra-tier" } },
    ),
    "Google AI Ultra",
  );
  const rows = quotaLimits({
    groups: [
      {
        displayName: "Claude and GPT",
        buckets: [
          { window: "weekly", remainingFraction: 0 },
          { window: "5h", remainingFraction: 1, disabled: true },
          { window: "5h" },
        ],
      },
    ],
  });
  assert.deepEqual(rows, [
    { label: "Claude and GPT · Weekly", usedPercent: 100 },
  ]);
});

test("failed authentication checks never promote cached account details to signed-in", async () => {
  const { fixture } = runtimeFixture();
  const original = fixture.requestLocal;
  const runtime = createRuntime({
    ...fixture,
    requestLocal: (service, method, body) => {
      if (method === "GetAuthStatus") throw new Error("Temporarily offline");
      return original(service, method, body);
    },
  });
  const status = await runtime.status();
  assert.equal(status.loggedIn, null);
  assert.equal(status.account, null);
  assert.equal(status.usageAvailable, false);
  assert.deepEqual(status.limits, []);
});

const nativePath = "C:\\Local\\Programs\\antigravity\\Antigravity.exe";
function nativeProcess(ports = [50335, 50337], pid = 100) {
  return { name: "Antigravity.exe", pid, executablePath: nativePath, ports };
}

test("Get-Process and netstat discover only native PID-owned loopback listeners", async () => {
  const commands = [];
  const { fixture, calls } = runtimeFixture();
  const original = fixture.requestLocal;
  const runtime = createRuntime({
    ...fixture,
    listServers: undefined,
    execFile: (exe, args, _options, callback) => {
      commands.push([exe, args]);
      if (exe === "powershell.exe") {
        assert.match(args.at(-1), /Get-Process/);
        assert.match(args.at(-1), /MainWindowTitle/);
        assert.doesNotMatch(
          args.at(-1),
          /CimInstance|NetTCPConnection|Add-Type/,
        );
        return callback(
          null,
          JSON.stringify([
            ...Array.from({ length: 6 }, (_, i) => ({
              Name: "Antigravity.exe",
              ProcessId: 100 + i,
              ExecutablePath: nativePath,
              MainWindowTitle: i ? "" : "Antigravity",
            })),
            {
              Name: "agy.exe",
              ProcessId: 200,
              ExecutablePath: "C:\\Users\\Ali\\.gemini\\bin\\agy.exe",
            },
            {
              Name: "Antigravity.exe",
              ProcessId: 300,
              ExecutablePath: "C:\\Other\\Antigravity.exe",
            },
            { Name: "Antigravity.exe", ProcessId: 400 },
          ]),
        );
      }
      assert.equal(exe, "netstat.exe");
      assert.deepEqual(args, ["-ano", "-p", "tcp"]);
      callback(
        null,
        [
          " TCP 127.0.0.1:50335 0.0.0.0:0 LISTENING 100",
          " TCP 127.0.0.1:50337 0.0.0.0:0 LISTENING 100",
          " TCP 127.0.0.1:54052 0.0.0.0:0 LISTENING 200",
          " TCP 127.0.0.1:55000 0.0.0.0:0 LISTENING 300",
          " TCP 127.0.0.1:55001 0.0.0.0:0 LISTENING 400",
          " TCP 0.0.0.0:55002 0.0.0.0:0 LISTENING 100",
          " TCP 192.168.1.2:55003 0.0.0.0:0 LISTENING 100",
          " TCP 127.0.0.1:55004 0.0.0.0:0 ESTABLISHED 100",
        ].join("\r\n"),
      );
    },
    requestLocal: (service, method, body) => {
      if (service.port === 50335) {
        calls.push([service.port, method]);
        throw new Error("Host bridge requires separate bearer token");
      }
      return original(service, method, body);
    },
  });
  const status = await runtime.status();
  assert.equal(status.loggedIn, true);
  assert.equal(status.account.planLabel, "Google AI Pro");
  assert.ok(commands.length > 0);
  assert.ok(calls.every(([port]) => [50335, 50337].includes(port)));
});

test("netstat accepts IPv4/IPv6 loopback only and ignores malformed listeners", () => {
  const rows = parseNetstat(
    [
      " TCP 127.0.0.1:50335 0.0.0.0:0 LISTENING 100",
      " TCP [::1]:50337 [::]:0 LISTENING 100",
      " TCP [::]:50338 [::]:0 LISTENING 100",
      " TCP 0.0.0.0:50339 0.0.0.0:0 LISTENING 100",
      " TCP 127.0.0.1:65536 0.0.0.0:0 LISTENING 100",
      " TCP 127.0.0.1:0 0.0.0.0:0 LISTENING 100",
      " UDP 127.0.0.1:50340 *:* 100",
    ].join("\n"),
  );
  assert.deepEqual(
    rows.map((r) => [r.LocalPort, r.LocalAddress]),
    [
      [50335, "127.0.0.1"],
      [50337, "::1"],
    ],
  );
});

test("agy remains excluded even with a native ancestor and branded page", async () => {
  const app = nativeProcess([]);
  const agy = {
    name: "agy.exe",
    pid: 102,
    parentPid: 100,
    executablePath: "C:\\Gemini\\agy.exe",
    ports: [3300],
    commandLine: "--hub-port=3300 --app_data_dir=antigravity",
  };
  assert.equal(isNativeServer(agy, [app, agy], nativePath), false);
  const { runtime, calls } = runtimeFixture({
    listServers: async () => [app, agy],
  });
  assert.equal((await runtime.status()).loggedIn, null);
  assert.deepEqual(calls, []);
});

test("foreign paths, unreadable paths, and language servers cannot supply native accounts", async () => {
  const { runtime, calls } = runtimeFixture({
    listServers: async () => [
      {
        ...nativeProcess([3400]),
        executablePath:
          "C:\\Local\\Programs\\antigravity-other\\Antigravity.exe",
      },
      { ...nativeProcess([3500]), executablePath: undefined },
      { name: "language_server.exe", ports: [3600] },
    ],
  });
  assert.equal((await runtime.status()).loggedIn, null);
  assert.deepEqual(calls, []);
});

test("a path-verified running native process proves installation when file access is denied", async () => {
  const { runtime } = runtimeFixture({
    fs: {
      statSync() {
        throw new Error("Access denied");
      },
    },
    execFile: (_exe, _args, _opts, cb) => cb(null, "[]"),
    listServers: async () => [nativeProcess([3200])],
  });
  assert.equal((await runtime.status()).nativeInstalled, true);
  assert.equal((await runtime.status()).loggedIn, true);
});

test("native name/path matching is case insensitive but does not accept other executables", () => {
  assert.equal(
    isNativeServer(
      { name: "ANTIGRAVITY", executablePath: nativePath.toUpperCase() },
      [],
      nativePath,
    ),
    true,
  );
  assert.equal(
    isNativeServer(
      { name: "agy.exe", executablePath: nativePath },
      [],
      nativePath,
    ),
    false,
  );
});

test("the port answering account RPC is preferred after a discovery refresh", async () => {
  let clock = 1000;
  const { fixture, calls } = runtimeFixture({
    now: () => clock,
    listServers: async () => [nativeProcess()],
  });
  const original = fixture.requestLocal;
  const runtime = createRuntime({
    ...fixture,
    requestLocal: (service, method, body) => {
      if (service.port === 50335) {
        calls.push([service.port, method]);
        throw new Error("Not account RPC");
      }
      return original(service, method, body);
    },
  });
  assert.equal((await runtime.status()).loggedIn, true);
  calls.length = 0;
  clock += 16000;
  assert.equal((await runtime.status()).loggedIn, true);
  assert.ok(calls.every(([port]) => port === 50337));
});

test("a branded root without account RPC cannot shadow the working native port", async () => {
  const { fixture, calls } = runtimeFixture({
    listServers: async () => [nativeProcess()],
  });
  const original = fixture.requestLocal;
  const runtime = createRuntime({
    ...fixture,
    requestLocal: (service, method, body) => {
      if (service.port === 50335 && method) {
        calls.push([service.port, method]);
        throw new Error("No account RPC");
      }
      return original(service, method, body);
    },
  });
  assert.equal((await runtime.status()).loggedIn, true);
  assert.ok(
    calls.some(
      ([port, method]) => port === 50337 && method === "GetUserStatus",
    ),
  );
});

test("success, transient RPC failure, missing process, recovery, and expiry do not flap", async () => {
  let clock = 1000,
    mode = "good";
  const { fixture, calls } = runtimeFixture({ now: () => clock });
  const original = fixture.requestLocal;
  const runtime = createRuntime({
    ...fixture,
    listServers: async () =>
      mode === "missing"
        ? [{ name: "agy.exe", ports: [3100] }]
        : [nativeProcess([3200])],
    requestLocal: (service, method, body) => {
      if (mode === "failure") throw new Error("Transient failure");
      return original(service, method, body);
    },
  });
  const good = await runtime.status();
  mode = "failure";
  clock += 20000;
  const failed = await runtime.status();
  assert.equal(failed.loggedIn, true);
  assert.equal(failed.stale, true);
  assert.deepEqual(failed.account, good.account);
  assert.deepEqual(failed.limits, good.limits);
  assert.equal(failed.updatedAt, good.updatedAt);
  mode = "missing";
  clock += 60000;
  assert.equal((await runtime.status()).loggedIn, true);
  assert.ok(calls.every(([port]) => port === 3200));
  mode = "good";
  clock += 20000;
  assert.equal((await runtime.status()).stale, undefined);
  mode = "failure";
  clock += 180000;
  const expired = await runtime.status();
  assert.equal(expired.loggedIn, null);
  assert.equal(expired.account, null);
});

test("explicit native sign-out immediately clears last good authentication", async () => {
  let signedOut = false,
    failure = false;
  const { fixture } = runtimeFixture();
  const original = fixture.requestLocal;
  const runtime = createRuntime({
    ...fixture,
    requestLocal: (service, method, body) => {
      if (failure) throw new Error("Offline");
      if (signedOut && method === "HasAuthToken") return { hasToken: false };
      return original(service, method, body);
    },
  });
  assert.equal((await runtime.status()).loggedIn, true);
  signedOut = true;
  assert.equal((await runtime.status()).loggedIn, false);
  failure = true;
  assert.equal((await runtime.status()).loggedIn, null);
});

test("partial metadata failure preserves last verified account and quotas without renewing expiry", async () => {
  let clock = 1000,
    fail = false;
  const { fixture } = runtimeFixture({ now: () => clock });
  const original = fixture.requestLocal;
  const runtime = createRuntime({
    ...fixture,
    requestLocal: (service, method, body) => {
      if (
        fail &&
        [
          "GetUserStatus",
          "GetLoadCodeAssist",
          "RetrieveUserQuotaSummary",
        ].includes(method)
      )
        throw new Error("Offline");
      return original(service, method, body);
    },
  });
  const good = await runtime.status();
  fail = true;
  clock += 30000;
  assert.deepEqual((await runtime.status()).account, good.account);
  clock += 150000;
  assert.equal((await runtime.status()).account.planLabel, null);
});

test("cached PID/port reused by agy is never probed or used to overwrite native state", async () => {
  let reused = false,
    clock = 1000;
  const { runtime, calls } = runtimeFixture({
    now: () => clock,
    listServers: async () =>
      reused
        ? [{ name: "agy.exe", pid: 100, ports: [3200] }]
        : [nativeProcess([3200])],
  });
  assert.equal((await runtime.status()).loggedIn, true);
  reused = true;
  clock += 1000;
  calls.length = 0;
  assert.equal((await runtime.status()).stale, true);
  assert.deepEqual(calls, []);
});

test("changed launch ports are rediscovered and only the new native account is returned", async () => {
  let restarted = false;
  const { runtime, calls } = runtimeFixture({
    listServers: async () => [
      nativeProcess(restarted ? [51000, 51002] : [3200], restarted ? 101 : 100),
    ],
  });
  assert.equal((await runtime.status()).loggedIn, true);
  restarted = true;
  calls.length = 0;
  assert.equal((await runtime.status()).loggedIn, true);
  assert.ok(calls.every(([port]) => port === 51000));
});

test("overlapping status requests share a native probe and result", async () => {
  const { runtime, calls } = runtimeFixture();
  const [a, b] = await Promise.all([runtime.status(), runtime.status()]);
  assert.deepEqual(a, b);
  assert.equal(
    calls.filter(([, method]) => method === "HasAuthToken").length,
    1,
  );
});

test("newer Antigravity: bundled language_server inside the install folder is native; elsewhere it is not", () => {
  const app = String.raw`C:\Users\u\AppData\Local\Programs\Antigravity\Antigravity.exe`;
  const bundled = { name: "language_server.exe", executablePath: String.raw`C:\Users\u\AppData\Local\Programs\Antigravity\resources\bin\language_server.exe` };
  const stray = { name: "language_server.exe", executablePath: String.raw`C:\Temp\resources\bin\language_server.exe` };
  const agy = { name: "agy.exe", executablePath: String.raw`C:\Users\u\.gemini\bin\agy.exe` };
  assert.equal(isNativeServer(bundled, [], app), true);
  assert.equal(isNativeServer(stray, [], app), false);
  assert.equal(isNativeServer(agy, [], app), false);
});
