const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_PHONE_PORT,
  buildPairingLink,
  buildPhoneSnapshot,
  createPairingCode,
  findTailscaleAddress,
  formatPairingCode,
  isTailscaleIPv4,
  normalizePairingCode,
  normalizePhoneSettings,
  sanitizeDeviceName,
  tokensEqual,
} = require("../app/dist-electron/phone-domain.cjs");

const now = Date.parse("2026-09-28T10:00:00Z");

function claudeState(id, role, fields = {}) {
  return {
    profile: {
      id,
      name: role === "work" ? "Work Example" : "Personal Example",
      configDir: `C:\\Profiles\\${id}`,
    },
    identity: {
      loggedIn: true,
      email: `${role}@example.test`,
      planLabel: role === "work" ? "Team Premium" : "Max 20x",
      accessToken: "must-never-leave",
    },
    usage: {
      ok: true,
      fetchedAt: now - 60_000,
      limits: [
        {
          kind: "weekly_scoped",
          modelName: "Fable",
          percent: 49,
          severity: "normal",
          resetsAt: "2026-09-29T06:26:00Z",
        },
        {
          kind: "session",
          percent: 4,
          severity: "normal",
          resetsAt: "2026-09-28T13:46:00Z",
        },
        {
          kind: "weekly_all",
          percent: 83,
          severity: "normal",
          resetsAt: "2026-09-29T06:26:00Z",
        },
      ],
      extra: {
        enabled: true,
        usedCredits: 729,
        currency: "GBP",
        decimalPlaces: 2,
      },
    },
    isDefault: role === "work",
    dashboardRole: role,
    hidden: false,
    ...fields,
  };
}

const gptUsage = {
  ok: true,
  fetchedAt: now - 30_000,
  account: { email: "codex@example.test", planType: "pro" },
  rateLimits: {
    rateLimits: {
      limitId: "codex",
      primary: {
        usedPercent: 26,
        windowDurationMins: 10080,
        resetsAt: 1790600000,
      },
    },
  },
};

test("the snapshot holds the dashboard's three accounts and no secrets", () => {
  const snapshot = buildPhoneSnapshot({
    states: [
      claudeState("other", "other", { dashboardRole: null, isDefault: false }),
      claudeState("personal", "personal"),
      claudeState("work", "work"),
    ],
    gptUsage,
    now,
    hostName: "DESK",
  });
  assert.equal(snapshot.v, 1);
  assert.equal(snapshot.host, "DESK");
  assert.deepEqual(
    snapshot.accounts.map((account) => `${account.provider}:${account.role}`),
    ["claude:work", "claude:personal", "gpt:null"],
  );
  const json = JSON.stringify(snapshot);
  assert.ok(!json.includes("must-never-leave"), "tokens stay on the PC");
  assert.ok(!json.includes("Profiles"), "config paths stay on the PC");
});

test("Claude limits are labelled and ordered like the desktop cards", () => {
  const [work] = buildPhoneSnapshot({
    states: [claudeState("work", "work")],
    gptUsage: null,
    now,
  }).accounts;
  assert.equal(work.plan, "Team Premium");
  assert.deepEqual(
    work.limits.map((limit) => limit.label),
    ["Session (5h)", "Weekly · all models", "Weekly · Fable"],
  );
  assert.equal(work.limits[0].resetsAt, Date.parse("2026-09-28T13:46:00Z"));
  assert.equal(work.limits[1].severity, "warn");
  assert.deepEqual(work.status, { kind: "warn", label: "Usage high" });
  assert.deepEqual(work.extra, {
    usedCredits: 729,
    currency: "GBP",
    decimalPlaces: 2,
  });
});

test("GPT windows convert reset seconds to milliseconds", () => {
  const gpt = buildPhoneSnapshot({ states: [], gptUsage, now }).accounts[0];
  assert.equal(gpt.plan, "Pro");
  assert.equal(gpt.email, "codex@example.test");
  assert.deepEqual(gpt.limits, [
    {
      label: "Codex · Weekly window",
      percent: 26,
      resetsAt: 1790600000 * 1000,
      severity: "ok",
    },
  ]);
});

