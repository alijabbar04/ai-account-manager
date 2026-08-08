import { useEffect, useRef, useState } from "react";
import type { ApiKeyState } from "../../shared/types";
import { fmtRunway, fmtUsd, timeAgo } from "../format";
import { STATUS_LABEL, statusReason } from "../apiStatus";

interface Props {
  state: ApiKeyState;
  now: number;
  onEdit: () => void;
  onRemove: () => void;
  onRefresh: () => void;
  onOpenProvider: () => void;
}

export default function ApiKeyCard({ state, now, onEdit, onRemove, onRefresh, onOpenProvider }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { record, meta, status } = state;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const cost = state.usage.cost;
  const budget = record.monthlyBudgetUsd ?? null;
  const budgetPct = budget && budget > 0 ? Math.min(100, (cost.month / budget) * 100) : null;

  return (
    <article className="card apikey-card" data-status={status}>
      <header className="card-head">
        <span className="dot" data-kind={status} aria-hidden="true" />
        <h3 className="card-name" title={record.maskedKey}>{record.nickname}</h3>
        <span className="provider-tag" style={{ ["--pill-accent" as string]: meta.accent }}>{meta.displayName}</span>
        {record.isAdminKey && <span className="badge badge-default">admin</span>}
        <span className="status-label" data-kind={status}>{STATUS_LABEL[status]}</span>
        <div className="menu-wrap" ref={menuRef}>
          <button className="btn btn-icon" aria-label="Key menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>⋯</button>
          {menuOpen && (
            <div className="menu" role="menu">
              <button role="menuitem" onClick={() => { setMenuOpen(false); onRefresh(); }}>Refresh now</button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); onOpenProvider(); }}>Open provider page</button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); onEdit(); }}>Edit…</button>
              <button role="menuitem" className="danger" onClick={() => { setMenuOpen(false); onRemove(); }}>Remove…</button>
            </div>
          )}
        </div>
      </header>

      <div className="card-sub"><code>{record.maskedKey}</code></div>

      <div className="apikey-stats">
        {state.balanceUsd !== null ? (
          <Stat label={meta.billingModel === "prepaid" ? "Balance" : "Credits"} value={fmtUsd(state.balanceUsd)} strong />
        ) : (
          <Stat label="Balance" value="n/a" muted title="No balance API for this provider" />
        )}
        <Stat label="Today" value={fmtUsd(cost.today)} />
        <Stat label="Week" value={fmtUsd(cost.week)} />
        <Stat label="Month" value={fmtUsd(cost.month)} />
      </div>

      {budgetPct !== null && (
        <div className="meter">
          <div className="meter-top">
            <span className="meter-label">Monthly budget</span>
            <span className="meter-pct">{Math.round(budgetPct)}%</span>
          </div>
          <div className="meter-track">
            <div className="meter-fill" data-kind={status === "unknown" ? "ok" : status === "green" ? "ok" : status === "yellow" ? "warn" : "crit"} style={{ width: `${Math.max(2, budgetPct)}%` }} />
          </div>
        </div>
      )}

      {state.runwayDays !== null && (
        <div className="runway-line">Runway <b>{fmtRunway(state.runwayDays)}</b> · projected month {fmtUsd(state.projectedMonthlyUsd)}</div>
      )}

      <div className="card-meta">
        <span>{statusReason(state)}</span>
      </div>
      <div className="card-meta subtle">
        <span>{state.lastUpdated ? `updated ${timeAgo(state.lastUpdated, now)}` : "never updated"}</span>
        {!state.derivedFromSnapshots && state.latest?.ok && <><span className="sep">·</span><span>live windows</span></>}
      </div>
    </article>
  );
}

function Stat({ label, value, strong, muted, title }: { label: string; value: string; strong?: boolean; muted?: boolean; title?: string }) {
  return (
    <div className="stat" title={title}>
      <div className={`stat-value${strong ? " strong" : ""}${muted ? " muted" : ""}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
