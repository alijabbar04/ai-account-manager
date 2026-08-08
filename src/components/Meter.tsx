import type { UsageLimit } from "../../shared/types";
import { countdown } from "../format";
import { limitLabel, severityRank } from "../status";

interface Props {
  limit: UsageLimit;
  now: number;
}

export default function Meter({ limit, now }: Props) {
  const kind = severityRank(limit.severity, limit.percent);
  const pct = Math.max(0, Math.min(100, limit.percent));
  const reset = countdown(limit.resetsAt, now);
  return (
    <div className="meter">
      <div className="meter-top">
        <span className="meter-label">{limitLabel(limit)}</span>
        <span className="meter-reset">{reset ? (reset === "now" ? "resets now" : `resets in ${reset}`) : ""}</span>
        <span className="meter-pct">{Math.round(limit.percent)}%</span>
      </div>
      <div
        className="meter-track"
        role="progressbar"
        aria-valuenow={Math.round(limit.percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={limitLabel(limit)}
      >
        <div className="meter-fill" data-kind={kind} style={{ width: `${pct === 0 ? 0 : Math.max(2, pct)}%` }} />
      </div>
    </div>
  );
}
