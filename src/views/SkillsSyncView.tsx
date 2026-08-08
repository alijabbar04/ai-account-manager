import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  SkillsCellState,
  SkillsInstallOutcome,
  SkillsOverview
} from "../../shared/types";

const STATE_LABEL: Record<SkillsCellState, string> = {
  UpToDate: "up to date",
  Missing: "missing",
  Outdated: "outdated",
  NewerAtTarget: "newer here",
  Modified: "modified"
};

/**
 * Skills Sync — distributes the curated skill library (superpowers, claude-mem,
 * code-review, …) across every Claude profile on this machine, powered by the
 * AI Environment Manager engine (backup-first, checksum-verified, newer/modified
 * copies protected).
 */
export default function SkillsSyncView({ showToast }: { showToast: (msg: string) => void }) {
  const [overview, setOverview] = useState<SkillsOverview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<SkillsInstallOutcome | null>(null);

  const reload = useCallback(async () => {
    setBusy("Scanning profiles…");
    try {
      setOverview(await window.cam.skills.overview());
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const cellFor = useCallback(
    (skill: string, profile: string) =>
      overview?.matrix.find((c) => c.skill === skill && c.profile === profile),
    [overview]
  );

  const stats = useMemo(() => {
    if (!overview) return null;
    const total = overview.matrix.length;
    const upToDate = overview.matrix.filter((c) => c.state === "UpToDate").length;
    const missing = overview.matrix.filter((c) => c.state === "Missing").length;
    const outdated = overview.matrix.filter((c) => c.state === "Outdated").length;
    const protectedCount = overview.matrix.filter(
      (c) => c.state === "NewerAtTarget" || c.state === "Modified"
    ).length;
    return { total, upToDate, missing, outdated, protected: protectedCount };
  }, [overview]);

  const install = async (opts: { profiles?: string[]; skills?: string[] }) => {
    const scope = opts.skills?.length
      ? `'${opts.skills[0]}'`
      : opts.profiles?.length
        ? `all skills → ${opts.profiles[0]}`
        : "all skills → all profiles";
    setBusy(`Installing ${scope}…`);
    setLastRun(null);
    try {
      const outcome = await window.cam.skills.install(opts);
      setLastRun(outcome);
      if (outcome.error) {
        showToast(`Install failed: ${outcome.error}`);
      } else {
        const applied = outcome.results.filter(
          (r) => r.success && (r.action === "Installed" || r.action === "Updated")
        ).length;
        const skippedProtected = outcome.results.filter((r) => r.action === "SkippedProtected").length;
        showToast(
          applied === 0
            ? "Already in sync — nothing to install."
            : `${applied} install/update action(s) applied${skippedProtected ? `, ${skippedProtected} protected` : ""}.`
        );
      }
      await reload();
    } finally {
      setBusy(null);
    }
  };

  const audit = async () => {
    setBusy("Running environment audit…");
    try {
      const res = await window.cam.skills.runAudit();
      showToast(res.ok ? res.output.split("\n")[0] || "Audit complete." : `Audit failed: ${res.output}`);
    } finally {
      setBusy(null);
    }
  };

  if (!overview) {
    return (
      <div className="view">
        <div className="empty">
          <p>{busy ?? "Loading…"}</p>
        </div>
      </div>
    );
  }

  if (!overview.engineFound) {
    return (
      <div className="view">
        <Header busy={busy} onReload={reload} overview={overview} />
        <div className="empty">
          <h2>AI Environment Manager not found</h2>
          <p>
            Skills Sync is powered by the AI Environment Manager engine. Install it (Desktop folder{" "}
            <code>AI Environment Manager</code> or its installer), then refresh.
          </p>
          <div className="empty-actions">
            <button className="btn btn-primary" onClick={() => void reload()}>
              ↻ Retry detection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <Header busy={busy} onReload={reload} overview={overview} />

      {overview.error && <div className="headline-warning" data-kind="crit">{overview.error}</div>}

      {stats && (
        <div className="summary-row">
          <SummaryTile label="Curated skills" value={String(overview.skills.length)} hint={`engine v${overview.engineVersion ?? "?"}`} />
          <SummaryTile label="Profiles" value={String(overview.profiles.length)} />
          <SummaryTile label="Up to date" value={`${stats.upToDate}/${stats.total}`} />
          <SummaryTile
            label="Needs install"
            value={String(stats.missing + stats.outdated)}
            hint={stats.protected ? `${stats.protected} protected (newer/modified)` : undefined}
          />
        </div>
      )}

      <section className="panel">
        <div className="panel-head-row">
          <h3 className="panel-title">Skill deployment matrix</h3>
          <div className="view-actions">
            <button className="btn" onClick={() => void audit()} disabled={busy !== null}>
              Run audit
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void install({})}
              disabled={busy !== null || (stats !== null && stats.missing + stats.outdated === 0)}
            >
              {busy ?? "Install all skills to all profiles"}
            </button>
          </div>
        </div>
        <p className="view-sub" style={{ margin: "2px 0 10px" }}>
          Every change is backed up first and checksum-verified. Profiles with newer or locally modified
          copies are protected and never overwritten.
        </p>

        <div className="skills-matrix-wrap">
          <table className="skills-matrix">
            <thead>
              <tr>
                <th>Skill</th>
                {overview.profiles.map((p) => (
                  <th key={p.name} title={p.path}>
                    {p.name}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {overview.skills.map((s) => (
                <tr key={s.name}>
                  <td className="skills-name" title={s.description}>
                    <span>{s.name}</span>
                    <span className="skills-version">v{s.version}</span>
                  </td>
                  {overview.profiles.map((p) => {
                    const cell = cellFor(s.name, p.name);
                    const state = cell?.state ?? "Missing";
                    return (
                      <td key={p.name}>
                        <span
                          className="skills-chip"
                          data-state={state}
                          title={
                            state === "UpToDate"
                              ? `v${s.version} installed`
                              : cell?.installedVersion
                                ? `${STATE_LABEL[state]} (v${cell.installedVersion})`
                                : STATE_LABEL[state]
                          }
                        >
                          {STATE_LABEL[state]}
                        </span>
                      </td>
                    );
                  })}
                  <td>
                    <button
                      className="btn btn-small"
                      disabled={busy !== null}
                      onClick={() => void install({ skills: [s.name] })}
                      title={`Install/update '${s.name}' in every profile`}
                    >
                      Sync
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {lastRun && lastRun.results.length > 0 && (
        <section className="panel">
          <h3 className="panel-title">Last run</h3>
          <div className="skills-results">
            {lastRun.results
              .filter((r) => r.action !== "SkippedUpToDate")
              .slice(0, 40)
              .map((r, i) => (
                <div key={i} className="skills-result-row" data-ok={r.success}>
                  <span className="skills-result-action">{r.action}</span>
                  <span>
                    {r.skill} → {r.profile}
                  </span>
                  <span className="skills-result-detail">{r.detail}</span>
                </div>
              ))}
            {lastRun.results.every((r) => r.action === "SkippedUpToDate") && (
              <p className="view-sub">Everything was already up to date.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Header({
  busy,
  onReload,
  overview
}: {
  busy: string | null;
  onReload: () => Promise<void>;
  overview: SkillsOverview;
}) {
  return (
    <header className="view-head">
      <div>
        <h1>Skills Sync</h1>
        <p className="view-sub">
          Curated Claude skills — superpowers, claude-mem, reviews, docs & release tooling — kept
          identical across every profile
        </p>
      </div>
      <div className="view-actions">
        {overview.engineFound && (
          <button className="btn" onClick={() => void window.cam.skills.openApp()} title={overview.enginePath}>
            Open full app
          </button>
        )}
        <button className="btn" onClick={() => void onReload()} disabled={busy !== null}>
          ↻ Refresh
        </button>
      </div>
    </header>
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
