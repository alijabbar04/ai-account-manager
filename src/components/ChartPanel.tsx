import { useEffect, useState } from "react";
import type { ApiKeyState, ChartSeries, MetricKind, RangeKind } from "../../shared/types";
import Chart from "./Chart";

const METRICS: MetricKind[] = ["cost", "tokens", "requests"];
const RANGES: RangeKind[] = ["1d", "7d", "30d", "lifetime"];
const RANGE_LABEL: Record<RangeKind, string> = { "1d": "1 Day", "7d": "7 Days", "30d": "30 Days", lifetime: "Lifetime" };
const METRIC_LABEL: Record<MetricKind, string> = { cost: "Cost", tokens: "Tokens", requests: "Requests" };

/** Full chart panel with the metric/range/type/mode switchers from the brief. */
export default function ChartPanel({ keys, now }: { keys: ApiKeyState[]; now: number }) {
  const [keyId, setKeyId] = useState<string>(keys[0]?.record.id ?? "");
  const [metric, setMetric] = useState<MetricKind>("cost");
  const [range, setRange] = useState<RangeKind>("7d");
  const [chartType, setChartType] = useState<"line" | "area">("area");
  const [mode, setMode] = useState<"daily" | "running">("daily");
  const [series, setSeries] = useState<ChartSeries | null>(null);

  // Keep a valid selected key as the set changes.
  useEffect(() => {
    if (!keys.some((k) => k.record.id === keyId)) setKeyId(keys[0]?.record.id ?? "");
  }, [keys, keyId]);

  useEffect(() => {
    if (!keyId) {
      setSeries(null);
      return;
    }
    let live = true;
    void window.cam.apiKeys.chart(keyId, metric, range).then((s) => {
      if (live) setSeries(s);
    });
    return () => {
      live = false;
    };
  }, [keyId, metric, range, now]);

  const active = keys.find((k) => k.record.id === keyId);
  const color = active?.meta.accent ?? "#2a78d6";

  if (keys.length === 0) return null;

  return (
    <section className="panel chart-panel">
      <div className="chart-controls">
        <div className="chart-control-group">
          <label className="mini-label">Key</label>
          <select className="select" value={keyId} onChange={(e) => setKeyId(e.target.value)}>
            {keys.map((k) => (
              <option key={k.record.id} value={k.record.id}>
                {k.record.nickname} ({k.meta.displayName})
              </option>
            ))}
          </select>
        </div>
        <Segmented label="Metric" options={METRICS} value={metric} onChange={setMetric} render={(m) => METRIC_LABEL[m]} />
        <Segmented label="Range" options={RANGES} value={range} onChange={setRange} render={(r) => RANGE_LABEL[r]} />
        <Segmented label="Type" options={["line", "area"] as const} value={chartType} onChange={setChartType} render={(t) => (t === "line" ? "Line" : "Area")} />
        <Segmented label="Total" options={["daily", "running"] as const} value={mode} onChange={setMode} render={(m) => (m === "daily" ? "Daily" : "Running")} />
      </div>

      {series && series.buckets.length > 0 ? (
        <>
          <Chart buckets={series.buckets} mode={mode} chartType={chartType} metric={metric} color={color} />
          {series.sparse && (
            <p className="chart-note">
              Only a short history has been recorded so far — the trend fills in as more snapshots are collected
              {metric !== "cost" && active && active.meta.capabilities.usage !== "exact" && active.meta.capabilities.usage !== "admin"
                ? `, and ${METRIC_LABEL[metric].toLowerCase()} isn't reported by ${active.meta.displayName}.`
                : "."}
            </p>
          )}
        </>
      ) : (
        <div className="chart-empty">No data recorded yet for this selection.</div>
      )}
    </section>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  render
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  render: (v: T) => string;
}) {
  return (
    <div className="chart-control-group">
      <label className="mini-label">{label}</label>
      <div className="segmented small">
        {options.map((o) => (
          <button key={o} data-active={o === value || undefined} onClick={() => onChange(o)}>
            {render(o)}
          </button>
        ))}
      </div>
    </div>
  );
}
