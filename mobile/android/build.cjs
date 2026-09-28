"use strict";

// Builds the AI Account Usage phone app (APK) with the Android SDK's
// command-line tools directly: no Gradle, no Android Studio.
//
//   node mobile/android/build.cjs
//
// Needs a JDK 17+ and an Android SDK holding build-tools 35.0.1 and the
// android-35 platform. Defaults point at D:\DevTools; override with
// JAVA_HOME, ANDROID_HOME, AAM_BUILD_TOOLS and AAM_ANDROID_PLATFORM.
//
// The APK is signed with a key kept OUTSIDE the repository, in
// ~/.aam-android-signing (override with AAM_ANDROID_KEY_DIR). It is created on
// the first build. Keep it: Android only installs an update signed with the
// same key, so losing it means uninstalling the app before reinstalling.

const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const MIN_SDK = "26";
const TARGET_SDK = "34";
const KEY_ALIAS = "aam-usage";

const root = __dirname;
const out = path.join(root, "build");
const devTools = process.env.AAM_DEVTOOLS || "D:\\DevTools";
const jdk = process.env.JAVA_HOME || path.join(devTools, "jdk-17");
const sdk = process.env.ANDROID_HOME || path.join(devTools, "android-sdk");
const buildTools = path.join(
  sdk,
  "build-tools",
  process.env.AAM_BUILD_TOOLS || "35.0.1",
);
const androidJar = path.join(
  sdk,
  "platforms",
  process.env.AAM_ANDROID_PLATFORM || "android-35",
  "android.jar",
);
const keyDir =
  process.env.AAM_ANDROID_KEY_DIR ||
  path.join(os.homedir(), ".aam-android-signing");

const exe = (name) => (process.platform === "win32" ? `${name}.exe` : name);
const tools = {
  java: path.join(jdk, "bin", exe("java")),
  javac: path.join(jdk, "bin", exe("javac")),
  keytool: path.join(jdk, "bin", exe("keytool")),
  aapt: path.join(buildTools, exe("aapt")),
  aapt2: path.join(buildTools, exe("aapt2")),
  zipalign: path.join(buildTools, exe("zipalign")),
  d8: path.join(buildTools, "lib", "d8.jar"),
  apksigner: path.join(buildTools, "lib", "apksigner.jar"),
  // javac needs LambdaMetafactory to compile lambdas; d8 desugars them.
  lambdaStubs: path.join(buildTools, "core-lambda-stubs.jar"),
  androidJar,
};

function fail(message) {
  process.stderr.write(`\nbuild failed: ${message}\n`);
  process.exit(1);
}

for (const [name, file] of Object.entries(tools)) {
  if (!fs.existsSync(file)) fail(`${name} not found at ${file}`);
}

function run(file, args, options = {}) {
  const result = spawnSync(file, args, {
    cwd: options.cwd || root,
    env: { ...process.env, JAVA_HOME: jdk },
    encoding: "utf8",
    windowsHide: true,
    shell: false,
  });
  if (result.error) fail(`${path.basename(file)}: ${result.error.message}`);
  if (result.status !== 0) {
    process.stderr.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    fail(`${path.basename(file)} exited with ${result.status}`);
  }
  return result.stdout;
}

function walk(dir, extension) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, extension);
    return entry.name.endsWith(extension) ? [full] : [];
  });
}

function ensureSigningKey() {
  const keystore = path.join(keyDir, "aam-usage.p12");
  const passwordFile = path.join(keyDir, "password.txt");
  if (fs.existsSync(keystore) && fs.existsSync(passwordFile)) {
    return { keystore, passwordFile };
  }
  if (fs.existsSync(keystore)) {
    fail(`${keystore} exists but its password file ${passwordFile} is missing`);
  }
  fs.mkdirSync(keyDir, { recursive: true });
  fs.writeFileSync(passwordFile, crypto.randomBytes(24).toString("base64url"), {
    mode: 0o600,
  });
  run(tools.keytool, [
    "-genkeypair",
    "-keystore",
    keystore,
    "-storetype",
    "PKCS12",
    "-storepass:file",
    passwordFile,
    "-alias",
    KEY_ALIAS,
    "-keyalg",
    "RSA",
    "-keysize",
    "3072",
    "-validity",
    "10000",
    "-dname",
    "CN=AI Account Usage, O=AI Account Manager contributors",
  ]);
  process.stdout.write(`created signing key ${keystore}\n`);
  return { keystore, passwordFile };
}

const manifest = path.join(root, "AndroidManifest.xml");
const version =
  fs
    .readFileSync(manifest, "utf8")
    .match(/android:versionName="([^"]+)"/)?.[1] ??
  fail("versionName missing from AndroidManifest.xml");

fs.rmSync(out, { recursive: true, force: true });
const gen = path.join(out, "gen");
const classes = path.join(out, "classes");
const dex = path.join(out, "dex");
for (const dir of [gen, classes, dex]) fs.mkdirSync(dir, { recursive: true });
const resZip = path.join(out, "res.zip");
const unsigned = path.join(out, "unsigned.apk");
const aligned = path.join(out, "aligned.apk");
const apk = path.join(out, `AI-Account-Usage-${version}.apk`);

process.stdout.write(`building AI Account Usage ${version}\n`);
run(tools.aapt2, ["compile", "--dir", path.join(root, "res"), "-o", resZip]);
run(tools.aapt2, [
  "link",
  "-o",
  unsigned,
  "-I",
  tools.androidJar,
  "--manifest",
  manifest,
  "-A",
  path.join(root, "assets"),
  "--java",
  gen,
  "--min-sdk-version",
  MIN_SDK,
  "--target-sdk-version",
  TARGET_SDK,
  resZip,
]);
run(tools.javac, [
  "-encoding",
  "UTF-8",
  "-source",
  "8",
  "-target",
  "8",
  "-Xlint:-options",
  "-bootclasspath",
  tools.androidJar,
  "-classpath",
  tools.lambdaStubs,
  "-d",
  classes,
  ...walk(path.join(root, "src"), ".java"),
  ...walk(gen, ".java"),
]);
run(tools.java, [
  "-cp",
  tools.d8,
  "com.android.tools.r8.D8",
  "--release",
  "--min-api",
  MIN_SDK,
  "--lib",
  tools.androidJar,
  "--output",
  dex,
  ...walk(classes, ".class"),
]);
// aapt (v1) adds the dex without recompressing resources.arsc, which must stay
// stored for apps targeting Android 11+.
run(tools.aapt, ["add", unsigned, "classes.dex"], { cwd: dex });
run(tools.zipalign, ["-f", "4", unsigned, aligned]);
const key = ensureSigningKey();
run(tools.java, [
  "-jar",
  tools.apksigner,
  "sign",
  "--ks",
  key.keystore,
  "--ks-pass",
  `file:${key.passwordFile}`,
  "--ks-key-alias",
  KEY_ALIAS,
  "--out",
  apk,
  aligned,
]);
const verified = run(tools.java, [
  "-jar",
  tools.apksigner,
  "verify",
  "--print-certs",
  apk,
]);
const digest = verified.match(/SHA-256 digest: ([0-9a-f]+)/)?.[1];
process.stdout.write(
  `\nDONE: ${apk} (${(fs.statSync(apk).size / 1024).toFixed(0)} KB)\n` +
    (digest ? `signing certificate SHA-256: ${digest}\n` : ""),
);
