"use strict";

// Locating the Claude Code CLI.
//
// The app used to issue a bare `claude` and let the shell resolve it. That is
// fine right up until PATH does not contain it, and then the user gets a raw
// PowerShell CommandNotFoundException in a terminal window the app opened -
// which says nothing about what to do next.
//
// PATH is missing it more often than you would expect:
//   * the native installer puts claude.exe in %USERPROFILE%\.local\bin and
//     adds that to the user PATH, but already-running processes keep the old
//     environment until they restart - so a fresh install plus an app that was
//     already open is exactly the broken case;
//   * the app inherits PATH from whatever launched it, so a launcher with a
//     trimmed environment hands that straight to every terminal it opens;
//   * npm-global, bun and Store installs all land somewhere different.
//
// So resolve to an absolute path the same way the app already does for Codex
// and VS Code, and when that genuinely fails, say so in words the user can act
// on. Callers should quote the returned path: it can contain spaces.

const CLAUDE_CLI_PATH_ENV = "CLAUDE_CLI_PATH";

/**
 * Ordered list of places to look, most authoritative first. Pure: takes an
 * environment, returns paths, touches no disk.
 */
function claudeCliCandidates(env = process.env, path = require("node:path")) {
  const candidates = [];
  const add = (...parts) => {
    if (parts.every((part) => part)) candidates.push(path.join(...parts));
  };

  // The native installer's default location - the common case on a new machine.
  if (env.USERPROFILE) {
    add(env.USERPROFILE, ".local", "bin", "claude.exe");
    add(env.USERPROFILE, ".claude", "local", "claude.exe");
    add(env.USERPROFILE, ".bun", "bin", "claude.exe");
  }
  if (env.LOCALAPPDATA) {
    add(env.LOCALAPPDATA, "Programs", "claude", "claude.exe");
    // A Store app-execution alias is a zero-length reparse point: existsSync
    // and statSync both report it missing, so the caller must probe with lstat.
    add(env.LOCALAPPDATA, "Microsoft", "WindowsApps", "claude.exe");
  }
  if (env.APPDATA) {
    add(env.APPDATA, "npm", "claude.cmd");
    add(env.APPDATA, "npm", "claude");
  }
  if (env.ProgramFiles) add(env.ProgramFiles, "Claude", "claude.exe");

  return candidates;
}

/**
 * Resolve the CLI.
 *
 * @param exists  probe for a path - must use lstat, not stat (see above)
 * @param findOnPath  the caller's PATH search, or null to skip it
 * @returns {{ path: string, source: string } | { path: null, searched: string[] }}
 */
function resolveClaudeCli({
  env = process.env,
  exists,
  findOnPath = () => null,
  path = require("node:path"),
} = {}) {
  const searched = [];

  // An explicit override wins, but only if it is really there - otherwise a
  // stale value would mask a perfectly good install.
  const override = env[CLAUDE_CLI_PATH_ENV];
  if (override) {
    searched.push(override);
    if (exists(override)) return { path: override, source: "env" };
  }

  const onPath = findOnPath("claude");
  if (onPath) return { path: onPath, source: "path" };
  searched.push("PATH");

  for (const candidate of claudeCliCandidates(env, path)) {
    searched.push(candidate);
    if (exists(candidate)) return { path: candidate, source: "well-known" };
  }

  return { path: null, searched };
}

/**
 * What to tell the user when it cannot be found. Names the override and the
 * restart, because those are the two things that actually fix it.
 */
function claudeCliMissingMessage() {
  return [
    "Claude Code was not found.",
    "Install it from https://claude.com/claude-code, then reopen this app.",
    "If it is already installed, its folder is missing from PATH - sign out and",
    `back in, or set ${CLAUDE_CLI_PATH_ENV} to the full path of claude.exe.`,
  ].join(" ");
}

module.exports = {
  CLAUDE_CLI_PATH_ENV,
  claudeCliCandidates,
  resolveClaudeCli,
  claudeCliMissingMessage,
};
