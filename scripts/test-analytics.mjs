/**
 * Unit tests for the API-analytics core: the snapshot-delta math, projections,
 * runway, status thresholds, key masking, and adapter format/capability
 * detection. Pure functions only — no Electron, no network. Run with `node`.
 *
 * The TS sources are bundled on the fly with esbuild so we test the real code.
 */
import { build } from "esbuild";
import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "scripts", ".test-analytics-bundle.mjs");

await build({
  entryPoints: [path.join(ROOT, "scripts", "analytics-entry.mjs")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: OUT,
  alias: { electron: path.join(ROOT, "scripts", "electron-stub.mjs") }
});

const mod = await import(pathToFileURL(OUT).href);
const {
  consumptionBetween,
  windowUsage,
  dailyBuckets,
  avgDailySpend,
  projectSpend,
  computeStatus,
  runwayPhrase,
  maskKey,
  anthropicAdapter,
  openAiAdapter,
  geminiAdapter,
  openRouterAdapter
} = mod;

let passed = 0;
let failed = 0;
function check(name, cond, detail = "") {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.log(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
function approx(a, b, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-09T12:00:00").getTime();

// --- consumptionBetween: cumulative deltas, reset-safe ---
{
  const series = [
    { at: NOW - 3 * DAY, value: 10 },
    { at: NOW - 2 * DAY, value: 14 },
    { at: NOW - 1 * DAY, value: 20 },
    { at: NOW, value: 26 }
  ];
  check("consumption full span = 16", approx(consumptionBetween(series, NOW - 3 * DAY, NOW), 16), String(consumptionBetween(series, NOW - 3 * DAY, NOW)));
  check("consumption last 24h uses baseline = 6", approx(consumptionBetween(series, NOW - 1 * DAY, NOW), 6));

  // Reset in the middle: value drops from 26 -> 5, then climbs to 9.
  const withReset = [...series, { at: NOW + 1, value: 5 }, { at: NOW + 2, value: 9 }];
  check("reset not counted as negative", approx(consumptionBetween(withReset, NOW - 3 * DAY, NOW + 2), 16 + 4), String(consumptionBetween(withReset, NOW - 3 * DAY, NOW + 2)));
}

// --- windowUsage today/week/lifetime ---
{
  // A sample sits just BEFORE the 7-day boundary (value 8), so windowed spend
  // uses the step-function convention: cumulativeAt(to) - cumulativeAt(from).
  const snaps = [
    { at: NOW - 20 * DAY, ok: true, lifetimeCostUsd: 0 },
    { at: NOW - 8 * DAY, ok: true, lifetimeCostUsd: 8 }, // before the week boundary
    { at: startOfDay(NOW) - 1, ok: true, lifetimeCostUsd: 12 }, // yesterday 23:59
    { at: NOW, ok: true, lifetimeCostUsd: 15 }
  ];
  const w = windowUsage(snaps, "cost", NOW);
  check("today = 3 (15-12)", approx(w.today, 3), String(w.today));
  check("week = 7 (15-8)", approx(w.week, 7), String(w.week));
  check("lifetime = 15", approx(w.lifetime, 15), String(w.lifetime));
}

// --- dailyBuckets: zero-filled, running total ---
{
  const snaps = [
    { at: startOfDay(NOW) - 2 * DAY, ok: true, lifetimeCostUsd: 0 },
    { at: startOfDay(NOW) - 2 * DAY + 3600e3, ok: true, lifetimeCostUsd: 2 },
    { at: startOfDay(NOW), ok: true, lifetimeCostUsd: 5 },
    { at: NOW, ok: true, lifetimeCostUsd: 9 }
  ];
  const buckets = dailyBuckets(snaps, "cost", 3, NOW);
  check("3 day buckets", buckets.length === 3, String(buckets.length));
  check("today's daily = 4 (9-5)", approx(buckets[2].daily, 4), String(buckets[2].daily));
  check("running total monotonic", buckets[0].running <= buckets[1].running && buckets[1].running <= buckets[2].running);
}

// --- avgDailySpend + projection + runway ---
{
  const snaps = [
    { at: NOW - 10 * DAY, ok: true, lifetimeCostUsd: 0, balanceUsd: 50 },
    { at: NOW, ok: true, lifetimeCostUsd: 20, balanceUsd: 50 }
  ];
  const avg = avgDailySpend(snaps, NOW, 14);
  check("avg daily spend = 2/day", approx(avg, 2), String(avg));
  const proj = projectSpend(snaps, 50, NOW);
  check("projected monthly = 60", approx(proj.projectedMonthlyUsd, 60), String(proj.projectedMonthlyUsd));
  check("runway = 25 days", approx(proj.runwayDays, 25), String(proj.runwayDays));
}

// --- computeStatus thresholds ---
{
  const base = { record: { monthlyBudgetUsd: null }, latest: { ok: true }, monthSpend: 0, balanceUsd: 100 };
  check("green when healthy runway", computeStatus({ ...base, runwayDays: 60 }) === "green");
  check("yellow when runway < 21", computeStatus({ ...base, runwayDays: 14 }) === "yellow");
  check("red when runway < 7", computeStatus({ ...base, runwayDays: 3 }) === "red");
  check("unknown when no snapshot", computeStatus({ ...base, latest: null, runwayDays: null }) === "unknown");
  check(
    "budget 80% -> yellow",
    computeStatus({ record: { monthlyBudgetUsd: 100 }, latest: { ok: true }, monthSpend: 85, runwayDays: null, balanceUsd: null }) === "yellow"
  );
  check(
    "budget over -> red",
    computeStatus({ record: { monthlyBudgetUsd: 100 }, latest: { ok: true }, monthSpend: 120, runwayDays: null, balanceUsd: null }) === "red"
  );
}

// --- runway phrasing matches the brief ---
check("runway phrase mentions days", (runwayPhrase(42) ?? "").includes("42 days"));
check("null runway -> null phrase", runwayPhrase(null) === null);

// --- key masking: prefix + last 4, no middle leak ---
{
  const m = maskKey("sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234");
  check("mask keeps prefix", m.startsWith("sk-ant-"), m);
  check("mask keeps last 4", m.endsWith("1234"), m);
  check("mask hides middle", !m.includes("mnop"), m);
  check("short secret fully masked", /^\*+$/.test(maskKey("abc")));
}

// --- adapter format + capability detection (offline) ---
check("openrouter accepts sk-or-", openRouterAdapter.detectKeyKind("sk-or-v1-xxxx").valid);
check("openrouter rejects other", !openRouterAdapter.detectKeyKind("sk-proj-x").valid);
check("anthropic admin detected", anthropicAdapter.detectKeyKind("sk-ant-admin01-x").isAdminKey);
check("anthropic standard not admin", !anthropicAdapter.detectKeyKind("sk-ant-api03-x").isAdminKey);
check("openai admin detected", openAiAdapter.detectKeyKind("sk-admin-x").isAdminKey);
check("gemini caps: cost estimated", geminiAdapter.meta.capabilities.cost === "estimated");
check("openrouter caps: balance exact", openRouterAdapter.meta.capabilities.balance === "exact");
check("anthropic caps: cost admin", anthropicAdapter.meta.capabilities.cost === "admin");

function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

fs.rmSync(OUT, { force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
