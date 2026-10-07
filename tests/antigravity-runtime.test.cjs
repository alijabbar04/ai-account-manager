const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  createRuntime,
  detectedPlan,
  quotaLimits,
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
      {
        name: "agy.exe",
        commandLine: "--hub --app_data_dir=antigravity --hub-port=3100",
        ports: [3100],
      },
      { name: "language_server.exe", ports: [3200] },
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
      { name: "language_server.exe", ports: [-1, 65536, 3400] },
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
