const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  READER_ID,
  UsageReaderError,
  createScopedUsageReader,
  readScopedUsage,
} = require("../reader/usage-reader.cjs");
const exportedReader = require("ai-account-manager-desktop/usage-reader");

const NOW = Date.parse("2026-08-12T00:00:00.000Z");
const PROFILE_ID = "profile-owned-1";

function request(directory, overrides = {}) {
  return {
    schemaVersion: 1,
    dataDirectory: directory,
    requestedProfileId: PROFILE_ID,
    profileAllowlist: [
      {
        profileId: PROFILE_ID,
        providerId: "claude-code",
        ownership: "owned",
        authorization: "authorized",
        revocation: "not-revoked",
      },
    ],
    freshnessMs: 300_000,
    ...overrides,
  };
}

function snapshots(overrides = {}) {
  return {
    [PROFILE_ID]: {
      fetchedAt: Date.parse("2026-08-11T23:59:00.000Z"),
      ok: true,
      limits: [
        {
          kind: "session",
          percent: 12.34,
          severity: "normal",
          resetsAt: "2026-08-12T04:00:00.000Z",
        },
        {
          kind: "weekly_all",
          percent: 55,
          severity: "normal",
          resetsAt: "2026-08-17T00:00:00.000Z",
        },
      ],
      ...overrides,
    },
  };
}

function fixture(t, snapshot = snapshots()) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "am-reader-test-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(directory, "profiles.json"),
    JSON.stringify({
      version: 1,
      profiles: [
        {
          id: PROFILE_ID,
          name: "must-not-leak",
          configDir: "C:\\secret-profile-path",
          createdAt: "2026-08-01T00:00:00.000Z",
        },
      ],
    }),
  );
  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    JSON.stringify(snapshot),
  );
  return directory;
}

function expectCode(code, action) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof UsageReaderError);
    assert.equal(error.code, code);
    assert.equal(JSON.stringify(error).includes("secret"), false);
    return true;
  });
}

test("emits one bounded authoritative profile projection without sensitive fields", (t) => {
  const directory = fixture(t);
  const result = readScopedUsage(request(directory), { now: () => NOW });
  assert.deepEqual(Object.keys(result).sort(), [
    "observation",
    "profile",
    "reader",
    "requestedProfileId",
    "schemaVersion",
  ]);
  assert.deepEqual(Object.keys(result.reader).sort(), [
    "configurationFingerprint",
    "protocolVersion",
    "readerId",
    "repositoryUrl",
    "runtimeVersion",
  ]);
  assert.deepEqual(Object.keys(result.profile).sort(), [
    "authorityEstimate",
    "authorization",
    "ownership",
    "providerId",
    "revocation",
    "scopedProfileId",
  ]);
  assert.deepEqual(Object.keys(result.observation).sort(), [
    "confidence",
    "fiveHour",
    "freshUntil",
    "observationId",
    "observedAt",
    "sourceClass",
    "timezone",
    "weekly",
  ]);
  assert.equal(result.reader.readerId, READER_ID);
  assert.equal(result.reader.protocolVersion, 1);
  assert.match(result.reader.configurationFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(result.profile.scopedProfileId, PROFILE_ID);
  assert.equal(result.profile.authorityEstimate, "caller-allowlist");
  assert.equal(result.observation.sourceClass, "provider-authoritative");
  assert.equal(result.observation.confidence, "high");
  assert.deepEqual(result.observation.fiveHour, {
    windowId: "claude-code:five-hour:2026-08-12T04:00:00.000Z",
    usedBasisPoints: 1234,
    remainingBasisPoints: 8766,
    resetAt: "2026-08-12T04:00:00.000Z",
  });
  assert.equal(result.observation.weekly.usedBasisPoints, 5500);
  assert.equal(result.observation.weekly.remainingBasisPoints, 4500);
  assert.equal(result.observation.observedAt, "2026-08-11T23:59:00.000Z");
  assert.equal(result.observation.freshUntil, "2026-08-12T00:04:00.000Z");
  const serialized = JSON.stringify(result);
  for (const forbidden of [
    "must-not-leak",
    "secret-profile-path",
    "configDir",
    "accessToken",
    "refreshToken",
    "cookie",
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("labels retained limits from a failed refresh as cached and low confidence", (t) => {
  const directory = fixture(
    t,
    snapshots({ ok: false, error: "provider body must not leak" }),
  );
  const result = readScopedUsage(request(directory), { now: () => NOW });
  assert.equal(result.observation.sourceClass, "provider-cached");
  assert.equal(result.observation.confidence, "low");
  assert.equal(JSON.stringify(result).includes("provider body"), false);
});

test("requires an exact explicit profile allowlist and independent authority fields", (t) => {
  const directory = fixture(t);
  expectCode("PROFILE_NOT_ALLOWED", () =>
    readScopedUsage(
      request(directory, {
        requestedProfileId: "profile-other",
      }),
      { now: () => NOW },
    ),
  );
  expectCode("INVALID_REQUEST", () =>
    readScopedUsage(
      request(directory, {
        profileAllowlist: [
          request(directory).profileAllowlist[0],
          request(directory).profileAllowlist[0],
        ],
      }),
      { now: () => NOW },
    ),
  );
});

test("fails closed for absent, duplicate, malformed, future, and contradictory data", (t) => {
  const directory = fixture(t);
  fs.writeFileSync(
    path.join(directory, "profiles.json"),
    JSON.stringify({ version: 1, profiles: [] }),
  );
  expectCode("PROFILE_NOT_FOUND", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );

  fs.writeFileSync(
    path.join(directory, "profiles.json"),
    JSON.stringify({
      version: 1,
      profiles: [{ id: PROFILE_ID }, { id: PROFILE_ID }],
    }),
  );
  expectCode("SNAPSHOT_AMBIGUOUS", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );

  fs.writeFileSync(
    path.join(directory, "profiles.json"),
    JSON.stringify({ version: 1, profiles: [{ id: PROFILE_ID }] }),
  );
  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    JSON.stringify(snapshots({ fetchedAt: NOW + 60_000 })),
  );
  expectCode("SNAPSHOT_INVALID", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );

  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    JSON.stringify(snapshots({ ok: true, error: "contradictory failure" })),
  );
  expectCode("SNAPSHOT_INVALID", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );

  const inactive = snapshots();
  inactive[PROFILE_ID].limits[0].isActive = false;
  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    JSON.stringify(inactive),
  );
  expectCode("SNAPSHOT_INVALID", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );

  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    JSON.stringify(snapshots({ fetchedAt: 9e15 })),
  );
  expectCode("SNAPSHOT_INVALID", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );

  const duplicate = snapshots();
  duplicate[PROFILE_ID].limits.push({
    kind: "weekly_all",
    percent: 10,
    resetsAt: "2026-08-18T00:00:00.000Z",
  });
  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    JSON.stringify(duplicate),
  );
  expectCode("SNAPSHOT_AMBIGUOUS", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );

  const negative = snapshots();
  negative[PROFILE_ID].limits[0].percent = -1;
  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    JSON.stringify(negative),
  );
  expectCode("SNAPSHOT_INVALID", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );
});

