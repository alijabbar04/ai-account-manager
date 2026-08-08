import { useEffect, useState } from "react";
import type { ProfileState } from "../../shared/types";
import AccountCard from "../components/AccountCard";
import { RemoveDialog, RenameDialog } from "../components/Dialogs";
import { timeAgo } from "../format";

type DialogState =
  | { type: "rename"; state: ProfileState }
  | { type: "remove"; state: ProfileState }
  | null;

/**
 * Main dashboard: puts the DEFAULT Claude Code account front and centre.
 * All other accounts live on the "Other Accounts" view — setting or clearing
 * the default simply moves the card between the two views on the next render.
 */
export default function DashboardView({
  now,
  showToast,
  onGoAccounts
}: {
  now: number;
  showToast: (m: string) => void;
  onGoAccounts: () => void;
}) {
  const [states, setStates] = useState<ProfileState[] | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void window.cam.listStates().then(setStates);
    return window.cam.onStateChanged(setStates);
  }, []);

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await window.cam.refreshUsage();
    } finally {
      setRefreshing(false);
    }
  };

  const launch = async (kind: "claude" | "vscode" | "powershell" | "login", profileId: string) => {
    const res = await window.cam.launch(kind, profileId);
    if (!res.ok && res.error) showToast(res.error);
  };

  const setDefault = async (profileId: string, makeDefault: boolean) => {
    const res = await window.cam.setDefault(makeDefault ? profileId : null);
    if (!res.ok && res.error) showToast(res.error);
    else showToast(makeDefault ? "Default set. New terminals will use this account." : "Default cleared. New terminals will use ~/.claude.");
  };

  const primary = states?.find((s) => s.isDefault) ?? null;
  const otherCount = states ? states.filter((s) => !s.isDefault).length : 0;

  return (
    <div className="view">
      <header className="view-head">
        <div>
          <h1>Dashboard</h1>
          <p className="view-sub">{states === null ? "Loading…" : primary ? "Your default Claude Code account" : "No default account set"}</p>
        </div>
        <div className="view-actions">
          <button className="btn" onClick={() => void refreshAll()} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </header>

      {states === null ? (
        <div className="empty"><p>Loading accounts…</p></div>
      ) : states.length === 0 ? (
        <div className="empty">
          <h2>No accounts yet</h2>
          <p>Each account is an isolated Claude Code profile folder (its own <code>CLAUDE_CONFIG_DIR</code>).</p>
          <div className="empty-actions"><button className="btn btn-primary" onClick={onGoAccounts}>Add an account →</button></div>
        </div>
      ) : primary === null ? (
        <div className="empty">
          <h2>No default account set</h2>
          <p>Pick the account you use day-to-day and mark it <b>☆ Set Default</b> — it will appear here, and every new terminal will use it.</p>
          <div className="empty-actions"><button className="btn btn-primary" onClick={onGoAccounts}>Choose from your accounts →</button></div>
        </div>
      ) : (
        <>
          <div className="summary-row">
            <SummaryTile label="Sessions this week" value={String(primary.activity.sessions7d)} />
            <SummaryTile label="Projects" value={String(primary.activity.projects)} />
            <SummaryTile label="Last active" value={timeAgo(primary.activity.lastActiveAt, now)} />
            <SummaryTile
              label="Other accounts"
              value={String(otherCount)}
              hint={otherCount > 0 ? "On the Other Accounts page" : "This is your only account"}
            />
          </div>

          <div className="hero-card">
            <AccountCard
              state={primary}
              now={now}
              onLaunch={(kind) => void launch(kind, primary.profile.id)}
              onSetDefault={(make) => void setDefault(primary.profile.id, make)}
              onRename={() => setDialog({ type: "rename", state: primary })}
              onRemove={() => setDialog({ type: "remove", state: primary })}
              onReveal={() => void window.cam.revealFolder(primary.profile.id)}
              onRefresh={() => void window.cam.refreshUsage(primary.profile.id)}
            />
            <button className="btn hero-link" onClick={onGoAccounts}>
              View all other accounts →
            </button>
          </div>
        </>
      )}

      {dialog?.type === "rename" && <RenameDialog state={dialog.state} onClose={() => setDialog(null)} onDone={() => setDialog(null)} />}
      {dialog?.type === "remove" && <RemoveDialog state={dialog.state} onClose={() => setDialog(null)} onDone={(msg) => { setDialog(null); showToast(msg); }} />}
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
