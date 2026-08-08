import type { AnalyticsSummary, ApiKeyState } from "../../shared/types";
import ChartPanel from "../components/ChartPanel";
import { fmtUsd } from "../format";
import { runwayText } from "../runway";

export default function AnalyticsView({
  keys,
  summary,
  now,
  onGoKeys
}: {
  keys: ApiKeyState[] | null;
  summary: AnalyticsSummary | null;
  now: number;
  onGoKeys: () => void;
}) {
  if (keys === null) return <div className="view"><div className="empty"><p>Loading…</p></div></div>;
  if (keys.length === 0) {
    return (
      <div className="view">
        <header className="view-head"><div><h1>Analytics</h1><p className="view-sub">Spend trends, projections, and runway</p></div></header>
        <div className="empty">
          <h2>No analytics yet</h2>
          <p>Add API keys to unlock spend trends, projected monthly cost, and credit runway.</p>
          <div className="empty-actions"><button className="btn btn-primary" onClick={onGoKeys}>+ Add an API key</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <header className="view-head">
        <div><h1>Analytics</h1><p className="view-sub">Spend trends, projections, and runway</p></div>
        <div className="view-actions"><button className="btn" onClick={() => void window.cam.apiKeys.refresh()}>↻ Refresh</button></div>
      </header>

      {summary && (
        <div className="summary-row">
          <SummaryTile label="Top spending provider" value={summary.topProvider ? summary.topProvider.displayName : "—"} hint={summary.topProvider ? `${fmtUsd(summary.topProvider.spendMonth)} this month` : "no spend recorded"} />
          <SummaryTile label="Avg daily spend" value={fmtUsd(summary.avgDailySpendUsd)} />
          <SummaryTile label="Projected monthly" value={fmtUsd(summary.projectedMonthlyUsd)} />
          <SummaryTile label="Most used model" value={summary.mostUsedModel ?? "—"} hint={summary.mostUsedModel ? undefined : "not reported by providers"} />
        </div>
      )}

      {summary?.shortestRunway && (
        <div className="headline-warning" data-kind={summary.shortestRunway.days < 7 ? "crit" : "warn"}>
          {runwayText(summary.shortestRunway.nickname, summary.shortestRunway.days)}
        </div>
      )}

      {summary && summary.perProviderMonthSpend.length > 0 && (
        <section className="panel">
          <h3 className="panel-title">Spend by provider — this month</h3>
          <div className="bars">
            {(() => {
              const max = Math.max(...summary.perProviderMonthSpend.map((p) => p.spend), 1e-9);
              return summary.perProviderMonthSpend.map((p) => (
                <div key={p.provider} className="bar-row">
                  <span className="bar-label">{p.displayName}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(2, (p.spend / max) * 100)}%` }} />
                  </div>
                  <span className="bar-value">{fmtUsd(p.spend)}</span>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      <ChartPanel keys={keys} now={now} />
    </div>
  );
}

function SummaryTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="summary-tile">
      <div className="summary-tile-label">{label}</div>
      <div className="summary-tile-value">{value}</div>
      {hint && <div className="summary-tile-hint">{hint}</div>}
    </div>
  );
}
