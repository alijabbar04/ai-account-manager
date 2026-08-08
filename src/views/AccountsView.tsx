import { useEffect, useMemo, useState } from "react";
import type { ProfileState } from "../../shared/types";
import AccountCard from "../components/AccountCard";
import { AddAccountDialog, RemoveDialog, RenameDialog } from "../components/Dialogs";

type DialogState =
  | { type: "add" }
  | { type: "rename"; state: ProfileState }
  | { type: "remove"; state: ProfileState }
  | null;

/**
 * All Claude Code accounts EXCEPT the default one — the default account lives
 * on the Dashboard view. Clearing an account's default status makes it
 * reappear here automatically (both views render from the same state stream).
 */
export default function AccountsView({ now, showToast }: { now: number; showToast: (m: string) => void }) {
  const [states, setStates] = useState<ProfileState[] | null>(null);
  const [search, setSearch] = useState("");
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

  const exportProfiles = async () => {
    const res = await window.cam.exportProfiles();
    if (res.ok && res.path) showToast(`Exported account list to ${res.path}`);
    else if (res.error) showToast(res.error);
  };

  const others = useMemo(() => states?.filter((s) => !s.isDefault) ?? null, [states]);

  const filtered = useMemo(() => {
    if (!others) return null;
    const q = search.trim().toLowerCase();
    const list = q
      ? others.filter(
          (s) =>
            s.profile.name.toLowerCase().includes(q) ||
            (s.identity.email ?? "").toLowerCase().includes(q) ||
            (s.identity.orgName ?? "").toLowerCase().includes(q) ||
            s.profile.configDir.toLowerCase().includes(q)
        )
      : others;
    return [...list].sort((a, b) => a.profile.name.localeCompare(b.profile.name));
  }, [others, search]);

  return (
    <div className="view">
      <header className="view-head">
        <div>
          <h1>Other Accounts</h1>
          <p className="view-sub">{others ? `${others.length} other Claude Code account${others.length === 1 ? "" : "s"} — your default account is on the Dashboard` : "Loading…"}</p>
        </div>
        <div className="view-actions">
          <div className="search">
            <input type="search" placeholder="Search accounts…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search accounts" />
          </div>
          <button className="btn" onClick={() => void refreshAll()} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
          <button className="btn" onClick={() => void exportProfiles()}>Export</button>
          <button className="btn btn-primary" onClick={() => setDialog({ type: "add" })}>+ Add account</button>
        </div>
      </header>

      {filtered === null ? (
        <div className="empty"><p>Loading accounts…</p></div>
      ) : filtered.length === 0 && others && others.length > 0 ? (
        <div className="empty"><h2>No matches</h2><p>No accounts match “{search}”.</p></div>
      ) : filtered.length === 0 && states && states.length > 0 ? (
        <div className="empty">
          <h2>No other accounts</h2>
          <p>Your default account lives on the Dashboard. Add another account to see it here.</p>
          <div className="empty-actions"><button className="btn btn-primary" onClick={() => setDialog({ type: "add" })}>+ Add account</button></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <h2>No accounts yet</h2>
          <p>Each account is an isolated Claude Code profile folder (its own <code>CLAUDE_CONFIG_DIR</code>).</p>
          <div className="empty-actions"><button className="btn btn-primary" onClick={() => setDialog({ type: "add" })}>+ Add your first account</button></div>
        </div>
      ) : (
        <div className="grid">
          {filtered.map((s) => (
            <AccountCard
              key={s.profile.id}
              state={s}
              now={now}
              onLaunch={(kind) => void launch(kind, s.profile.id)}
              onSetDefault={(make) => void setDefault(s.profile.id, make)}
              onRename={() => setDialog({ type: "rename", state: s })}
              onRemove={() => setDialog({ type: "remove", state: s })}
              onReveal={() => void window.cam.revealFolder(s.profile.id)}
              onRefresh={() => void window.cam.refreshUsage(s.profile.id)}
            />
          ))}
        </div>
      )}

      {dialog?.type === "add" && <AddAccountDialog onClose={() => setDialog(null)} onDone={(msg) => { setDialog(null); showToast(msg); }} />}
      {dialog?.type === "rename" && <RenameDialog state={dialog.state} onClose={() => setDialog(null)} onDone={() => setDialog(null)} />}
      {dialog?.type === "remove" && <RemoveDialog state={dialog.state} onClose={() => setDialog(null)} onDone={(msg) => { setDialog(null); showToast(msg); }} />}
    </div>
  );
}
