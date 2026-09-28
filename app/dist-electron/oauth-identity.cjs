"use strict";

const { createHash } = require("node:crypto");

const OAUTH_PROFILE_URL = "https://api.anthropic.com/api/oauth/profile";
const SUCCESS_TTL_MS = 60 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;

function normalizeOAuthProfile(value) {
  const account = value?.account;
  const organization = value?.organization;
  if (
    typeof account?.email !== "string" ||
    !account.email.includes("@") ||
    typeof account?.uuid !== "string" ||
    typeof organization?.uuid !== "string"
  ) {
    return null;
  }
  return {
    email: account.email,
    accountUuid: account.uuid,
    displayName: account.display_name || account.full_name || undefined,
    orgUuid: organization.uuid,
    orgName: organization.name || undefined,
    orgType: organization.organization_type || undefined,
    billingType: organization.billing_type || undefined,
    seatTier: organization.seat_tier || undefined,
    rateLimitTier: organization.rate_limit_tier || undefined,
  };
}

function mergeVerifiedIdentity(local, verified) {
  if (!local?.loggedIn) return local;
  if (!verified) {
    // .claude.json is not proof of which account owns .credentials.json.
    return {
      ...local,
      email: undefined,
      displayName: undefined,
      orgName: undefined,
      orgType: undefined,
      identityVerified: false,
    };
  }
  return {
    ...local,
    email: verified.email,
    displayName: verified.displayName,
    orgName: verified.orgName,
    orgType: verified.orgType,
    billingType: verified.billingType,
    seatTier: verified.seatTier,
    rateLimitTier: verified.rateLimitTier,
    identityVerified: true,
  };
}

class OAuthIdentityVerifier {
  constructor({ fetchImpl = globalThis.fetch, now = Date.now } = {}) {
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.cache = new Map();
    this.pending = new Map();
  }

  async verify(configDir, accessToken) {
    if (typeof accessToken !== "string" || !accessToken) return null;
    const fingerprint = createHash("sha256").update(accessToken).digest("hex");
    const cached = this.cache.get(configDir);
    if (cached?.fingerprint === fingerprint && cached.expiresAt > this.now()) {
      return cached.profile;
    }
    const key = `${configDir}\0${fingerprint}`;
    if (this.pending.has(key)) return this.pending.get(key);

    const request = (async () => {
      let profile = null;
      try {
        const response = await this.fetchImpl(OAUTH_PROFILE_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "anthropic-beta": "oauth-2025-04-20",
          },
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) profile = normalizeOAuthProfile(await response.json());
      } catch {
        // Network errors should not make stale local account metadata authoritative.
      }
      if (!profile && cached?.fingerprint === fingerprint && cached.profile) {
        profile = cached.profile;
      }
      this.cache.set(configDir, {
        fingerprint,
        profile,
        expiresAt: this.now() + (profile ? SUCCESS_TTL_MS : FAILURE_TTL_MS),
      });
      return profile;
    })();
    this.pending.set(key, request);
    try {
      return await request;
    } finally {
      this.pending.delete(key);
    }
  }
}

module.exports = {
  OAUTH_PROFILE_URL,
  OAuthIdentityVerifier,
  mergeVerifiedIdentity,
  normalizeOAuthProfile,
};
