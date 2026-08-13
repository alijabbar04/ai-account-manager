const fs = require("node:fs");
const path = require("node:path");
const { sha256, validateManifest } = require("./lib.cjs");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const installer = path.resolve(
  process.argv[2] ??
    path.join(root, "release", `AI-Account-Manager-Setup-${pkg.version}.exe`),
);
const downloadUrl = process.argv[3] ?? process.env.UPDATE_DOWNLOAD_URL;

if (!fs.existsSync(installer))
  throw new Error(`Installer not found: ${installer}`);
if (!downloadUrl?.startsWith("https://")) {
  throw new Error(
    "Pass an HTTPS download URL as the second argument or UPDATE_DOWNLOAD_URL.",
  );
}

const manifest = {
  version: pkg.version,
  downloadUrl,
  sha256: sha256(installer),
  publishedAt: new Date().toISOString(),
  notes: process.env.RELEASE_NOTES ?? "See the release notes for details.",
};
if (!validateManifest(manifest))
  throw new Error("Generated manifest is invalid.");

const output = path.join(root, "release", "latest.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
process.stdout.write(`${output}\n`);