test("rejects oversized files, extra request keys, accessors, and symbolic sources", (t) => {
  const directory = fixture(t);
  expectCode("INVALID_REQUEST", () =>
    readScopedUsage({ ...request(directory), secretCanary: true }, { now: () => NOW }),
  );
  const accessor = request(directory);
  Object.defineProperty(accessor, "secretCanary", {
    enumerable: true,
    get() {
      throw new Error("must not run");
    },
  });
  expectCode("INVALID_REQUEST", () =>
    readScopedUsage(accessor, { now: () => NOW }),
  );

  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    " ".repeat(1024 * 1024 + 1),
  );
  expectCode("SOURCE_TOO_LARGE", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );

  const linked = `${directory}-linked`;
  try {
    fs.symlinkSync(directory, linked, "junction");
    t.after(() => fs.rmSync(linked, { recursive: true, force: true }));
    expectCode("SOURCE_UNAVAILABLE", () =>
      readScopedUsage(request(linked), { now: () => NOW }),
    );
  } catch (error) {
    if (error?.code !== "EPERM") throw error;
    t.skip("junction creation is not permitted by this Windows account");
  }
});

test("rejects UNC and device paths before any filesystem access", () => {
  const original = fs.lstatSync;
  let filesystemCalls = 0;
  fs.lstatSync = (...args) => {
    filesystemCalls += 1;
    return original(...args);
  };
  try {
    for (const directory of [
      "\\\\server\\share\\account-manager",
      "\\\\?\\UNC\\server\\share\\account-manager",
      "//server/share/account-manager",
    ]) {
      expectCode("INVALID_REQUEST", () =>
        readScopedUsage(request(directory), { now: () => NOW }),
      );
    }
    assert.equal(filesystemCalls, 0);
  } finally {
    fs.lstatSync = original;
  }
});

