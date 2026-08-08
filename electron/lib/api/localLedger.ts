// Local measured usage — the workaround for Anthropic's admin-key-only
// usage API. Several in-house desktop tools record the exact `usage` block
// of every Anthropic API response into a shared JSONL ledger
// (%APPDATA%\LiftedPDFTools\api_usage*.jsonl). Reading it gives REAL,
// locally-measured Anthropic usage without needing an sk-ant-admin key —
// covering every call made through those apps on this machine. If the
// ledger directory does not exist, the panel simply reports unavailable.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { LocalLedgerData, LocalLedgerWindow } from "../../../shared/types";

const DIR = path.join(
  process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"),
  "LiftedPDFTools"
);

// USD per MTok — mirrors the ledger apps' price table.
const PRICES: Array<[string, number, number]> = [
  ["haiku", 1.0, 5.0],
  ["sonnet", 3.0, 15.0],
  ["opus", 15.0, 75.0],
  ["fable", 15.0, 75.0]
];

interface Row {
  ts: string;
  app: string;
  model: string;
  in: number;
  out: number;
  cw: number;
  cr: number;
  batch: number;
  _dt: number;
  _cost: number;
}

function costOf(r: Omit<Row, "_dt" | "_cost">): number {
  const m = (r.model ?? "").toLowerCase();
  let pin = 3.0;
  let pout = 15.0;
  for (const [sub, i, o] of PRICES) {
    if (m.includes(sub)) {
      pin = i;
      pout = o;
      break;
    }
  }
  const usd =
    ((r.in || 0) / 1e6) * pin +
    ((r.cw || 0) / 1e6) * pin * 1.25 +
    ((r.cr || 0) / 1e6) * pin * 0.1 +
    ((r.out || 0) / 1e6) * pout;
  return usd * (r.batch ? 0.5 : 1);
}

function loadRows(): Row[] {
  const rows: Row[] = [];
  let files: string[] = [];
  try {
    files = fs
      .readdirSync(DIR)
      .filter((f) => /^api_usage.*\.jsonl$/.test(f))
      .map((f) => path.join(DIR, f));
  } catch {
    return rows;
  }
  for (const file of files) {
    let text = "";
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line) as Omit<Row, "_dt" | "_cost">;
        const dt = new Date(r.ts).getTime();
        if (Number.isNaN(dt)) continue;
        rows.push({ ...r, _dt: dt, _cost: costOf(r) });
      } catch {
        /* skip corrupt lines */
      }
    }
  }
  rows.sort((a, b) => a._dt - b._dt);
  return rows;
}

const WINDOWS: Array<[keyof LocalLedgerWindow & string, number | null]> = [
  ["day", 1],
  ["week", 7],
  ["month", 30],
  ["lifetime", null]
];

export function readLocalLedger(): LocalLedgerData {
  const rows = loadRows();
  const now = Date.now();
  const empty = (): LocalLedgerWindow => ({ day: 0, week: 0, month: 0, lifetime: 0 });
  const cost = empty();
  const calls = empty();
  const perApp = new Map<string, LocalLedgerWindow>();
  for (const r of rows) {
    for (const [w, days] of WINDOWS) {
      if (days !== null && r._dt < now - days * 86400e3) continue;
      cost[w] += r._cost;
      calls[w] += 1;
      let a = perApp.get(r.app || "unknown");
      if (!a) {
        a = empty();
        perApp.set(r.app || "unknown", a);
      }
      a[w] += r._cost;
    }
  }
  return {
    available: rows.length > 0,
    rows: rows.length,
    since: rows.length ? rows[0].ts.slice(0, 10) : "",
    ledgerDir: DIR,
    cost,
    calls,
    byApp: [...perApp.entries()]
      .map(([app, windows]) => ({ app, windows }))
      .sort((a, b) => b.windows.lifetime - a.windows.lifetime)
  };
}
