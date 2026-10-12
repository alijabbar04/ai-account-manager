"use strict";
const path = require("node:path");
const { verifyVersion, verifyArtifacts } = require("./release-lib.cjs");
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const tagIndex = args.indexOf("--tag");
const tag = tagIndex >= 0 ? args[tagIndex + 1] : undefined;
if (tagIndex >= 0 && !tag) throw new Error("--tag requires a value");
const version = args.includes("--artifacts")
  ? verifyArtifacts(root, path.join(root, "release"), {
      tag,
      official: args.includes("--official"),
    })
  : verifyVersion(root, tag);
console.log(`Release checks passed for ${version}${tag ? ` (${tag})` : ""}.`);
