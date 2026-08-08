/**
 * End-to-end UI verification: launches the built app with Playwright's
 * Electron driver, walks the main flows, and drops screenshots into
 * scripts/shots/. Run `npm run build` first.
 */
import { _electron as electron } from "playwright-core";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

const APP_DIR = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(APP_DIR, "scripts", "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE; // set when running inside Claude Code; breaks `electron .`
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

const clickText = (text) =>
  page.evaluate((t) => {
    const els = [...document.querySelectorAll("button")];
    const el = els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t));
    if (!el) return "NOT_FOUND";
    el.click();
    return "OK";
  }, text);

/** Click a button inside the card whose name matches. */
const clickInCard = (cardName, buttonText) =>
  page.evaluate(
    ([name, t]) => {
      const card = [...document.querySelectorAll(".card")].find(
        (c) => c.querySelector(".card-name")?.textContent?.trim() === name
      );
      if (!card) return "CARD_NOT_FOUND";
      const els = [...card.querySelectorAll("button")];
      const el = els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t));
      if (!el) return "BTN_NOT_FOUND";
      el.click();
      return "OK";
    },
    [cardName, buttonText]
  );

const setInput = (selector, value) =>
  page.evaluate(
    ([sel, v]) => {
      const input = document.querySelector(sel);
      if (!input) return "NOT_FOUND";
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return "OK";
    },
    [selector, value]
  );

const themeIs = (t) => page.evaluate((x) => document.documentElement.dataset.theme === x, t);
const cycleThemeTo = async (target) => {
  for (let i = 0; i < 4; i++) {
    if (await themeIs(target)) return true;
    // Theme toggle now lives in the sidebar footer.
    await page.evaluate(() => document.querySelector(".sidebar-foot .btn-icon")?.click());
    await page.waitForTimeout(250);
  }
  return themeIs(target);
};

const userEnvVar = () =>
  execFileSync(
    "powershell.exe",
    ["-NoProfile", "-Command", "[Environment]::GetEnvironmentVariable('CLAUDE_CONFIG_DIR','User')"],
    { encoding: "utf8" }
  ).trim();

const importDir = path.join(os.tmpdir(), "cam-verify-import", ".claude-imported");
fs.mkdirSync(importDir, { recursive: true });

// Pre-run cleanup: drop artifacts a previously failed run may have left behind.
const storeFile = path.join(process.env.APPDATA, "AIAccountManager", "profiles.json");
try {
  const store = JSON.parse(fs.readFileSync(storeFile, "utf8"));
  const before = store.profiles.length;
  store.profiles = store.profiles.filter(
    (p) => p.name !== "Temp Imported" && !p.configDir.toLowerCase().includes("cam-verify-import")
  );
  if (store.profiles.length !== before) {
    fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
    console.log("pre-run cleanup: removed stale test profile");
  }
} catch {
  /* no store yet */
}
if (userEnvVar().toLowerCase().includes("cam-verify-import")) {
  execFileSync("powershell.exe", [
    "-NoProfile",
    "-Command",
    "[Environment]::SetEnvironmentVariable('CLAUDE_CONFIG_DIR', $null, 'User')"
  ]);
  console.log("pre-run cleanup: cleared stale env var");
}