test("a failed or missing GPT read is reported, not invented", () => {
  const failed = buildPhoneSnapshot({
    states: [],
    gptUsage: { ok: false, error: "Codex is not signed in." },
    now,
  }).accounts[0];
  assert.equal(failed.error, "Codex is not signed in.");
  assert.deepEqual(failed.limits, []);
  const loading = buildPhoneSnapshot({ states: [], gptUsage: null, now })
    .accounts[0];
  assert.deepEqual(loading.status, { kind: "unknown", label: "Loading" });
});

test("hidden and signed-out profiles are handled like the dashboard", () => {
  const snapshot = buildPhoneSnapshot({
    states: [
      claudeState("work", "work", { hidden: true }),
      claudeState("personal", "personal", {
        identity: { loggedIn: false },
        usage: null,
      }),
    ],
    gptUsage: null,
    now,
  });
  assert.deepEqual(
    snapshot.accounts.map((account) => account.id),
    ["personal", "gpt"],
  );
  assert.deepEqual(snapshot.accounts[0].status, {
    kind: "off",
    label: "Logged out",
  });
});

test("only Tailscale's 100.64.0.0/10 range counts as a tailnet address", () => {
  assert.equal(isTailscaleIPv4("100.101.102.103"), true);
  assert.equal(isTailscaleIPv4("::ffff:100.64.0.1"), true);
  assert.equal(isTailscaleIPv4("100.127.255.255"), true);
  assert.equal(isTailscaleIPv4("100.128.0.1"), false);
  assert.equal(isTailscaleIPv4("100.63.0.1"), false);
  assert.equal(isTailscaleIPv4("192.168.1.10"), false);
  assert.equal(isTailscaleIPv4("127.0.0.1"), false);
  assert.equal(isTailscaleIPv4("100.64.0.999"), false);
  assert.equal(isTailscaleIPv4(undefined), false);
});

test("the Tailscale adapter's IPv4 address is preferred", () => {
  assert.equal(
    findTailscaleAddress({
      Ethernet: [{ family: "IPv4", address: "192.168.1.4", internal: false }],
      Other: [{ family: "IPv4", address: "100.70.0.2", internal: false }],
      Tailscale: [
        { family: "IPv6", address: "fd7a:115c:a1e0::1", internal: false },
        { family: "IPv4", address: "100.101.102.103", internal: false },
      ],
    }),
    "100.101.102.103",
  );
  assert.equal(
    findTailscaleAddress({
      Ethernet: [{ family: "IPv4", address: "10.0.0.2", internal: false }],
    }),
    null,
  );
});

test("pairing codes are 8 unambiguous characters and tolerate formatting", () => {
  const code = createPairingCode();
  assert.match(code, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.equal(
    createPairingCode(() => Buffer.from([0, 31, 32, 63, 1, 2, 3, 4])),
    "A9A9BCDE",
  );
  assert.equal(formatPairingCode("K7QXM2PA"), "K7QX-M2PA");
  assert.equal(normalizePairingCode(" k7qx-m2pa "), "K7QXM2PA");
  assert.equal(
    normalizePairingCode("K7QXM2P0"),
    null,
    "0 is not in the alphabet",
  );
  assert.equal(normalizePairingCode("K7QX"), null);
  assert.equal(normalizePairingCode(42), null);
});

test("device tokens compare in constant time and reject mismatches", () => {
  assert.equal(tokensEqual("abc123", "abc123"), true);
  assert.equal(tokensEqual("abc123", "abc124"), false);
  assert.equal(tokensEqual("abc123", "abc1234"), false);
  assert.equal(tokensEqual(null, "abc123"), false);
});

test("pairing links and settings are normalized defensively", () => {
  assert.equal(
    buildPairingLink({ host: "100.101.102.103", port: 47821, code: "K7QXM2PA" }),
    "aamusage://pair?host=100.101.102.103&port=47821&code=K7QXM2PA",
  );
  assert.deepEqual(normalizePhoneSettings(undefined), {
    enabled: false,
    keepRunning: true,
    port: DEFAULT_PHONE_PORT,
    device: null,
  });
  assert.equal(normalizePhoneSettings({ port: 80 }).port, DEFAULT_PHONE_PORT);
  assert.equal(
    normalizePhoneSettings({ device: { name: "Phone" } }).device,
    null,
    "a device without its stored secret is not paired",
  );
  assert.equal(sanitizeDeviceName("Galaxy\u0000 S25\n"), "Galaxy S25");
  assert.equal(sanitizeDeviceName(""), "Phone");
});