test("binds reads to one file identity and one coherent profile projection", (t) => {
  const directory = fixture(t);
  const originalOpen = fs.openSync;
  let swapped = false;
  fs.openSync = (target, ...args) => {
    if (!swapped && path.basename(target) === "usage-snapshots.json") {
      swapped = true;
      const prior = `${target}.prior`;
      fs.renameSync(target, prior);
      fs.writeFileSync(target, JSON.stringify(snapshots()));
    }
    return originalOpen(target, ...args);
  };
  try {
    expectCode("SOURCE_UNAVAILABLE", () =>
      readScopedUsage(request(directory), { now: () => NOW }),
    );
  } finally {
    fs.openSync = originalOpen;
  }

  const coherentDirectory = fixture(t);
  let changed = false;
  fs.openSync = (target, ...args) => {
    if (!changed && path.basename(target) === "usage-snapshots.json") {
      changed = true;
      fs.writeFileSync(
        path.join(coherentDirectory, "profiles.json"),
        JSON.stringify({ version: 1, profiles: [] }),
      );
    }
    return originalOpen(target, ...args);
  };
  try {
    expectCode("SOURCE_UNAVAILABLE", () =>
      readScopedUsage(request(coherentDirectory), { now: () => NOW }),
    );
  } finally {
    fs.openSync = originalOpen;
  }
});

test("rejects invalid UTF-8 and duplicate JSON object keys", (t) => {
  const directory = fixture(t);
  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    Buffer.from([0xff, 0xfe, 0xfd]),
  );
  expectCode("SOURCE_MALFORMED", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );

  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    `{"${PROFILE_ID}":{},"${PROFILE_ID}":{}}`,
  );
  expectCode("SOURCE_MALFORMED", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );
});

test("bounds JSON token work independently of the byte ceiling", (t) => {
  const directory = fixture(t);
  const overloaded = snapshots();
  overloaded[PROFILE_ID].extra = Array.from({ length: 4097 }, () => 0);
  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    JSON.stringify(overloaded),
  );
  expectCode("SOURCE_TOO_LARGE", () =>
    readScopedUsage(request(directory), { now: () => NOW }),
  );
});

test("CLI emits a versioned body-only envelope and finite redacted failures", (t) => {
  const directory = fixture(t);
  const current = Date.now();
  const liveShape = snapshots({ fetchedAt: current - 60_000 });
  liveShape[PROFILE_ID].limits[0].resetsAt = new Date(
    current + 4 * 60 * 60 * 1000,
  ).toISOString();
  liveShape[PROFILE_ID].limits[1].resetsAt = new Date(
    current + 5 * 24 * 60 * 60 * 1000,
  ).toISOString();
  fs.writeFileSync(
    path.join(directory, "usage-snapshots.json"),
    JSON.stringify(liveShape),
  );
  const cli = path.join(__dirname, "..", "reader", "usage-reader-cli.cjs");
  const success = spawnSync(process.execPath, [cli], {
    input: JSON.stringify(request(directory)),
    encoding: "utf8",
    timeout: 5000,
    windowsHide: true,
  });
  assert.equal(success.status, 0, success.stderr);
  const body = JSON.parse(success.stdout);
  assert.equal(body.ok, true);
  assert.equal(body.result.requestedProfileId, PROFILE_ID);
  assert.equal(success.stdout.includes(directory), false);

  const failure = spawnSync(process.execPath, [cli], {
    input: JSON.stringify({ ...request(directory), secretCanary: true }),
    encoding: "utf8",
    timeout: 5000,
    windowsHide: true,
  });
  assert.equal(failure.status, 1);
  assert.deepEqual(JSON.parse(failure.stdout), {
    schemaVersion: 1,
    ok: false,
    error: {
      code: "INVALID_REQUEST",
      message: "The usage-reader request is invalid.",
    },
  });
  assert.equal(failure.stdout.includes("secretCanary"), false);
  assert.equal(failure.stderr, "");

  const oversized = spawnSync(process.execPath, [cli], {
    input: `{"padding":"${"x".repeat(65_537)}"}`,
    encoding: "utf8",
    timeout: 5000,
    windowsHide: true,
  });
  assert.equal(oversized.status, 2);
  assert.deepEqual(JSON.parse(oversized.stdout), {
    schemaVersion: 1,
    ok: false,
    error: {
      code: "INVALID_REQUEST",
      message: "The usage-reader request is invalid.",
    },
  });
  assert.equal(oversized.stderr, "");
});

