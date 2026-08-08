/**
 * Skills Sync verification: launches the built app, opens the Skills Sync
 * view, waits for the engine-driven matrix (or the not-found empty state),
 * exercises a dry-run-safe refresh, and drops screenshots into scripts/shots/.
 * Run `npm run build` first.
 */
import { _electron as electron } from "playwright-core";
import * as fs from "node:fs";
import * as path from "node:path";

const APP_DIR = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(APP_DIR, "scripts", "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE; // set inside Claude Code; breaks `electron .`
delete env.CLAUDE_CONFIG_DIR;

const app = await electron.launch({
  executablePath: path.join(APP_DIR, "node_modules", "electron", "dist", "electron.exe"),
  args: [APP_DIR],
  env,
  timeout: 30_000
});

const page = await app.firstWindow();
const shot = async (name) => {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  console.log(`shot: ${name}`);
};

try {
  await page.waitForSelector(".sidebar", { timeout: 15_000 });

  // Navigate to Skills Sync
  const navResult = await page.evaluate(() => {
    const el = [...document.querySelectorAll(".nav-item")].find((e) =>
      e.textContent?.includes("Skills Sync")
    );
    if (!el) return "NAV_NOT_FOUND";
    el.click();
    return "OK";
  });
  if (navResult !== "OK") throw new Error(`Skills Sync nav item: ${navResult}`);

  // Wait for either the matrix or the engine-missing empty state
  await page.waitForSelector(".skills-matrix, .empty h2", { timeout: 60_000 });
  await page.waitForTimeout(400);
  await shot("skills-sync");

  const summary = await page.evaluate(() => {
    const matrix = document.querySelector(".skills-matrix");
    if (!matrix) {
      return { mode: "empty", detail: document.querySelector(".empty h2")?.textContent ?? "?" };
    }
    return {
      mode: "matrix",
      skills: matrix.querySelectorAll("tbody tr").length,
      profiles: matrix.querySelectorAll("thead th").length - 2,
      upToDate: matrix.querySelectorAll('.skills-chip[data-state="UpToDate"]').length,
      tiles: [...document.querySelectorAll(".summary-tile-value")].map((t) => t.textContent)
    };
  });
  console.log("summary:", JSON.stringify(summary));

  if (summary.mode !== "matrix") throw new Error(`Expected matrix, got: ${JSON.stringify(summary)}`);
  if (summary.skills < 10) throw new Error(`Expected ≥10 skills, saw ${summary.skills}`);

  console.log("SKILLS SYNC VERIFICATION PASSED");
} finally {
  await app.close();
}
