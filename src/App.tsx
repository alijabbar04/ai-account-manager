import { useCallback, useEffect, useState } from "react";
import type { AnalyticsSummary, ApiKeyState, ProviderId, ProviderMeta, ThemePref } from "../shared/types";
import Sidebar from "./components/Sidebar";
import { EditApiKeyDialog, RemoveApiKeyDialog } from "./components/ApiKeyDialogs";
import DashboardView from "./views/DashboardView";
import AccountsView from "./views/AccountsView";
import SkillsSyncView from "./views/SkillsSyncView";
import ApiDashboardView from "./views/ApiDashboardView";
import ApiKeysView from "./views/ApiKeysView";
import AnalyticsView from "./views/AnalyticsView";
import ProviderView from "./views/ProviderView";
import { providerFromView, type ViewKey } from "./nav";

const THEME_CYCLE: ThemePref[] = ["system", "light", "dark"];

function useEffectiveTheme(pref: ThemePref): "light" | "dark" {
  const [system, setSystem] = useState<"light" | "dark">(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return pref === "system" ? system : pref;
}

export default function App() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [themePref, setThemePref] = useState<ThemePref>("system");
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Shared API-key state (used by dashboard, keys, analytics, provider views).
  const [providers, setProviders] = useState<ProviderMeta[]>([]);
  const [keys, setKeys] = useState<ApiKeyState[] | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [accountCount, setAccountCount] = useState<number | null>(null);

  // App-level dialogs for editing/removing a key from the provider view.
  const [keyDialog, setKeyDialog] = useState<{ type: "edit" | "remove"; state: ApiKeyState } | null>(null);

  const theme = useEffectiveTheme(themePref);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const reloadSummary = useCallback(() => {
    void window.cam.apiKeys.summary().then(setSummary);
  }, []);

  useEffect(() => {
    void window.cam.getTheme().then(setThemePref);
    void window.cam.apiKeys.providerMeta().then(setProviders);
    void window.cam.apiKeys.list().then((k) => {
      setKeys(k);
      reloadSummary();
    });
    // Sidebar badge counts the "Other Accounts" page: everything except the default.
    void window.cam.listStates().then((s) => setAccountCount(s.filter((x) => !x.isDefault).length));

    const offKeys = window.cam.apiKeys.onChanged((k) => {
      setKeys(k);
      reloadSummary();
      setNow(Date.now());
    });
    const offAccounts = window.cam.onStateChanged((s) => setAccountCount(s.filter((x) => !x.isDefault).length));
    return () => {
      offKeys();
      offAccounts();
    };
  }, [reloadSummary]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(themePref) + 1) % THEME_CYCLE.length];
    setThemePref(next);
    void window.cam.setTheme(next);
  };

  const goProvider = (p: ProviderId) => setView(`provider:${p}`);
  const providerId = providerFromView(view);

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        onNavigate={setView}
        providers={providers}
        keys={keys}
        accountCount={accountCount}
        themePref={themePref}
        onCycleTheme={cycleTheme}
      />

      <main className="main-scroll">
        {view === "dashboard" && <DashboardView now={now} showToast={showToast} onGoAccounts={() => setView("accounts")} />}
        {view === "accounts" && <AccountsView now={now} showToast={showToast} />}
        {view === "skills-sync" && <SkillsSyncView showToast={showToast} />}
        {view === "api-dashboard" && (
          <ApiDashboardView keys={keys} summary={summary} now={now} onOpenProvider={goProvider} onGoKeys={() => setView("api-keys")} />
        )}
        {view === "api-keys" && (
          <ApiKeysView keys={keys} providers={providers} now={now} showToast={showToast} onOpenProvider={goProvider} />
        )}
        {view === "analytics" && <AnalyticsView keys={keys} summary={summary} now={now} onGoKeys={() => setView("api-keys")} />}
        {providerId && (
          <ProviderView
            provider={providerId}
            meta={providers.find((p) => p.id === providerId)}
            keys={keys}
            now={now}
            showToast={showToast}
            onAddKey={() => setView("api-keys")}
            onEditKey={(s) => setKeyDialog({ type: "edit", state: s })}
            onRemoveKey={(s) => setKeyDialog({ type: "remove", state: s })}
          />
        )}
      </main>

      {keyDialog?.type === "edit" && (
        <EditApiKeyDialog state={keyDialog.state} onClose={() => setKeyDialog(null)} onDone={(msg) => { setKeyDialog(null); showToast(msg); }} />
      )}
      {keyDialog?.type === "remove" && (
        <RemoveApiKeyDialog state={keyDialog.state} onClose={() => setKeyDialog(null)} onDone={(msg) => { setKeyDialog(null); showToast(msg); }} />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
