const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  CLAUDE_CLI_PATH_ENV,
  claudeCliCandidates,
  resolveClaudeCli,
  claudeCliMissingMessage,
} = require("../app/dist-electron/claude-cli-domain.cjs");

const WINDOWS_ENV = {
  USERPROFILE: "C:\\Users\\Someone",
  LOCALAPPDATA: "C:\\Users\\Someone\\AppData\\Local",
  APPDATA: "C:\\Users\\Someone\\AppData\\Roaming",
  ProgramFiles: "C:\\Program Files",
};

const NATIVE_INSTALL = path.join(
  WINDOWS_ENV.USERPROFILE,
  ".local",
  "bin",
  "claude.exe",
);

function resolver({ env = WINDOWS_ENV, present = [], onPath = null } = {}) {
  const set = new Set(present);
  return resolveClaudeCli({
    env,
    exists: (candidate) => set.has(candidate),
    findOnPath: () => onPath,
    path,
  });
}

test("PATH wins when it has the CLI - that is the normal, healthy case", () => {
  const result = resolver({
    onPath: "C:\\somewhere\\claude.exe",
    present: [NATIVE_INSTALL],
  });

  assert.equal(result.path, "C:\\somewhere\\claude.exe");
  assert.equal(result.source, "path");
});

test("the native install location is found when PATH does not carry it", () => {
  // The regression this module exists for: claude.exe is installed, PATH has
  // gone stale, and the app used to emit a raw CommandNotFoundException.
  const result = resolver({ onPath: null, present: [NATIVE_INSTALL] });

  assert.equal(result.path, NATIVE_INSTALL);
  assert.equal(result.source, "well-known");
});

test("an npm-global install is found too", () => {
  const npmGlobal = path.join(WINDOWS_ENV.APPDATA, "npm", "claude.cmd");
  const result = resolver({ onPath: null, present: [npmGlobal] });

  assert.equal(result.path, npmGlobal);
});

test("CLAUDE_CLI_PATH overrides everything when it points at a real file", () => {
  const override = "D:\\tools\\claude.exe";
  const result = resolver({
    env: { ...WINDOWS_ENV, [CLAUDE_CLI_PATH_ENV]: override },
    onPath: "C:\\somewhere\\claude.exe",
    present: [override, NATIVE_INSTALL],
  });

  assert.equal(result.path, override);
  assert.equal(result.source, "env");
});

test("a stale CLAUDE_CLI_PATH does not mask a working install", () => {
  const result = resolver({
    env: { ...WINDOWS_ENV, [CLAUDE_CLI_PATH_ENV]: "D:\\gone\\claude.exe" },
    onPath: null,
    present: [NATIVE_INSTALL],
  });

  assert.equal(
    result.path,
    NATIVE_INSTALL,
    "pointing the override at a deleted file must not break a good install",
  );
});

test("nothing installed reports failure and what it looked at", () => {
  const result = resolver({ onPath: null, present: [] });

  assert.equal(result.path, null);
  assert.ok(result.searched.includes("PATH"));
  assert.ok(result.searched.length > 3, "should report the places it looked");
});

test("candidates are absolute and include the documented locations", () => {
  const candidates = claudeCliCandidates(WINDOWS_ENV, path);

  assert.ok(candidates.includes(NATIVE_INSTALL));
  assert.ok(
    candidates.some((c) => c.includes(path.join("Microsoft", "WindowsApps"))),
    "the Store alias location must be probed",
  );
  for (const candidate of candidates) {
    assert.ok(path.isAbsolute(candidate), `not absolute: ${candidate}`);
  }
});

test("a missing environment produces no half-formed paths", () => {
  assert.deepEqual(claudeCliCandidates({}, path), []);
});

test("the failure message gives a runnable install command, not just advice", () => {
  const message = claudeCliMissingMessage();

  // Ordered by how likely each is to be the actual fix.
  assert.match(
    message,
    /winget install --id Anthropic\.ClaudeCode/,
    "a copy-pasteable install command is the fastest remedy",
  );
  assert.match(message, /claude\.com\/claude-code/);
  assert.match(
    message,
    /reopen/i,
    "restarting is the fix when it is installed but the app cannot see it",
  );
  assert.match(message, new RegExp(CLAUDE_CLI_PATH_ENV));
});

test("the main process resolves the CLI instead of shelling a bare name", () => {
  const main = fs.readFileSync(
    path.join(__dirname, "..", "app", "dist-electron", "main.cjs"),
    "utf8",
  );

  assert.ok(
    main.includes("requireClaudeExecutable()"),
    "main.cjs must resolve the CLI before opening a terminal",
  );
  // The exact shape that produced the CommandNotFoundException.
  assert.ok(
    !main.includes("-ForegroundColor Yellow; claude auth login"),
    "the login terminal must not invoke a bare 'claude'",
  );
  assert.ok(
    !main.includes("openTerminal(account, `claude "),
    "permission-mode launches must not invoke a bare 'claude'",
  );
});
