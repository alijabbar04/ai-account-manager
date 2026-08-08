import type { AnalyticsSummary, ApiKeyState, ProviderId } from "../../shared/types";
import { fmtRunway, fmtUsd, timeAgo } from "../format";

export default function ApiDashboardView({
  keys,
  summary,
  now,
  onOpenProvider,
  onGoKeys
}: {
  keys: ApiKeyState[] | null;
  summary: AnalyticsSummary | null;
  now: number;
  onOpenProvider: (p: ProviderId) => void;
  onGoKeys: () => void;
}) {
  if (keys === null) return <div className="view"><div className="empty"><p>Loading…</p></div></div>;

  if (keys.length === 0) {
    return (
      <div className="view">
        <header className="view-head"><div><h1>API Dashboard</h1><p className="view-sub">Balances and spend across your providers</p></div></header>
        <div className="empty">
          <h2>Nothing to show yet</h2>
          <p>Add an API key to see balances, daily and weekly spend, and runway projections here.</p>
          <div className="empty-actions"><button className="btn btn-primary" onClick={onGoKeys}>+ Add an API key</button></div>
        </div>
      </div>
    );
  }

  const runway = summary?.shortestRunway ?? null;

  return (
    <div className="view">
      <header className="view-head">
        <div><h1>API Dashboard</h1><p className="view-sub">Balances and spend across your providers</p></div>
        <div className="view-actions">
          <button className="btn" onClick={() => void window.cam.apiKeys.refresh()}>↻ Refresh</button>
        </div>
      </header>

      {runway && runway.days < 30 && (
        <div className="headline-warning" data-kind={runway.days < 7 ? "crit" : "warn"}>
          <strong>Heads up:</strong> your <b>{runway.nickname}</b> credits are projected to last{" "}
          <b>{Math.floor(runway.days)} day{Math.floor(runway.days) === 1 ? "" : "s"}</b> at the current burn rate.
        </div>
      )}

      {summary && (
        <div className="summary-row">
          <SummaryTile label="Total balance" value={fmtUsd(summary.totalBalanceUsd)} hint="Across prepaid providers" />
          <SummaryTile label="Spend today" value={fmtUsd(summary.spendToday)} />
          <SummaryTile label="Spend this week" value={fmtUsd(summary.spendWeek)} />
          <SummaryTile label="Projected month" value={fmtUsd(summary.projectedMonthlyUsd)} hint={`${fmtUsd(summary.avgDailySpendUsd)}/day avg`} />
        </div>
      )}

      <div className="dash-cards">
        {keys.map((s) => (
          <button key={s.record.id} className="dash-card" onClick={() => onOpenProvider(s.record.provider)} data-status={s.status}>
            <div className="dash-card-head">
              <span className="dot" data-kind={s.status} aria-hidden="true" />
              <span className="dash-card-provider" style={{ ["--pill-accent" as string]: s.meta.accent }}>{s.meta.displayName}</span>
              <span className="dash-card-nick">{s.record.nickname}</span>
            </div>
            <div className="dash-card-balance">
              {s.balanceUsd !== null ? (
                <>
                  <span className="dash-balance-value">{fmtUsd(s.balanceUsd)}</span>
                  <span className="dash-balance-label">{s.meta.billingModel === "prepaid" ? "credits" : "balance"}</span>
                </>
              ) : (
                <span className="dash-balance-value muted">{fmtUsd(s.usage.cost.month)}<span className="dash-balance-label"> this month</span></span>
              )}
            </div>
            <div className="dash-card-row">
              <span>Today {fmtUsd(s.usage.cost.today)}</span>
              <span>Week {fmtUsd(s.usage.cost.week)}</span>
              {s.runwayDays !== null && <span>Runway {fmtRunway(s.runwayDays)}</span>}
            </div>
            <div className="dash-card-foot">{s.lastUpdated ? `updated ${timeAgo(s.lastUpdated, now)}` : "not yet updated"}</div>
          </button>
        ))}
      </div>
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
