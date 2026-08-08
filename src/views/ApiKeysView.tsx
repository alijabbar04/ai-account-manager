import { useState } from "react";
import type { ApiKeyState, ProviderId, ProviderMeta } from "../../shared/types";
import ApiKeyCard from "../components/ApiKeyCard";
import { AddApiKeyDialog, EditApiKeyDialog, RemoveApiKeyDialog } from "../components/ApiKeyDialogs";

type DialogState =
  | { type: "add"; provider?: ProviderId }
  | { type: "edit"; state: ApiKeyState }
  | { type: "remove"; state: ApiKeyState }
  | null;

export default function ApiKeysView({
  keys,
  providers,
  now,
  showToast,
  onOpenProvider
}: {
  keys: ApiKeyState[] | null;
  providers: ProviderMeta[];
  now: number;
  showToast: (m: string) => void;
  onOpenProvider: (p: ProviderId) => void;
}) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    setRefreshing(true);
    try {
      await window.cam.apiKeys.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const exportKeys = async () => {
    const res = await window.cam.apiKeys.export();
    if (res.ok && res.path) showToast(`Exported key list to ${res.path}`);
    else if (res.error) showToast(res.error);
  };

  const q = search.trim().toLowerCase();
  const filtered = (keys ?? []).filter(
    (k) => !q || k.record.nickname.toLowerCase().includes(q) || k.meta.displayName.toLowerCase().includes(q)
  );

  return (
    <div className="view">
      <header className="view-head">
        <div>
          <h1>API Keys</h1>
          <p className="view-sub">{keys ? `${keys.length} key${keys.length === 1 ? "" : "s"} · encrypted with Windows DPAPI` : "Loading…"}</p>
        </div>
        <div className="view-actions">
          <div className="search">
            <input type="search" placeholder="Search keys…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search keys" />
          </div>
          <button className="btn" onClick={() => void refresh()} disabled={refreshing}>{refreshing ? "Refreshing…" : "↻ Refresh"}</button>
          <button className="btn" onClick={() => void exportKeys()}>Export</button>
          <button className="btn btn-primary" onClick={() => setDialog({ type: "add" })}>+ Add key</button>
        </div>
      </header>

      {keys === null ? (
        <div className="empty"><p>Loading…</p></div>
      ) : keys.length === 0 ? (
        <div className="empty">
          <h2>No API keys yet</h2>
          <p>Add a provider key to track balance, spend, and usage trends. Keys are encrypted at rest with Windows DPAPI and only ever sent to their own provider.</p>
          <div className="empty-actions"><button className="btn btn-primary" onClick={() => setDialog({ type: "add" })}>+ Add your first key</button></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty"><h2>No matches</h2><p>No keys match “{search}”.</p></div>
      ) : (
        <div className="grid">
          {filtered.map((s) => (
            <ApiKeyCard
              key={s.record.id}
              state={s}
              now={now}
              onEdit={() => setDialog({ type: "edit", state: s })}
              onRemove={() => setDialog({ type: "remove", state: s })}
              onRefresh={() => void window.cam.apiKeys.refresh(s.record.id)}
              onOpenProvider={() => onOpenProvider(s.record.provider)}
            />
          ))}
        </div>
      )}

      {dialog?.type === "add" && (
        <AddApiKeyDialog providers={providers} initialProvider={dialog.provider} onClose={() => setDialog(null)} onDone={(msg) => { setDialog(null); showToast(msg); }} />
      )}
      {dialog?.type === "edit" && (
        <EditApiKeyDialog state={dialog.state} onClose={() => setDialog(null)} onDone={(msg) => { setDialog(null); showToast(msg); }} />
      )}
      {dialog?.type === "remove" && (
        <RemoveApiKeyDialog state={dialog.state} onClose={() => setDialog(null)} onDone={(msg) => { setDialog(null); showToast(msg); }} />
      )}
    </div>
  );
}
