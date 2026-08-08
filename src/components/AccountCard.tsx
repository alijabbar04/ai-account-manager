import { useEffect, useRef, useState } from "react";
import type { ProfileState } from "../../shared/types";
import { fmtCredits, fmtTokens, timeAgo, titleCase } from "../format";
import { accountStatus, orderedLimits } from "../status";
import Meter from "./Meter";

interface Props {
  state: ProfileState;
  now: number;
  onLaunch: (kind: "claude" | "vscode" | "powershell" | "login") => void;
  onSetDefault: (makeDefault: boolean) => void;
  onRename: () => void;
  onRemove: () => void;
  onReveal: () => void;
  onRefresh: () => void;
}

function prettyPlan(subscriptionType?: string, rateLimitTier?: string): string {
  // rateLimitTier carries a meaningful multiplier for Max plans ("max_20x");
  // other tier values are internal codenames not worth surfacing.
  const mult = rateLimitTier?.match(/max_(\d+)x/i);
  if (mult) return `Max ${mult[1]}x`;
  return titleCase(subscriptionType);
}

export default function AccountCard({
  state,
  now,
  onLaunch,
  onSetDefault,
  onRename,
  onRemove,
  onReveal,
  onRefresh
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { profile, identity, usage, activity, isDefault } = state;
  const status = accountStatus(state);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const plan = prettyPlan(identity.subscriptionType, identity.rateLimitTier);
  const subParts = [identity.email, plan, identity.orgName].filter(
    (v, i, arr) => v && arr.indexOf(v) === i
  );
  const limits = usage ? orderedLimits(usage.limits) : [];
  const showEstimates = usage !== null && !usage.ok && activity.estPrompts7d !== undefined;

  return (
    <article className="card" data-status={status.kind}>
      <header className="card-head">
        <span className="dot" data-kind={status.kind} aria-hidden="true" />
        <h3 className="card-name" title={profile.configDir}>
          {profile.name}
        </h3>
        {isDefault && <span className="badge badge-default">Default</span>}
        <span className="status-label" data-kind={status.kind}>
          {status.label}
        </span>
        <div className="menu-wrap" ref={menuRef}>
          <button
            className="btn btn-icon"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              <button role="menuitem" onClick={() => { setMenuOpen(false); onRefresh(); }}>Refresh usage</button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); onRename(); }}>Rename…</button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); onReveal(); }}>Open config folder</button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); onSetDefault(!isDefault); }}>
                {isDefault ? "Clear default" : "Set as default"}
              </button>
              {identity.loggedIn && (
                <button role="menuitem" onClick={() => { setMenuOpen(false); onLaunch("login"); }}>
                  Re-login…
                </button>
              )}
              <button role="menuitem" className="danger" onClick={() => { setMenuOpen(false); onRemove(); }}>
                Remove…
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="card-sub" title={profile.configDir}>
        {subParts.length > 0 ? subParts.join(" · ") : profile.configDir}
      </div>

      {identity.loggedIn ? (
        <>
          {limits.length > 0 && (
            <div className="meters">
              {limits.map((l, i) => (
                <Meter key={`${l.kind}-${l.modelName ?? i}`} limit={l} now={now} />
              ))}
            </div>
          )}

          {usage?.extra?.enabled && usage.extra.usedCredits !== undefined && usage.extra.usedCredits > 0 && (
            <div className="extra-usage">
              Extra usage: {fmtCredits(usage.extra.usedCredits, usage.extra.currency, usage.extra.decimalPlaces)} used
            </div>
          )}

          {usage && !usage.ok && (
            <div className="banner" data-kind={usage.error?.toLowerCase().includes("expired") ? "crit" : "warn"}>
              {usage.error ?? "Usage unavailable"}
              {usage.limits.length > 0 && " — showing last known values"}
            </div>
          )}

          {showEstimates && (
            <div className="estimate">
              Local estimate (7d): ~{activity.estPrompts7d} prompts · ~{fmtTokens(activity.estTokens7d)} tokens
            </div>
          )}

          <div className="card-meta">
            <span>Last active {timeAgo(activity.lastActiveAt, now)}</span>
            <span className="sep">·</span>
            <span>
              {activity.sessions7d} session{activity.sessions7d === 1 ? "" : "s"} this week
            </span>
            {usage && usage.limits.length > 0 && (
              <>
                <span className="sep">·</span>
                <span>updated {timeAgo(usage.fetchedAt, now)}</span>
              </>
            )}
          </div>

          <footer className="card-actions">
            <button className="btn btn-primary" onClick={() => onLaunch("claude")}>Open Claude</button>
            <button className="btn" onClick={() => onLaunch("vscode")} title="If VS Code is already running, close it first so the new window picks up this account's environment">
              VS Code
            </button>
            <button className="btn" onClick={() => onLaunch("powershell")}>PowerShell</button>
            <button
              className="btn"
              data-active={isDefault || undefined}
              onClick={() => onSetDefault(!isDefault)}
              title="Make this account the default CLAUDE_CONFIG_DIR for all new shells"
            >
              {isDefault ? "★ Default" : "☆ Set Default"}
            </button>
          </footer>
        </>
      ) : (
        <>
          <div className="banner" data-kind="off">
            Not signed in. Log in via your browser — Anthropic or Google — from a terminal bound to this profile.
            No passwords are stored.
          </div>
          <footer className="card-actions">
            <button className="btn btn-primary" onClick={() => onLaunch("login")}>Log in…</button>
            <button className="btn" onClick={() => onLaunch("powershell")}>PowerShell</button>
          </footer>
        </>
      )}
    </article>
  );
}
