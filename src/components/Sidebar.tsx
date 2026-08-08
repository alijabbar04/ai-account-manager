import type { ApiKeyState, ProviderId, ProviderMeta, ThemePref } from "../../shared/types";
import type { ViewKey } from "../nav";

const THEME_ICON: Record<ThemePref, string> = { system: "◐", light: "☀", dark: "☾" };
const THEME_LABEL: Record<ThemePref, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };

export default function Sidebar({
  view,
  onNavigate,
  providers,
  keys,
  accountCount,
  themePref,
  onCycleTheme
}: {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
  providers: ProviderMeta[];
  keys: ApiKeyState[] | null;
  accountCount: number | null;
  themePref: ThemePref;
  onCycleTheme: () => void;
}) {
  const keyCountByProvider = (id: ProviderId) => (keys ?? []).filter((k) => k.record.provider === id).length;
  const worstStatus = (id: ProviderId) => {
    const mine = (keys ?? []).filter((k) => k.record.provider === id);
    if (mine.some((k) => k.status === "red")) return "red";
    if (mine.some((k) => k.status === "yellow")) return "yellow";
    return null;
  };

  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="sidebar-brand">
        <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l2.1 6.3L20 6l-3.9 5 5.9 1-5.9 1L20 18l-5.9-2.3L12 22l-2.1-6.3L4 18l3.9-5L2 12l5.9-1L4 6l5.9 2.3z" fill="currentColor" />
        </svg>
        <span className="sidebar-title">Account Manager</span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-heading">Claude Code</div>
        <NavItem active={view === "dashboard"} onClick={() => onNavigate("dashboard")} icon="⌂" label="Dashboard" />
        <NavItem active={view === "accounts"} onClick={() => onNavigate("accounts")} icon="◍" label="Other Accounts" badge={accountCount ?? undefined} />
        <NavItem active={view === "skills-sync"} onClick={() => onNavigate("skills-sync")} icon="⇄" label="Skills Sync" />
      </div>

      <div className="sidebar-section">
        <div className="sidebar-heading">API Analytics</div>
        <NavItem active={view === "api-dashboard"} onClick={() => onNavigate("api-dashboard")} icon="▦" label="Dashboard" />
        <NavItem active={view === "api-keys"} onClick={() => onNavigate("api-keys")} icon="🔑" label="API Keys" badge={keys?.length ?? undefined} />
        <NavItem active={view === "analytics"} onClick={() => onNavigate("analytics")} icon="📈" label="Analytics" />
      </div>

      <div className="sidebar-section">
        <div className="sidebar-heading">Providers</div>
        {providers.map((p) => (
          <NavItem
            key={p.id}
            active={view === `provider:${p.id}`}
            onClick={() => onNavigate(`provider:${p.id}`)}
            dot={p.accent}
            label={p.displayName}
            badge={keyCountByProvider(p.id) || undefined}
            status={worstStatus(p.id)}
          />
        ))}
      </div>

      <div className="sidebar-foot">
        <button className="btn btn-icon" onClick={onCycleTheme} title={THEME_LABEL[themePref]} aria-label={THEME_LABEL[themePref]}>
          {THEME_ICON[themePref]}
        </button>
      </div>
    </nav>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  dot,
  label,
  badge,
  status
}: {
  active: boolean;
  onClick: () => void;
  icon?: string;
  dot?: string;
  label: string;
  badge?: number;
  status?: "red" | "yellow" | null;
}) {
  return (
    <button className="nav-item" data-active={active || undefined} onClick={onClick}>
      {dot ? <span className="nav-dot" style={{ background: dot }} /> : <span className="nav-icon" aria-hidden="true">{icon ?? "•"}</span>}
      <span className="nav-label">{label}</span>
      {status && <span className="nav-status-dot" data-kind={status} aria-hidden="true" />}
      {badge !== undefined && <span className="nav-badge">{badge}</span>}
    </button>
  );
}
