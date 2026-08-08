const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const files = {
  main: path.join(root, "app", "dist-electron", "main.cjs"),
  preload: path.join(root, "app", "dist-electron", "preload.cjs"),
  renderer: path.join(root, "app", "dist", "assets", "index-CfQCNBzk.js"),
  css: path.join(root, "app", "dist", "assets", "index-DR09S7BQ.css"),
};

for (const [name, file] of Object.entries(files)) {
  assert.ok(fs.existsSync(file), `${name} runtime file is missing`);
}

for (const file of [files.main, files.preload, files.renderer]) {
  const check = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  assert.equal(check.status, 0, check.stderr || `Syntax check failed: ${file}`);
}

const main = fs.readFileSync(files.main, "utf8");
const preload = fs.readFileSync(files.preload, "utf8");
const renderer = fs.readFileSync(files.renderer, "utf8");

for (const channel of [
  "account/usage/read",
  "claude:history",
  "alerts:get",
  "alerts:set",
  "updates:check",
]) {
  assert.ok(main.includes(channel), `Main process is missing ${channel}`);
}
for (const discoveryPath of [
  '"OpenAI", "Codex", "bin"',
  '"openai.chatgpt-"',
  '"codex-win32-x64"',
]) {
  assert.ok(
    main.includes(discoveryPath),
    `Codex discovery is missing ${discoveryPath}`,
  );
}
for (const bridge of [
  "getGptUsage",
  "getClaudeHistory",
  "refreshGptUsage",
  "alerts",
  "updates",
]) {
  assert.ok(preload.includes(bridge), `Preload bridge is missing ${bridge}`);
}
for (const feature of [
  "Account token history",
  "Usage alerts",
  "Detected key type",
  "App updates",
]) {
  assert.ok(renderer.includes(feature), `Renderer is missing ${feature}`);
}
assert.ok(
  !renderer.includes("View all other accounts →"),
  "Removed dashboard shortcut was reintroduced",
);

process.stdout.write("Runtime verification passed.\n");
