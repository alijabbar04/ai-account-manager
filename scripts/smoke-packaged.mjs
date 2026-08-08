/** Smoke test for the packaged build: launch release/win-unpacked, expect the dashboard. */
import { _electron as electron } from "playwright-core";
import * as fs from "node:fs";
import * as path from "node:path";

const APP_DIR = path.resolve(import.meta.dirname, "..");
const exe = path.join(APP_DIR, "release", "win-unpacked", "AI Account Manager.exe");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
delete env.CLAUDE_CONFIG_DIR;

const app = await electron.launch({ executablePath: exe, env, timeout: 30_000 });
const page = await app.firstWindow();
try {
  await page.waitForSelector(".card, .empty", { timeout: 20_000 });
  const title = await page.title();
  const cards = await page.evaluate(() => document.querySelectorAll(".card").length);
  fs.mkdirSync(path.join(APP_DIR, "scripts", "shots"), { recursive: true });
  await page.screenshot({ path: path.join(APP_DIR, "scripts", "shots", "08-packaged.png") });
  console.log(`packaged app OK — title="${title}", cards=${cards}`);
} finally {
  await app.close().catch(() => {});
}
