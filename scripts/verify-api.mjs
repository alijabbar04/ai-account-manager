/**
 * End-to-end verification of the API Key Analytics feature, driving the real
 * built app via Playwright with CAM_FAKE_PROVIDERS=1 (synthetic provider data,
 * no network). Exercises: sidebar nav, the existing Accounts view still works,
 * adding a key through the real encrypted-store flow, and the dashboard /
 * analytics / provider views rendering derived numbers and a chart.
 *
 * Screenshots land in scripts/shots/. Run `npm run build` first.
 */
import { _electron as electron } from "playwright-core";
import * as fs from "node:fs";
import * as path from "node:path";

const APP_DIR = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(APP_DIR, "scripts", "shots");
fs.mkdirSync(SHOTS, { recursive: true });

// Clean any prior test keys so the run is deterministic.
const appData = path.join(process.env.APPDATA, "AIAccountManager");
for (const f of ["api-keys.json", "api-keys-vault.json", "api-usage-snapshots.json"]) {
  fs.rmSync(path.join(appData, f), { force: true });
}

const env = { ...process.env, CAM_FAKE_PROVIDERS: "1" };
delete env.ELECTRON_RUN_AS_NODE;
delete env.CLAUDE_CONFIG_DIR;

const app = await electron.launch({
  executablePath: path.join(APP_DIR, "node_modules", "electron", "dist", "electron.exe"),
  args: [APP_DIR],
  env,
  timeout: 30_000
});
const page = await app.firstWindow();
const shot = async (n) => {
  await page.screenshot({ path: path.join(SHOTS, `${n}.png`) });
  console.log("shot:", n);
};
const clickText = (text, sel = "button, .nav-item") =>
  page.evaluate(
    ([t, s]) => {
      const els = [...document.querySelectorAll(s)];
      const el = els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t));
      if (!el) return "NOT_FOUND";
      el.click();
      return "OK";
    },
    [text, sel]
  );
const setInput = (sel, v) =>
  page.evaluate(
    ([s, val]) => {
      const input = document.querySelector(s);
      if (!input) return "NOT_FOUND";
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, val);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return "OK";
    },
    [sel, v]
  );

let failures = 0;
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
};

try {
  // 1. App boots into the Accounts view via the new sidebar shell.
  await page.waitForSelector(".app-shell .sidebar", { timeout: 15_000 });
  await page.waitForSelector(".view h1", { timeout: 10_000 });
  const firstTitle = await page.evaluate(() => document.querySelector(".view h1")?.textContent?.trim());
  check("boots into Accounts view", firstTitle === "Accounts", String(firstTitle));
  check("existing account card still renders", (await page.$(".card")) !== null);
  await shot("api-01-accounts-shell");

  // 2. Navigate to API Keys and add an OpenRouter key through the real flow.
  await clickText("API Keys");
  await page.waitForFunction(() => document.querySelector(".view h1")?.textContent?.trim() === "API Keys");
  await clickText("+ Add key");
  await page.waitForSelector(".dialog", { timeout: 5000 });
  await clickText("OpenRouter", ".provider-pill");
  await setInput(".dialog .field input", "Test OpenRouter");
  await setInput(".dialog input[type=password]", "sk-or-v1-fake-key-for-e2e");
  await shot("api-02-add-key");
  check("validate works", (await clickText("Validate")) === "OK");
  await page.waitForSelector(".banner[data-kind='ok-info']", { timeout: 8000 });
  const validMsg = await page.evaluate(() => document.querySelector(".banner[data-kind='ok-info']")?.textContent);
  check("key validated", (validMsg ?? "").toLowerCase().includes("valid"), validMsg);
  await clickText("Add key");
  await page.waitForFunction(() => !document.querySelector(".dialog"), { timeout: 8000 });
  await page.waitForSelector(".apikey-card", { timeout: 8000 });
  check("key card appears", (await page.$(".apikey-card")) !== null);

  // Add a second key: standard Anthropic (validity only, no metrics).
  await clickText("+ Add key");
  await page.waitForSelector(".dialog", { timeout: 5000 });
  await clickText("Anthropic", ".provider-pill");
  await setInput(".dialog .field input", "Test Claude");
  await setInput(".dialog input[type=password]", "sk-ant-api03-fake-e2e");
  await clickText("Add key");
  await page.waitForFunction(() => document.querySelectorAll(".apikey-card").length >= 2, { timeout: 8000 });
  check("second key card appears", (await page.$$(".apikey-card")).length >= 2);
  await shot("api-03-keys-list");

  // Verify masking: the raw secret must never appear in the DOM.
  const bodyText = await page.evaluate(() => document.body.innerText);
  check("secret is masked (no raw key in DOM)", !bodyText.includes("fake-key-for-e2e") && !bodyText.includes("fake-e2e"));
  check("masked form shown", bodyText.includes("sk-or-") && bodyText.includes("*"));

  // 3. Dashboard shows balance + spend tiles.
  await clickText("Dashboard");
  await page.waitForFunction(() => document.querySelector(".view h1")?.textContent?.trim() === "API Dashboard");
  await page.waitForSelector(".dash-card", { timeout: 8000 });
  const dashText = await page.evaluate(() => document.querySelector(".main-scroll")?.innerText ?? "");
  check("dashboard shows a balance figure", /\$\d/.test(dashText), dashText.slice(0, 120));
  check("summary tiles present", (await page.$$(".summary-tile")).length >= 3);
  await shot("api-04-dashboard");

  // 4. Analytics: projections + chart render.
  await clickText("Analytics");
  await page.waitForFunction(() => document.querySelector(".view h1")?.textContent?.trim() === "Analytics");
  await page.waitForSelector(".chart svg path", { timeout: 8000 });
  check("chart line rendered", (await page.$(".chart svg path")) !== null);
  check("spend-by-provider bars", (await page.$$(".bar-row")).length >= 1);
  // Switch metric to tokens and range to 30 days.
  await clickText("Tokens", ".segmented.small button");
  await clickText("30 Days", ".segmented.small button");
  await page.waitForTimeout(400);
  check("chart still present after switching", (await page.$(".chart svg path")) !== null);
  await shot("api-05-analytics");

  // 5. Provider page: capability matrix + its keys.
  await clickText("OpenRouter", ".nav-item");
  await page.waitForFunction(() => document.querySelector(".view h1")?.textContent?.includes("OpenRouter"));
  await page.waitForSelector(".cap-grid", { timeout: 8000 });
  const capText = await page.evaluate(() => document.querySelector(".cap-grid")?.innerText ?? "");
  check("capability grid shows Live for OpenRouter balance", capText.includes("Live"), capText.replace(/\n/g, " "));
  await shot("api-06-provider");

  // 6. Accounts view still fully functional after all the above.
  await clickText("Accounts", ".nav-item");
  await page.waitForFunction(() => document.querySelector(".view h1")?.textContent?.trim() === "Accounts");
  check("back to accounts, cards intact", (await page.$(".card")) !== null);

  console.log(failures === 0 ? "\nALL API CHECKS PASSED" : `\n${failures} FAILURE(S)`);
} catch (err) {
  await shot("api-99-failure");
  console.error("VERIFY-API FAILED:", err.message);
  failures++;
} finally {
  await app.close().catch(() => {});
  for (const f of ["api-keys.json", "api-keys-vault.json", "api-usage-snapshots.json"]) {
    fs.rmSync(path.join(appData, f), { force: true });
  }
}
process.exit(failures === 0 ? 0 : 1);
