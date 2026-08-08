import * as fs from "node:fs";
import * as path from "node:path";

const POLL_MS = 2000;
const TIMEOUT_MS = 10 * 60 * 1000;

const active = new Map<string, NodeJS.Timeout>();

/**
 * After a login terminal is opened for a profile, poll its credentials file
 * until a token appears (login completed in the browser), then notify.
 */
export function watchForLogin(profileId: string, configDir: string, onLogin: () => void): void {
  stopWatching(profileId);
  const credsFile = path.join(configDir, ".credentials.json");
  const startedAt = Date.now();

  const timer = setInterval(() => {
    if (Date.now() - startedAt > TIMEOUT_MS) {
      stopWatching(profileId);
      return;
    }
    try {
      const creds = JSON.parse(fs.readFileSync(credsFile, "utf8")) as {
        claudeAiOauth?: { accessToken?: string };
      };
      if (creds.claudeAiOauth?.accessToken) {
        stopWatching(profileId);
        onLogin();
      }
    } catch {
      /* not there yet */
    }
  }, POLL_MS);
  active.set(profileId, timer);
}

export function stopWatching(profileId: string): void {
  const timer = active.get(profileId);
  if (timer) clearInterval(timer);
  active.delete(profileId);
}

export function stopAll(): void {
  for (const id of [...active.keys()]) stopWatching(id);
}
