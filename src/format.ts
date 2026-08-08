export function timeAgo(epochMs: number | undefined, now: number): string {
  if (!epochMs) return "never";
  const s = Math.max(0, Math.floor((now - epochMs) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(epochMs).toLocaleDateString();
}

/** "3d 12h" / "2h 05m" / "12m" countdown until an ISO timestamp. */
export function countdown(iso: string | undefined, now: number): string | null {
  if (!iso) return null;
  const target = Date.parse(iso);
  if (!Number.isFinite(target)) return null;
  let s = Math.floor((target - now) / 1000);
  if (s <= 0) return "now";
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

export function fmtCredits(minor: number | undefined, currency = "USD", decimals = 2): string {
  if (minor === undefined) return "";
  const value = minor / Math.pow(10, decimals);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(decimals)} ${currency}`;
  }
}

export function fmtTokens(n: number | undefined): string {
  if (!n) return "0";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

export function titleCase(s: string | undefined): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtUsd(n: number | null | undefined, opts: { sign?: boolean } = {}): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  // Show more precision for tiny amounts so "today: $0.02" isn't "$0.00".
  const digits = abs > 0 && abs < 1 ? (abs < 0.01 ? 4 : 3) : 2;
  const formatted = n.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
  return opts.sign && n > 0 ? `+${formatted}` : formatted;
}

export function fmtMetric(metric: "cost" | "tokens" | "requests", value: number): string {
  if (metric === "cost") return fmtUsd(value);
  if (metric === "tokens") return fmtTokens(value);
  return value.toLocaleString();
}

export function fmtRunway(days: number | null): string {
  if (days === null || !Number.isFinite(days)) return "—";
  if (days >= 365) return "1yr+";
  if (days >= 60) return `${Math.round(days)}d`;
  return `${Math.floor(days)}d`;
}
