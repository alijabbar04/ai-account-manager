import { useEffect, useState } from "react";
import type { ApiKeyState, Capability, LocalLedgerData, ProviderId, ProviderMeta } from "../../shared/types";
import ApiKeyCard from "../components/ApiKeyCard";
import ChartPanel from "../components/ChartPanel";
import { CAPABILITY_LABEL } from "../apiStatus";

export default function ProviderView({
  provider,
  meta,
  keys,
  now,
  showToast,
  onAddKey,
  onEditKey,
  onRemoveKey
}: {
  provider: ProviderId;
  meta: ProviderMeta | undefined;
  keys: ApiKeyState[] | null;
  now: number;
  showToast: (m: string) => void;
  onAddKey: (p: ProviderId) => void;
  onEditKey: (s: ApiKeyState) => void;
  onRemoveKey: (s: ApiKeyState) => void;
}) {
  if (!meta) return <div className="view"><div className="empty"><p>Unknown provider.</p></div></div>;
  const mine = (keys ?? []).filter((k) => k.record.provider === provider);

  const caps: Array<[string, Capability]> = [
    ["Balance / credits", meta.capabilities.balance],
    ["Usage (tokens/requests)", meta.capabilities.usage],
    ["Cost (USD)", meta.capabilities.cost],
    ["Rate limits", meta.capabilities.rateLimits]
  ];

  return (
    <div className="view">
      <header className="view-head">
        <div>
          <h1><span className="provider-dot" style={{ background: meta.accent }} /> {meta.displayName}</h1>
          <p className="view-sub">{mine.length} key{mine.length === 1 ? "" : "s"} · {meta.billingModel} billing</p>
        </div>
        <div className="view-actions">
          <button className="btn" onClick={() => void window.cam.openUsageGuide()}>📖 Usage guide</button>
          <button className="btn" onClick={() => void window.cam.apiKeys.refresh()}>↻ Refresh</button>
          <button className="btn btn-primary" onClick={() => onAddKey(provider)}>+ Add {meta.displayName} key</button>
        </div>
      </header>

      <section className="panel">
        <h3 className="panel-title">What this provider exposes</h3>
        <div className="cap-grid">
          {caps.map(([label, cap]) => (
            <div key={label} className="cap-item" data-cap={cap}>
              <span className="cap-label">{label}</span>
              <span className="cap-value">{CAPABILITY_LABEL[cap]}</span>
            </div>
          ))}
        </div>
        <p className="hint">
          {providerNote(provider)}{" "}
          <a href={meta.docsUrl} onClick={(e) => { e.preventDefault(); showToast("Opening provider docs in your browser…"); window.open(meta.docsUrl, "_blank"); }}>
            Provider docs ↗
          </a>
        </p>
      </section>

      {provider === "anthropic" && <LocalUsagePanel />}

      {mine.length === 0 ? (
        <div className="empty">
          <h2>No {meta.displayName} keys</h2>
          <p>Add one to start tracking it here.</p>
          <div className="empty-actions"><button className="btn btn-primary" onClick={() => onAddKey(provider)}>+ Add key</button></div>
        </div>
      ) : (
        <>
          <div className="grid">
            {mine.map((s) => (
              <ApiKeyCard
                key={s.record.id}
                state={s}
                now={now}
                onEdit={() => onEditKey(s)}
                onRemove={() => onRemoveKey(s)}
                onRefresh={() => void window.cam.apiKeys.refresh(s.record.id)}
                onOpenProvider={() => {}}
              />
            ))}
          </div>
          <ChartPanel keys={mine} now={now} />
        </>
      )}
    </div>
  );
}

/** Locally-measured Anthropic usage — the no-admin-key workaround.
 * The Lifted desktop tools record the exact `usage` block from every
 * Anthropic response into a shared ledger on this PC; this panel reads it,
 * so real spend shows up even though standard keys report no metrics. */
function LocalUsagePanel() {
  const [data, setData] = useState<LocalLedgerData | null>(null);
  useEffect(() => {
    void window.cam.apiKeys.localLedger().then(setData).catch(() => setData(null));
  }, []);
  const usd = (v: number) =>
    v >= 100 ? `$${v.toFixed(0)}` : v >= 1 ? `$${v.toFixed(2)}` : v > 0 ? `$${v.toFixed(4)}` : "$0.00";
  const windows: Array<["day" | "week" | "month" | "lifetime", string]> = [
    ["day", "Past 24h"], ["week", "7 days"], ["month", "30 days"], ["lifetime", "Lifetime"]
  ];
  return (
    <section className="panel">
      <h3 className="panel-title">Measured locally (no admin key needed)</h3>
      {!data || !data.available ? (
        <p className="hint">
          No locally measured usage yet. The Lifted desktop apps (Stage 2, PDF Splitter,
          AI Document Splitter, ApplAI, …) record the exact token usage of every Anthropic
          call they make into a shared ledger on this PC — once any of them makes a call,
          real spend appears here. Click “📖 Usage guide” above for the full picture.
        </p>
      ) : (
        <>
          <div className="cap-grid">
            {windows.map(([w, label]) => (
              <div key={w} className="cap-item" data-cap="exact">
                <span className="cap-label">{label}</span>
                <span className="cap-value">
                  {usd(data.cost[w])} · {data.calls[w].toLocaleString()} calls
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            {data.byApp.map(({ app, windows: aw }) => (
              <div key={app} style={{ display: "flex", gap: 12, fontSize: 13, padding: "2px 0" }}>
                <span style={{ minWidth: 190, opacity: 0.85 }}>{app}</span>
                <span>{usd(aw.day)} / 24h</span>
                <span>{usd(aw.week)} / 7d</span>
                <span>{usd(aw.month)} / 30d</span>
                <span>{usd(aw.lifetime)} lifetime</span>
              </div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            Exact token counts recorded from every API response by the desktop apps on this
            PC ({data.rows.toLocaleString()} calls since {data.since}); $ estimated from the
            price table. Covers calls made through those apps — not other machines or tools.
          </p>
        </>
      )}
    </section>
  );
}

function providerNote(p: ProviderId): string {
  switch (p) {
    case "openrouter":
      return "OpenRouter reports balance and rolling daily/weekly/monthly spend directly from your key — everything here is live.";
    case "anthropic":
      return "Anthropic only exposes spend & usage via an Admin/organization key (sk-ant-admin…) — a standard key validates but reports no metrics, and there is no balance API. Workaround: the 'Measured locally' panel below shows real usage recorded by the desktop apps on this PC. Full options: the “📖 Usage guide” button above.";
    case "openai":
      return "OpenAI exposes spend & usage only via an Admin key (sk-admin-…). Standard project keys can be validated but report no metrics; there is no balance API.";
    case "gemini":
      return "Google AI Studio keys are inference-only: no usage, cost, or balance API exists. Cost can only be estimated locally from a price table.";
    default:
      return "";
  }
}
