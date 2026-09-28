const test = require("node:test");
const assert = require("node:assert/strict");
const {
  OAUTH_PROFILE_URL,
  OAuthIdentityVerifier,
  mergeVerifiedIdentity,
  normalizeOAuthProfile,
} = require("../app/dist-electron/oauth-identity.cjs");

function profile(email, uuid) {
  return {
    account: { email, uuid, display_name: "Ali" },
    organization: {
      uuid: `org-${uuid}`,
      name: "Lifted Team",
      organization_type: "claude_team",
    },
  };
}

test("OAuth profile, not local Claude metadata, identifies the signed-in account", async () => {
  let calls = 0;
  const verifier = new OAuthIdentityVerifier({
    fetchImpl: async (url, options) => {
      calls += 1;
      assert.equal(url, OAUTH_PROFILE_URL);
      assert.equal(options.headers.Authorization, "Bearer work-token");
      return {
        ok: true,
        json: async () => profile("work@example.com", "work"),
      };
    },
  });
  const verified = await verifier.verify("C:\\work", "work-token");
  const identity = mergeVerifiedIdentity(
    { loggedIn: true, email: "personal@example.com", orgName: "Personal" },
    verified,
  );
  assert.equal(identity.email, "work@example.com");
  assert.equal(identity.orgName, "Lifted Team");
  assert.equal(identity.identityVerified, true);
  assert.equal(
    (await verifier.verify("C:\\work", "work-token")).email,
    verified.email,
  );
  assert.equal(calls, 1);
});

test("a changed token is reverified rather than retaining the prior account", async () => {
  const verifier = new OAuthIdentityVerifier({
    fetchImpl: async (_url, options) => ({
      ok: true,
      json: async () =>
        options.headers.Authorization === "Bearer first-token"
          ? profile("first@example.com", "first")
          : profile("second@example.com", "second"),
    }),
  });
  assert.equal(
    (await verifier.verify("C:\\work", "first-token")).email,
    "first@example.com",
  );
  assert.equal(
    (await verifier.verify("C:\\work", "second-token")).email,
    "second@example.com",
  );
});

test("unverifiable credentials do not present stale local email as authenticated", async () => {
  const verifier = new OAuthIdentityVerifier({
    fetchImpl: async () => {
      throw new Error("offline");
    },
  });
  const local = {
    loggedIn: true,
    email: "personal@example.com",
    orgName: "Personal",
  };
  const identity = mergeVerifiedIdentity(
    local,
    await verifier.verify("C:\\work", "token"),
  );
  assert.equal(identity.email, undefined);
  assert.equal(identity.orgName, undefined);
  assert.equal(identity.identityVerified, false);
  assert.equal(
    mergeVerifiedIdentity({ loggedIn: false, email: "" }, null).loggedIn,
    false,
  );
  assert.equal(normalizeOAuthProfile({ account: { email: "invalid" } }), null);
});

test("concurrent checks share one request, and a rotated token never reuses it", async () => {
  const releases = [];
  const seen = [];
  const verifier = new OAuthIdentityVerifier({
    fetchImpl: (_url, options) => {
      seen.push(options.headers.Authorization);
      return new Promise((resolve) => {
        releases.push(() =>
          resolve({
            ok: true,
            json: async () =>
              options.headers.Authorization === "Bearer old-token"
                ? profile("old@example.com", "old")
                : profile("new@example.com", "new"),
          }),
        );
      });
    },
  });
  const first = verifier.verify("C:\work", "old-token");
  const shared = verifier.verify("C:\work", "old-token");
  const rotated = verifier.verify("C:\work", "new-token");
  assert.deepEqual(seen, ["Bearer old-token", "Bearer new-token"]);
  releases[1]();
  assert.equal((await rotated).email, "new@example.com");
  releases[0]();
  assert.equal((await first).email, "old@example.com");
  assert.equal(await shared, await first);
  // The late old-token reply must not evict or replace the newer entry.
  assert.equal(
    (await verifier.verify("C:\work", "new-token")).email,
    "new@example.com",
  );
  assert.equal(seen.length, 2);
});