try {
  // 1. Dashboard with live usage (meters appear once the API answers).
  await page.waitForSelector(".card", { timeout: 15_000 });
  console.log("card rendered");
  await page.waitForSelector(".meter-fill", { timeout: 25_000, state: "attached" });
  console.log("usage meters rendered");
  console.log("--- card text ---");
  console.log(await page.evaluate(() => document.querySelector(".card")?.innerText));
  console.log("-----------------");

  // The home ~\.claude profile must read as effective default with no env var set.
  if (userEnvVar() !== "") throw new Error("precondition: user CLAUDE_CONFIG_DIR should be unset");
  await page.waitForSelector(".badge-default", { timeout: 5_000 });
  console.log("home profile shows as effective default");

  // 2. Themes.
  if (!(await cycleThemeTo("light"))) throw new Error("could not reach light theme");
  await shot("01-dashboard-light");
  if (!(await cycleThemeTo("dark"))) throw new Error("could not reach dark theme");
  await shot("02-dashboard-dark");

  // 3. Search filtering.
  await setInput(".search input", "zzz-no-match");
  await page.waitForSelector(".empty", { timeout: 5_000 });
  console.log("search filter works (no-match state)");
  await setInput(".search input", "");
  await page.waitForSelector(".card", { timeout: 5_000 });

  // 4. Import an existing dir as a second account (drives the real dialog).
  await clickText("+ Add account");
  await page.waitForSelector(".dialog", { timeout: 5_000 });
  await shot("03-add-dialog");
  await clickText("Import existing");
  await page.waitForSelector(".pathrow", { timeout: 5_000 });
  await setInput(".dialog .field input", "Temp Imported");
  await setInput(".pathrow input", importDir);
  await shot("04-import-tab");
  await clickText("Import account");
  await page.waitForFunction(() => !document.querySelector(".dialog"), { timeout: 10_000 });
  await page.waitForFunction(
    () => [...document.querySelectorAll(".card-name")].some((e) => e.textContent.trim() === "Temp Imported"),
    { timeout: 10_000 }
  );
  console.log("import flow works; second card rendered (logged-out state)");
  await shot("05-two-accounts");

  // 5. Set Default on the imported (non-home) profile writes the env var.
  //    (Logged-out cards expose this via the account menu.)
  const openCardMenu = (name) =>
    page.evaluate((n) => {
      const card = [...document.querySelectorAll(".card")].find(
        (c) => c.querySelector(".card-name")?.textContent?.trim() === n
      );
      if (!card) return "CARD_NOT_FOUND";
      card.querySelector(".btn-icon[aria-label='Account menu']").click();
      return "OK";
    }, name);
  // The user-level CLAUDE_CONFIG_DIR env var is the real product behavior; poll
  // it (source of truth) rather than racing the DOM badge across many cards.
  const pollEnv = async (predicate, label) => {
    for (let i = 0; i < 20; i++) {
      if (predicate(userEnvVar())) return true;
      await page.waitForTimeout(500);
    }
    throw new Error(`${label} (env was ${JSON.stringify(userEnvVar())})`);
  };

  if ((await openCardMenu("Temp Imported")) !== "OK") throw new Error("card menu not found");
  await page.waitForSelector(".menu", { timeout: 5_000 });
  if ((await clickText("Set as default")) !== "OK") throw new Error("Set as default menu item not found");
  await pollEnv((v) => v.toLowerCase() === importDir.toLowerCase(), "Set Default did not write env var");
  console.log("env after set:", JSON.stringify(userEnvVar()));
  // Let the renderer reflect the new default before we act on the menu again,
  // so the menu shows "Clear default" rather than the stale "Set as default".
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".card")]
        .find((c) => c.querySelector(".card-name")?.textContent?.trim() === "Temp Imported")
        ?.querySelector(".badge-default") != null,
    undefined,
    { timeout: 15_000 }
  );
  await shot("06-default-on-imported");

  // 6. Clearing default removes the env var; home profile becomes default again.
  if ((await openCardMenu("Temp Imported")) !== "OK") throw new Error("card menu not found");
  await page.waitForSelector(".menu", { timeout: 5_000 });
  if ((await clickText("Clear default")) !== "OK") throw new Error("Clear default menu item not found");
  await pollEnv((v) => v === "", "Clear Default did not remove env var");
  console.log("env after clear:", JSON.stringify(userEnvVar()));

  // 7. Remove the imported profile via the card menu + dialog.
  await page.evaluate(() => {
    const card = [...document.querySelectorAll(".card")].find(
      (c) => c.querySelector(".card-name")?.textContent?.trim() === "Temp Imported"
    );
    card.querySelector(".btn-icon[aria-label='Account menu']").click();
  });
  await page.waitForSelector(".menu", { timeout: 5_000 });
  await clickText("Remove…");
  await page.waitForSelector(".dialog", { timeout: 5_000 });
  await shot("07-remove-dialog");
  await clickText("Remove from list");
  await page.waitForFunction(
    () => ![...document.querySelectorAll(".card-name")].some((e) => e.textContent.trim() === "Temp Imported"),
    { timeout: 10_000 }
  );
  console.log("remove flow works");

  console.log("ALL CHECKS PASSED");
} catch (err) {
  await shot("99-failure");
  console.error("VERIFY FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await app.close().catch(() => {});
  fs.rmSync(path.dirname(importDir), { recursive: true, force: true });
}
