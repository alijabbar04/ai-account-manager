import { useEffect, useMemo, useState } from "react";
import type { ApiKeyState, ProviderId, ProviderMeta } from "../../shared/types";

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

export function AddApiKeyDialog({
  providers,
  initialProvider,
  onClose,
  onDone
}: {
  providers: ProviderMeta[];
  initialProvider?: ProviderId;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [provider, setProvider] = useState<ProviderId>(initialProvider ?? providers[0]?.id ?? "openrouter");
  const [nickname, setNickname] = useState("");
  const [secret, setSecret] = useState("");
  const [isAdminKey, setIsAdminKey] = useState(false);
  const [budget, setBudget] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  const meta = useMemo(() => providers.find((p) => p.id === provider), [providers, provider]);

  const validate = async () => {
    setBusy(true);
    setError(null);
    setValidation(null);
    try {
      const res = await window.cam.apiKeys.validate(provider, secret);
      if (res.ok) {
        setValidation(res.isAdminKey ? "Valid admin/org key ✓" : "Valid key ✓");
        if (res.isAdminKey) setIsAdminKey(true);
      } else {
        setError(res.error ?? "Validation failed.");
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const monthlyBudgetUsd = budget.trim() ? Number(budget) : null;
      if (monthlyBudgetUsd !== null && (!Number.isFinite(monthlyBudgetUsd) || monthlyBudgetUsd < 0)) {
        setError("Monthly budget must be a positive number.");
        return;
      }
      const res = await window.cam.apiKeys.add({ provider, nickname, secret, isAdminKey, monthlyBudgetUsd });
      if (!res.ok || !res.record) {
        setError(res.error ?? "Failed to add key.");
        return;
      }
      onDone(`Added "${res.record.nickname}".`);
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = nickname.trim() && secret.trim() && !busy;

  return (
    <Overlay onClose={onClose}>
      <h2>Add API key</h2>

      <label className="field">
        <span>Provider</span>
        <div className="provider-choice">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              className="provider-pill"
              data-active={p.id === provider || undefined}
              style={{ ["--pill-accent" as string]: p.accent }}
              onClick={() => setProvider(p.id)}
            >
              {p.displayName}
            </button>
          ))}
        </div>
      </label>

      <label className="field">
        <span>Nickname</span>
        <input autoFocus value={nickname} placeholder="e.g. Personal OpenRouter" onChange={(e) => setNickname(e.target.value)} />
      </label>

      <label className="field">
        <span>API key</span>
        <div className="pathrow">
          <input
            type={reveal ? "text" : "password"}
            value={secret}
            placeholder={meta?.keyPrefixes[0] ? `${meta.keyPrefixes[0]}…` : "Paste the key"}
            onChange={(e) => {
              setSecret(e.target.value);
              setValidation(null);
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="btn" onClick={() => setReveal((v) => !v)} aria-label="Toggle key visibility">
            {reveal ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {meta?.supportsAdminKey && (
        <label className="check">
          <input type="checkbox" checked={isAdminKey} onChange={(e) => setIsAdminKey(e.target.checked)} />
          <span>
            This is an <strong>admin / organization</strong> key.{" "}
            {meta.id === "anthropic" || meta.id === "openai"
              ? "Required to read spend & usage — a standard key can only be validated."
              : ""}
          </span>
        </label>
      )}

      <label className="field">
        <span>Monthly budget (USD, optional)</span>
        <input value={budget} inputMode="decimal" placeholder="e.g. 50" onChange={(e) => setBudget(e.target.value)} />
      </label>

      <CapabilityHint meta={meta} />

      {validation && <div className="banner" data-kind="ok-info">{validation}</div>}
      {error && <div className="banner" data-kind="crit">{error}</div>}

      <div className="dialog-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={() => void validate()} disabled={!secret.trim() || busy}>
          {busy ? "Checking…" : "Validate"}
        </button>
        <button className="btn btn-primary" onClick={() => void submit()} disabled={!canSubmit}>
          Add key
        </button>
      </div>
    </Overlay>
  );
}

function CapabilityHint({ meta }: { meta: ProviderMeta | undefined }) {
  if (!meta) return null;
  const label: Record<string, string> = {
    exact: "live",
    admin: "admin key",
    derived: "tracked",
    estimated: "estimated",
    none: "unavailable"
  };
  const c = meta.capabilities;
  return (
    <p className="hint">
      For {meta.displayName}: balance <b>{label[c.balance]}</b> · usage <b>{label[c.usage]}</b> · cost{" "}
      <b>{label[c.cost]}</b> · rate limits <b>{label[c.rateLimits]}</b>. Keys are encrypted with Windows DPAPI and
      never leave this machine except to {meta.displayName}'s own API.
    </p>
  );
}

export function EditApiKeyDialog({
  state,
  onClose,
  onDone
}: {
  state: ApiKeyState;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [nickname, setNickname] = useState(state.record.nickname);
  const [budget, setBudget] = useState(state.record.monthlyBudgetUsd != null ? String(state.record.monthlyBudgetUsd) : "");
  const [isAdminKey, setIsAdminKey] = useState(Boolean(state.record.isAdminKey));
  const [rotate, setRotate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const monthlyBudgetUsd = budget.trim() ? Number(budget) : null;
      if (monthlyBudgetUsd !== null && (!Number.isFinite(monthlyBudgetUsd) || monthlyBudgetUsd < 0)) {
        setError("Monthly budget must be a positive number.");
        return;
      }
      const patch: { nickname: string; isAdminKey: boolean; monthlyBudgetUsd: number | null; secret?: string } = {
        nickname,
        isAdminKey,
        monthlyBudgetUsd
      };
      if (rotate.trim()) patch.secret = rotate.trim();
      const res = await window.cam.apiKeys.update(state.record.id, patch);
      if (!res.ok) {
        setError(res.error ?? "Update failed.");
        return;
      }
      onDone(`Updated "${nickname}".`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <h2>Edit “{state.record.nickname}”</h2>
      <label className="field">
        <span>Nickname</span>
        <input autoFocus value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </label>
      <label className="field">
        <span>Monthly budget (USD, optional)</span>
        <input value={budget} inputMode="decimal" placeholder="none" onChange={(e) => setBudget(e.target.value)} />
      </label>
      {state.meta.supportsAdminKey && (
        <label className="check">
          <input type="checkbox" checked={isAdminKey} onChange={(e) => setIsAdminKey(e.target.checked)} />
          <span>Admin / organization key</span>
        </label>
      )}
      <label className="field">
        <span>Rotate key (optional)</span>
        <input
          type="password"
          value={rotate}
          placeholder={`Currently ${state.record.maskedKey}`}
          onChange={(e) => setRotate(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {error && <div className="banner" data-kind="crit">{error}</div>}
      <div className="dialog-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => void submit()} disabled={!nickname.trim() || busy}>
          Save
        </button>
      </div>
    </Overlay>
  );
}

export function RemoveApiKeyDialog({
  state,
  onClose,
  onDone
}: {
  state: ApiKeyState;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    const res = await window.cam.apiKeys.remove(state.record.id);
    if (!res.ok) setError(res.error ?? "Remove failed.");
    else onDone(`Removed "${state.record.nickname}".`);
  };
  return (
    <Overlay onClose={onClose}>
      <h2>Remove “{state.record.nickname}”</h2>
      <p className="hint">
        This deletes the encrypted key and its local usage history from this machine. It does not affect the key at{" "}
        {state.meta.displayName} — revoke it there if needed.
      </p>
      {error && <div className="banner" data-kind="crit">{error}</div>}
      <div className="dialog-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={() => void submit()}>Remove key</button>
      </div>
    </Overlay>
  );
}
