const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

// Windows PowerShell 5.1 is what ships with Windows, what the installer's
// finish-page checkbox invokes, and what most people get when they open
// "PowerShell" from the Start menu. pwsh 7 is opt-in. Scripts aimed at users
// therefore have to parse and run under 5.1 - and two traps make that fail
// silently on a developer machine that only ever runs pwsh.
const root = path.resolve(__dirname, "..");

function trackedScripts() {
  const out = execFileSync("git", ["ls-files", "*.ps1"], {
    cwd: root,
    encoding: "utf8",
  });
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const scripts = trackedScripts();

test("there are PowerShell scripts to check", () => {
  assert.ok(scripts.length >= 4, `found only ${scripts.length}`);
});

for (const relative of scripts) {
  const file = path.join(root, relative);

  // Trap 1: PowerShell 7 operators. These are parse errors in 5.1, so the
  // script dies before its first line runs - and the error points at whatever
  // line the parser gave up on, not the operator.
  test(`${relative} avoids PowerShell 7-only operators`, () => {
    const text = fs.readFileSync(file, "utf8");
    const offenders = [];
    text.split("\n").forEach((line, index) => {
      const code = line.replace(/#.*$/, "");
      if (/\?\?/.test(code))
        offenders.push(`${index + 1}: ?? (null-coalescing)`);
      if (/[)\]\w]\?\./.test(code))
        offenders.push(`${index + 1}: ?. (null-conditional)`);
    });
    assert.deepEqual(
      offenders,
      [],
      `${relative} uses syntax Windows PowerShell 5.1 cannot parse:\n  ${offenders.join("\n  ")}`,
    );
  });

  // Trap 2: 5.1 decodes a BOM-less file as ANSI, not UTF-8. A single non-ASCII
  // character then turns into mojibake, and if any resulting byte lands on a
  // quote the rest of the file is swallowed into an unterminated string.
  test(`${relative} is ASCII-only or carries a UTF-8 BOM`, () => {
    const buffer = fs.readFileSync(file);
    const hasBom =
      buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
    if (hasBom) return;

    const nonAscii = [];
    const text = buffer.toString("utf8");
    text.split("\n").forEach((line, index) => {
      // eslint-disable-next-line no-control-regex
      if (/[^\x00-\x7F]/.test(line)) nonAscii.push(index + 1);
    });
    assert.deepEqual(
      nonAscii,
      [],
      `${relative} has non-ASCII characters on line(s) ${nonAscii.join(", ")} ` +
        "but no UTF-8 BOM, so Windows PowerShell 5.1 will misread it. " +
        "Either keep it ASCII or add a BOM.",
    );
  });
}

test("the scripts an end user runs are reachable and self-contained", () => {
  for (const relative of [
    "scripts/install-prerequisites.ps1",
    "scripts/diagnose-claude-cli.ps1",
  ]) {
    const text = fs.readFileSync(path.join(root, relative), "utf8");
    assert.ok(
      scripts.includes(relative),
      `${relative} must be tracked - it is fetched over the web by path`,
    );
    // These are piped into `iex` from a URL, so they cannot rely on anything
    // else from the repository being present.
    assert.ok(
      !/\$PSScriptRoot\s*\)?\s*["']?\s*(?:\.\.|scripts)/.test(text),
      `${relative} must not reach for sibling files - it runs standalone`,
    );
  }
});
