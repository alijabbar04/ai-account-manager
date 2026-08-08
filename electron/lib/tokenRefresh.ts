import * as fs from "node:fs";
import * as path from "node:path";

/**
 * OAuth token refresh, mirroring what the Claude Code CLI does itself.
 * The client_id below is Claude Code's public OAuth client identifier
 * (embedded in the CLI binary) — it is not a secret.
 */
const TOKEN_ENDPOINT = "https://platform.claude.com/v1/oauth/token";
const CLAUDE_CODE_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";

/** Refresh when the token expires within this window. */
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

interface OauthBlock {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  [key: string]: unknown;
}

interface CredentialsFile {
  claudeAiOauth?: OauthBlock;
  [key: string]: unknown;
}

function credsPath(configDir: string): string {
  return path.join(configDir, ".credentials.json");
}

function readCreds(configDir: string): CredentialsFile | null {
  try {
    return JSON.parse(fs.readFileSync(credsPath(configDir), "utf8")) as CredentialsFile;
  } catch {
    return null;
  }
}

function toMs(epoch: number | undefined): number {
  if (!epoch || !Number.isFinite(epoch)) return 0;
  return epoch > 1e12 ? epoch : epoch * 1000;
}

/**
 * Writes updated credentials preserving every field we don't understand.
 * Atomic (temp + rename) so a crash can never corrupt a login. A one-time
 * backup of the pre-CAM file is kept alongside.
 */
function writeCreds(configDir: string, creds: CredentialsFile): void {
  const file = credsPath(configDir);
  const backup = `${file}.cam-backup`;
  if (fs.existsSync(file) && !fs.existsSync(backup)) {
    fs.copyFileSync(file, backup);
  }
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(creds), "utf8");
  fs.renameSync(tmp, file);
}

export class TokenError extends Error {
  constructor(
    message: string,
    /** true when the user must re-run `claude auth login` for this profile */
    public readonly needsRelogin: boolean
  ) {
    super(message);
  }
}

/**
 * Returns a valid access token for the profile, refreshing it first if it is
 * expired or about to expire. Token values stay inside the main process.
 */
export async function getValidAccessToken(configDir: string): Promise<string> {
  const creds = readCreds(configDir);
  const oauth = creds?.claudeAiOauth;
  if (!oauth?.accessToken || !oauth?.refreshToken) {
    throw new TokenError("Not logged in", true);
  }

  const expiresAt = toMs(oauth.expiresAt);
  if (expiresAt === 0 || expiresAt > Date.now() + EXPIRY_MARGIN_MS) {
    return oauth.accessToken;
  }

  let res: Response;
  try {
    res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: oauth.refreshToken,
        client_id: CLAUDE_CODE_CLIENT_ID
      })
    });
  } catch (err) {
    throw new TokenError(`Network error during token refresh: ${(err as Error).message}`, false);
  }

  if (!res.ok) {
    // 400/401 → refresh token revoked or rotated elsewhere: user must log in again.
    const needsRelogin = res.status === 400 || res.status === 401 || res.status === 403;
    throw new TokenError(`Token refresh failed (HTTP ${res.status})`, needsRelogin);
  }

  const body = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!body.access_token) {
    throw new TokenError("Token refresh returned no access token", false);
  }

  const updated: CredentialsFile = {
    ...creds,
    claudeAiOauth: {
      ...oauth,
      accessToken: body.access_token,
      refreshToken: body.refresh_token || oauth.refreshToken,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000
    }
  };
  writeCreds(configDir, updated);
  return body.access_token;
}
