const path = require("node:path");
const {
  verifyVersion,
  installerName,
  generateArtifacts,
  verifyArtifacts,
} = require("./release-lib.cjs");

const root = path.resolve(__dirname, "..");
const version = verifyVersion(root);
const installer = path.resolve(
  process.argv[2] ?? path.join(root, "release", installerName(version)),
);
const downloadUrl = process.argv[3] ?? process.env.UPDATE_DOWNLOAD_URL;

if (!downloadUrl) {
  throw new Error(
    "Pass an HTTPS download URL as the second argument or UPDATE_DOWNLOAD_URL.",
  );
}

generateArtifacts(root, installer, downloadUrl);
verifyArtifacts(root, path.dirname(installer));
console.log(
  `Verified manifest and SHA256SUMS.txt in ${path.dirname(installer)}`,
);
