import { useEffect, useState } from "react";
import type { ProfileState } from "../../shared/types";

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

export function AddAccountDialog({
  onClose,
  onDone
}: {
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [tab, setTab] = useState<"create" | "import">("create");
  const [name, setName] = useState("");
  const [dir, setDir] = useState("");
  const [loginNow, setLoginNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (tab === "create") {
        const res = await window.cam.createProfile(name);
        if (!res.ok || !res.profile) {
          setError(res.error ?? "Failed to create account.");
          return;
        }
        if (loginNow) await window.cam.launch("login", res.profile.id);
        onDone(
          loginNow
            ? `"${res.profile.name}" created — finish signing in from the terminal that just opened.`
            : `"${res.profile.name}" created.`
        );
      } else {
        const res = await window.cam.importProfile(name, dir);
        if (!res.ok || !res.profile) {
          setError(res.error ?? "Failed to import account.");
          return;
        }
        onDone(`"${res.profile.name}" imported.`);
      }
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = name.trim().length > 0 && (tab === "create" || dir.trim().length > 0) && !busy;

  return (
    <Overlay onClose={onClose}>
      <h2>Add account</h2>
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={tab === "create"} data-active={tab === "create" || undefined} onClick={() => setTab("create")}>
          Create new
        </button>
        <button role="tab" aria-selected={tab === "import"} data-active={tab === "import" || undefined} onClick={() => setTab("import")}>
          Import existing
        </button>
      </div>

      <label className="field">
        <span>Account name</span>
        <input
          autoFocus
          value={name}
          placeholder={tab === "create" ? "e.g. Personal Max" : "e.g. Work Max"}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canSubmit && void submit()}
        />
      </label>

      {tab === "create" ? (
        <>
          <p className="hint">
            A fresh, isolated profile folder is created under your home directory
            (e.g. <code>.claude-personal-max</code>). Sign-in happens in your browser via
            <code> claude auth login</code> — Anthropic or Google. No passwords are ever stored.
          </p>
          <label className="check">
            <input type="checkbox" checked={loginNow} onChange={(e) => setLoginNow(e.target.checked)} />
            <span>Open the login terminal now</span>
          </label>
        </>
      ) : (
        <>
          <label className="field">
            <span>Existing CLAUDE_CONFIG_DIR folder</span>
            <div className="pathrow">
              <input
                value={dir}
                placeholder="C:\Users\you\.claude"
                onChange={(e) => setDir(e.target.value)}
              />
              <button
                className="btn"
                onClick={async () => {
                  const picked = await window.cam.pickFolder();
                  if (picked) setDir(picked);
                }}
              >
                Browse…
              </button>
            </div>
          </label>
          <p className="hint">
            Point at any folder already used by Claude Code — including your default{" "}
            <code>%USERPROFILE%\.claude</code>. The folder is registered as-is; nothing is moved or copied.
          </p>
        </>
      )}

      {error && <div className="banner" data-kind="crit">{error}</div>}

      <div className="dialog-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!canSubmit} onClick={() => void submit()}>
          {tab === "create" ? "Create account" : "Import account"}
        </button>
      </div>
    </Overlay>
  );
}

export function RenameDialog({
  state,
  onClose,
  onDone
}: {
  state: ProfileState;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(state.profile.name);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const res = await window.cam.renameProfile(state.profile.id, name);
    if (!res.ok) setError(res.error ?? "Rename failed.");
    else onDone();
  };

  return (
    <Overlay onClose={onClose}>
      <h2>Rename account</h2>
      <label className="field">
        <span>Account name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && void submit()}
        />
      </label>
      {error && <div className="banner" data-kind="crit">{error}</div>}
      <div className="dialog-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={() => void submit()}>
          Rename
        </button>
      </div>
    </Overlay>
  );
}

export function RemoveDialog({
  state,
  onClose,
  onDone
}: {
  state: ProfileState;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [deleteDir, setDeleteDir] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const res = await window.cam.removeProfile(state.profile.id, deleteDir);
    if (!res.ok) setError(res.error ?? "Remove failed.");
    else onDone(deleteDir ? `"${state.profile.name}" removed and its folder deleted.` : `"${state.profile.name}" removed from the list.`);
  };

  return (
    <Overlay onClose={onClose}>
      <h2>Remove “{state.profile.name}”</h2>
      <p className="hint">
        By default this only removes the account from AI Account Manager. The profile folder—and its
        Claude Code session—stays on disk at <code>{state.profile.configDir}</code>.
      </p>
      <label className="check">
        <input type="checkbox" checked={deleteDir} onChange={(e) => setDeleteDir(e.target.checked)} />
        <span>
          Also delete the folder from disk. <strong>This signs the account out on this machine</strong> and
          deletes its local session history.
        </span>
      </label>
      {error && <div className="banner" data-kind="crit">{error}</div>}
      <div className="dialog-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={() => void submit()}>
          {deleteDir ? "Remove and delete folder" : "Remove from list"}
        </button>
      </div>
    </Overlay>
  );
}
