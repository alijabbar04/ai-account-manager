const test = require("node:test");
const assert = require("node:assert/strict");
const { PhoneSyncServer } = require("../app/dist-electron/phone-server.cjs");

async function startServer(options = {}) {
  let deviceToken = null;
  let clock = Date.parse("2026-09-28T10:00:00Z");
  const refreshes = [];
  const server = new PhoneSyncServer({
    getSnapshot: async () => ({ v: 1, accounts: [] }),
    requestRefresh: async () => refreshes.push(clock),
    getDeviceToken: () => deviceToken,
    onPaired: async ({ token, deviceName }) => {
      deviceToken = token;
      server.pairedName = deviceName;
    },
    now: () => clock,
    allowPeer: () => true,
    ...options,
  });
  const { port } = await server.listen("127.0.0.1", 0);
  const call = async (method, path, { token, body } = {}) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body: text ? JSON.parse(text) : null,
    };
  };
  return {
    server,
    call,
    refreshes,
    advance: (ms) => (clock += ms),
    token: () => deviceToken,
  };
}

test("a phone pairs with the code on screen and then reads usage", async (t) => {
  const { server, call } = await startServer();
  t.after(() => server.close());
  assert.equal((await call("GET", "/v1/usage")).status, 401);
  server.startPairing("K7QXM2PA", 60_000);
  const paired = await call("POST", "/v1/pair", {
    body: { code: "k7qx-m2pa", device: "Galaxy S25" },
  });
  assert.equal(paired.status, 200);
  assert.match(paired.body.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(server.pairedName, "Galaxy S25");
  const usage = await call("GET", "/v1/usage", { token: paired.body.token });
  assert.equal(usage.status, 200);
  assert.deepEqual(usage.body, { v: 1, accounts: [] });
  assert.equal(usage.headers.get("cache-control"), "no-store");
  // The code is single-use.
  assert.equal(
    (await call("POST", "/v1/pair", { body: { code: "K7QXM2PA" } })).status,
    410,
  );
});

test("wrong codes are limited and expired codes are refused", async (t) => {
  const { server, call, advance } = await startServer();
  t.after(() => server.close());
  server.startPairing("K7QXM2PA", 60_000);
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    assert.equal(
      (await call("POST", "/v1/pair", { body: { code: "AAAAAAAA" } })).status,
      401,
    );
  }
  const fifth = await call("POST", "/v1/pair", { body: { code: "AAAAAAAA" } });
  assert.match(fifth.body.error, /Too many wrong codes/);
  assert.equal(
    (await call("POST", "/v1/pair", { body: { code: "K7QXM2PA" } })).status,
    410,
    "the right code no longer works after five misses",
  );
  server.startPairing("K7QXM2PA", 60_000);
  advance(60_001);
  assert.equal(
    (await call("POST", "/v1/pair", { body: { code: "K7QXM2PA" } })).status,
    410,
  );
});

test("usage requires the current device token", async (t) => {
  const { server, call, token } = await startServer();
  t.after(() => server.close());
  server.startPairing("K7QXM2PA", 60_000);
  await call("POST", "/v1/pair", { body: { code: "K7QXM2PA" } });
  const wrong = await call("GET", "/v1/usage", {
    token: `${token().slice(0, -1)}x`,
  });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.code, "unpaired");
});

test("refresh requests are rate limited", async (t) => {
  const { server, call, token, refreshes, advance } = await startServer();
  t.after(() => server.close());
  server.startPairing("K7QXM2PA", 60_000);
  await call("POST", "/v1/pair", { body: { code: "K7QXM2PA" } });
  assert.deepEqual(
    (await call("POST", "/v1/refresh", { token: token() })).body,
    { accepted: true },
  );
  const again = await call("POST", "/v1/refresh", { token: token() });
  assert.equal(again.body.accepted, false);
  assert.ok(again.body.retryAfterMs > 0);
  advance(60_000);
  assert.equal(
    (await call("POST", "/v1/refresh", { token: token() })).body.accepted,
    true,
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(refreshes.length, 2);
});

test("peers outside the tailnet are refused before any route runs", async (t) => {
  const { server, call } = await startServer({ allowPeer: () => false });
  t.after(() => server.close());
  server.startPairing("K7QXM2PA", 60_000);
  const response = await call("POST", "/v1/pair", {
    body: { code: "K7QXM2PA" },
  });
  assert.equal(response.status, 403);
  assert.ok(server.activePairing(), "a refused peer cannot burn the code");
});

test("CORS preflight is answered for the bundled phone UI", async (t) => {
  const { server, call } = await startServer();
  t.after(() => server.close());
  const response = await call("OPTIONS", "/v1/usage");
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(
    response.headers.get("access-control-allow-headers"),
    /Authorization/,
  );
  assert.equal((await call("GET", "/nope")).status, 404);
});

test("oversized and malformed pairing bodies are rejected", async (t) => {
  const { server, call } = await startServer();
  t.after(() => server.close());
  server.startPairing("K7QXM2PA", 60_000);
  const big = await call("POST", "/v1/pair", {
    body: { code: "K7QXM2PA", device: "x".repeat(5000) },
  });
  assert.equal(big.status, 413);
  const malformed = await fetch(
    `http://127.0.0.1:${server.address.port}/v1/pair`,
    { method: "POST", body: "{not json" },
  );
  assert.equal(malformed.status, 400);
  assert.ok(
    server.activePairing(),
    "a rejected body does not consume the code",
  );
});