test("reader source contains no credential, process, Electron, environment, or network path", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "reader", "usage-reader.cjs"),
    "utf8",
  );
  for (const forbidden of [
    ".credentials.json",
    "accessToken",
    "refreshToken",
    "safeStorage",
    "child_process",
    "electron",
    "process.env",
    "fetch(",
    "http://",
    "https://api.",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("configured module surface composes directly as one scoped async reader", async (t) => {
  assert.equal(exportedReader.createScopedUsageReader, createScopedUsageReader);
  const directory = fixture(t);
  const configured = createScopedUsageReader(
    {
      schemaVersion: 1,
      dataDirectory: directory,
      profileAllowlist: request(directory).profileAllowlist,
      freshnessMs: 300_000,
    },
    { now: () => NOW },
  );
  assert.equal(configured.fixtureOnly, false);
  assert.equal(configured.readerId, READER_ID);
  assert.match(configured.configurationFingerprint, /^[a-f0-9]{64}$/);
  const result = await configured.readScopedUsage(PROFILE_ID);
  assert.equal(
    result.reader.configurationFingerprint,
    configured.configurationFingerprint,
  );
  const alternateDirectory = fixture(t);
  const alternate = createScopedUsageReader(
    {
      schemaVersion: 1,
      dataDirectory: alternateDirectory,
      profileAllowlist: request(alternateDirectory).profileAllowlist,
      freshnessMs: 300_000,
    },
    { now: () => NOW },
  );
  const alternateFreshness = createScopedUsageReader(
    {
      schemaVersion: 1,
      dataDirectory: directory,
      profileAllowlist: request(directory).profileAllowlist,
      freshnessMs: 301_000,
    },
    { now: () => NOW },
  );
  const alternateAuthority = createScopedUsageReader(
    {
      schemaVersion: 1,
      dataDirectory: directory,
      profileAllowlist: [
        {
          ...request(directory).profileAllowlist[0],
          ownership: "authorized-borrowed",
        },
      ],
      freshnessMs: 300_000,
    },
    { now: () => NOW },
  );
  assert.notEqual(
    configured.configurationFingerprint,
    alternate.configurationFingerprint,
  );
  assert.notEqual(
    configured.configurationFingerprint,
    alternateFreshness.configurationFingerprint,
  );
  assert.notEqual(
    configured.configurationFingerprint,
    alternateAuthority.configurationFingerprint,
  );
  assert.equal(JSON.stringify(configured).includes(directory), false);
  assert.equal(result.profile.providerId, "claude-code");
  await assert.rejects(
    configured.readScopedUsage("profile-other"),
    (error) => error instanceof UsageReaderError && error.code === "PROFILE_NOT_ALLOWED",
  );

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    configured.readScopedUsage(PROFILE_ID, {
      signal: controller.signal,
      deadline: "2026-08-12T00:05:00.000Z",
    }),
    (error) => error instanceof UsageReaderError && error.code === "SOURCE_UNAVAILABLE",
  );
  await assert.rejects(
    configured.readScopedUsage(PROFILE_ID, {
      signal: new AbortController().signal,
      deadline: "2026-08-11T23:59:59.999Z",
    }),
    (error) => error instanceof UsageReaderError && error.code === "SOURCE_UNAVAILABLE",
  );

  const crossingController = new AbortController();
  const crossingRead = configured.readScopedUsage(PROFILE_ID, {
    signal: crossingController.signal,
    deadline: "2026-08-12T00:05:00.000Z",
  });
  crossingController.abort();
  await assert.rejects(
    crossingRead,
    (error) => error instanceof UsageReaderError && error.code === "SOURCE_UNAVAILABLE",
  );

  const times = [NOW, NOW, NOW, NOW + 10_000];
  const expiring = createScopedUsageReader(
    {
      schemaVersion: 1,
      dataDirectory: directory,
      profileAllowlist: request(directory).profileAllowlist,
      freshnessMs: 300_000,
    },
    { now: () => times.shift() ?? NOW + 10_000 },
  );
  await assert.rejects(
    expiring.readScopedUsage(PROFILE_ID, {
      signal: new AbortController().signal,
      deadline: "2026-08-12T00:00:05.000Z",
    }),
    (error) => error instanceof UsageReaderError && error.code === "SOURCE_UNAVAILABLE",
  );

  const invalidTimestampDirectory = fixture(
    t,
    snapshots({ fetchedAt: 9e15 }),
  );
  const invalidTimestampReader = createScopedUsageReader(
    {
      schemaVersion: 1,
      dataDirectory: invalidTimestampDirectory,
      profileAllowlist: request(invalidTimestampDirectory).profileAllowlist,
      freshnessMs: 300_000,
    },
    { now: () => NOW },
  );
  await assert.rejects(
    invalidTimestampReader.readScopedUsage(PROFILE_ID),
    (error) => error instanceof UsageReaderError && error.code === "SNAPSHOT_INVALID",
  );
});
