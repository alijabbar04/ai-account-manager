import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { Identity } from "../../shared/types";
import { isHomeDefaultDir, readJson } from "./paths";

interface CredentialsFile {
  claudeAiOauth?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    subscriptionType?: string;
    rateLimitTier?: string;
    scopes?: string[];
  };
}

interface ClaudeJson {
  oauthAccount?: {
    emailAddress?: string;
    displayName?: string;
    organizationName?: string;
    organizationType?: string;
    billingType?: string;
    seatTier?: string;
    userRateLimitTier?: string;
    organizationRateLimitTier?: string;
  };
}

/** Epoch values in credentials may be seconds or milliseconds; normalize to ms. */
function toMs(epoch: number | undefined): number | undefined {
  if (!epoch || !Number.isFinite(epoch)) return undefined;
  return epoch > 1e12 ? epoch : epoch * 1000;
}

/**
 * For the machine-default ~\.claude profile, account state lives at the
 * sibling ~\.claude.json (that is what sessions launched without
 * CLAUDE_CONFIG_DIR actually use). Explicit profile dirs keep it inside.
 */
function claudeJsonPath(configDir: string): string {
  const inside = path.join(configDir, ".claude.json");
  if (isHomeDefaultDir(configDir)) {
    const sibling = path.join(os.homedir(), ".claude.json");
    if (fs.existsSync(sibling)) return sibling;
  }
  return inside;
}

/**
 * Derives displayable identity for a profile. Reads tokens only to determine
 * presence/expiry — token values never leave this module's return value.
 */
export function readIdentity(configDir: string): Identity {
  const creds = readJson<CredentialsFile>(path.join(configDir, ".credentials.json"));
  const claudeJson = readJson<ClaudeJson>(claudeJsonPath(configDir));

  const oauth = creds?.claudeAiOauth;
  const loggedIn = Boolean(oauth?.accessToken && oauth?.refreshToken);
  const tokenExpiresAt = toMs(oauth?.expiresAt);
  const acct = claudeJson?.oauthAccount;

  return {
    loggedIn,
    email: acct?.emailAddress,
    displayName: acct?.displayName,
    orgName: acct?.organizationName,
    orgType: acct?.organizationType,
    billingType: acct?.billingType,
    seatTier: acct?.seatTier,
    rateLimitTier: acct?.userRateLimitTier ?? oauth?.rateLimitTier,
    subscriptionType: oauth?.subscriptionType,
    tokenExpiresAt,
    tokenExpired: loggedIn && tokenExpiresAt !== undefined ? tokenExpiresAt < Date.now() : undefined
  };
}
