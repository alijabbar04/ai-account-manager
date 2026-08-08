import { useMemo, useRef, useState } from "react";
import type { DayBucket, MetricKind } from "../../shared/types";
import { fmtMetric } from "../format";

interface Props {
  buckets: DayBucket[];
  mode: "daily" | "running";
  chartType: "line" | "area";
  metric: MetricKind;
  color: string;
  height?: number;
}

const PAD = { top: 14, right: 14, bottom: 22, left: 48 };

/**
 * Dependency-free SVG trend chart. One series (title names it, so no legend),
 * thin 2px stroke, soft area fill, recessive gridlines, and a hover crosshair
 * with tooltip — per the data-viz method. Renders in the viewer's theme via
 * currentColor-derived tokens passed as the `color` prop and CSS vars.
 */
export default function Chart({ buckets, mode, chartType, metric, color, height = 200 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = 640; // viewBox width; SVG scales to container via width:100%

  const values = buckets.map((b) => (mode === "daily" ? b.daily : b.running));
  const maxVal = Math.max(1e-9, ...values);
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const points = useMemo(
    () =>
      values.map((v, i) => {
        const x = PAD.left + (values.length <= 1 ? plotW / 2 : (i / (values.length - 1)) * plotW);
        const y = PAD.top + plotH - (v / maxVal) * plotH;
        return { x, y, v, date: buckets[i]?.date ?? "" };
      }),
    [values, maxVal, plotW, plotH, buckets]
  );

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${points[0].x.toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`
      : "";

  // Y-axis ticks (0, mid, max).
  const yTicks = [0, maxVal / 2, maxVal].map((v) => ({
    v,
    y: PAD.top + plotH - (v / maxVal) * plotH
  }));

  // X labels: first, middle, last (avoid clutter).
  const xLabelIdx = points.length <= 1 ? [0] : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].x - relX);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setHover(nearest);
  };

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="chart" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${mode === "daily" ? "Daily" : "Cumulative"} ${metric} trend`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines + y labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={width - PAD.right} y2={t.y} className="chart-grid" />
            <text x={PAD.left - 6} y={t.y + 3} textAnchor="end" className="chart-axis-label">
              {fmtMetric(metric, t.v)}
            </text>
          </g>
        ))}

        {/* area fill */}
        {chartType === "area" && areaPath && <path d={areaPath} fill={color} opacity={0.14} />}

        {/* main line */}
        {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

        {/* single-point marker */}
        {points.length === 1 && <circle cx={points[0].x} cy={points[0].y} r={4} fill={color} />}

        {/* x labels */}
        {xLabelIdx.map((i) => (
          <text key={i} x={points[i]?.x ?? 0} y={height - 6} textAnchor="middle" className="chart-axis-label">
            {shortDate(points[i]?.date)}
          </text>
        ))}

        {/* hover crosshair + dot */}
        {hp && (
          <g>
            <line x1={hp.x} y1={PAD.top} x2={hp.x} y2={PAD.top + plotH} className="chart-crosshair" />
            <circle cx={hp.x} cy={hp.y} r={4} fill={color} stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hp && (
        <div
          className="chart-tooltip"
          style={{ left: `${(hp.x / width) * 100}%`, top: `${(hp.y / height) * 100}%` }}
        >
          <div className="chart-tooltip-date">{longDate(hp.date)}</div>
          <div className="chart-tooltip-val">{fmtMetric(metric, hp.v)}</div>
        </div>
      )}
    </div>
  );
}

function shortDate(iso: string | undefined): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function longDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
