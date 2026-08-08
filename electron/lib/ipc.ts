import { BrowserWindow, app, dialog, ipcMain, shell } from "electron";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type {
  MetricKind,
  ProfileState,
  ProviderId,
  RangeKind,
  ThemePref,
  UsageSnapshot
} from "../../shared/types";
import { readIdentity } from "./accountReader";
import { getDefaultConfigDir, setDefaultConfigDir } from "./defaultEnv";
import * as launcher from "./launcher";
import { estimateFromTranscripts, readActivity } from "./localStats";
import { stopWatching, watchForLogin } from "./loginWatcher";
import { isHomeDefaultDir, readJson, settingsFile, writeJsonAtomic } from "./paths";
import * as store from "./profileStore";
import { linkSharedState } from "./sharedState";
import { UsageService } from "./usageService";
import { ApiService } from "./api/apiService";
import { readLocalLedger } from "./api/localLedger";
import { allProviderMeta } from "./api/adapters/index";
import * as keyStore from "./api/keyStore";
import * as skillsSync from "./skillsSync";

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const API_POLL_INTERVAL_MS = 10 * 60 * 1000;
const FOCUS_REFRESH_MIN_GAP_MS = 30 * 1000;

interface Settings {
  theme: ThemePref;
}

function loadSettings(): Settings {
  return readJson<Settings>(settingsFile()) ?? { theme: "system" };
}

export class Backend {
  private usage = new UsageService();
  private api = new ApiService();
  private defaultDir: string | null = null;
  private lastFocusRefresh = 0;
  private guideWin: BrowserWindow | null = null;

  constructor(private getWindow: () => BrowserWindow | null) {}

  async init(): Promise<void> {
    this.defaultDir = await getDefaultConfigDir().catch(() => null);
    for (const profile of store.listProfiles()) {
      try {
        linkSharedState(profile.configDir);
      } catch (err) {
        console.error(`Failed to link shared session state for "${profile.name}":`, err);
      }
    }
    this.registerHandlers();
    this.registerApiKeyHandlers();
    this.registerSkillsHandlers();
    setInterval(() => void this.refreshAll(), POLL_INTERVAL_MS);
    setInterval(() => void this.refreshApiKeys(), API_POLL_INTERVAL_MS);
    app.on("browser-window-focus", () => {
      if (Date.now() - this.lastFocusRefresh > FOCUS_REFRESH_MIN_GAP_MS) {
        this.lastFocusRefresh = Date.now();
        void this.refreshAll();
        void this.refreshApiKeys();
      }
    });
    // Initial fetch shortly after startup, so cached data renders first.
    setTimeout(() => void this.refreshAll(), 800);
    setTimeout(() => void this.refreshApiKeys(), 1200);
    // test hook: CAM_OPEN_GUIDE=1 opens the guide viewer on launch
    if (process.env.CAM_OPEN_GUIDE) setTimeout(() => this.openGuideWindow(), 600);
  }

  // ---- Usage tracking guide (in-app PDF viewer) ----------------------
  private guidePdfPath(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, "USAGE_TRACKING_GUIDE.pdf")
      : path.join(__dirname, "..", "docs", "USAGE_TRACKING_GUIDE.pdf");
  }

  private openGuideWindow(): void {
    if (this.guideWin && !this.guideWin.isDestroyed()) {
      this.guideWin.focus();
      return;
    }
    const w = new BrowserWindow({
      width: 980,
      height: 920,
      minWidth: 660,
      minHeight: 480,
      autoHideMenuBar: true,
      backgroundColor: "#0d0f12",
      title: "API Usage Tracking Guide",
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        plugins: true // Chromium's built-in PDF viewer needs the plugin
      }
    });
    w.on("closed", () => (this.guideWin = null));
    this.guideWin = w;
    void w.loadFile(path.join(__dirname, "guide-viewer.html"), {
      query: { pdf: pathToFileURL(this.guidePdfPath()).href }
    });
  }

  private pushApiKeys(): void {
    this.getWindow()?.webContents.send("apikeys:changed", this.api.buildKeyStates());
  }

  private async refreshApiKeys(id?: string): Promise<void> {
    await this.api.refreshAll(id);
    this.pushApiKeys();
  }

  // ---- Skills Sync (AI Environment Manager engine bridge) -------------
  private registerSkillsHandlers(): void {
    ipcMain.handle("skills:overview", () => skillsSync.skillsOverview());
    ipcMain.handle(
      "skills:install",
      (_e, opts: { profiles?: string[]; skills?: string[]; dryRun?: boolean; force?: boolean }) =>
        skillsSync.installSkills(opts ?? {})
    );
    ipcMain.handle("skills:audit", () => skillsSync.runAudit());
    ipcMain.handle("skills:openApp", () => skillsSync.openApp());
  }

  private registerApiKeyHandlers(): void {
    ipcMain.handle("providers:meta", () => allProviderMeta());
    ipcMain.handle("apikeys:localLedger", () => readLocalLedger());
    ipcMain.handle("apikeys:list", () => this.api.buildKeyStates());
    ipcMain.handle("apikeys:summary", () => this.api.buildSummary());
    ipcMain.handle("apikeys:chart", (_e, id: string, metric: MetricKind, range: RangeKind) =>
      this.api.buildChart(id, metric, range)
    );

    ipcMain.handle(
      "apikeys:validate",
      async (_e, provider: ProviderId, secret: string) => this.api.validate(provider, secret)
    );

    ipcMain.handle(
      "apikeys:add",
      async (_e, input: { provider: ProviderId; nickname: string; secret: string; isAdminKey?: boolean; monthlyBudgetUsd?: number | null }) => {
        try {
          const record = keyStore.addKey(input);
          await this.refreshApiKeys(record.id);
          return { ok: true, record };
        } catch (err) {
          return { ok: false, error: (err as Error).message };
        }
      }
    );

    ipcMain.handle(
      "apikeys:update",
      async (_e, id: string, patch: { nickname?: string; isAdminKey?: boolean; monthlyBudgetUsd?: number | null; secret?: string }) => {
        try {
          const record = keyStore.updateKey(id, patch);
          await this.refreshApiKeys(id);
          return { ok: true, record };
        } catch (err) {
          return { ok: false, error: (err as Error).message };
        }
      }
    );

    ipcMain.handle("apikeys:remove", (_e, id: string) => {
      try {
        keyStore.removeKey(id);
        this.api.onRemoveKey(id);
        this.pushApiKeys();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    });

    ipcMain.handle("apikeys:refresh", async (_e, id?: string) => {
      await this.refreshApiKeys(id);
    });

    ipcMain.handle("apikeys:export", async () => {
      const win = this.getWindow();
      if (!win) return { ok: false, error: "No window" };
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: "Export API key list (no secrets)",
        defaultPath: "api-keys.json",
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      if (canceled || !filePath) return { ok: false };
      writeJsonAtomic(filePath, keyStore.exportRecords());
      return { ok: true, path: filePath };
    });
  }

  private norm(p: string): string {
    return path.resolve(p).toLowerCase();
  }

  private async buildStates(): Promise<ProfileState[]> {
    const profiles = store.listProfiles();
    return Promise.all(
      profiles.map(async (profile) => {
        const identity = readIdentity(profile.configDir);
        const activity = readActivity(profile.configDir);
        let usage = this.usage.getCached(profile.id);
        // When exact data is unavailable, attach local estimates (labeled in UI).
        if (usage && !usage.ok && identity.loggedIn) {
          try {
            const est = await estimateFromTranscripts(profile.configDir);
            activity.estTokens7d = est.estTokens7d;
            activity.estPrompts7d = est.estPrompts7d;
          } catch {
            /* estimation is best-effort */
          }
        }
        // With no user-level override set, new shells use ~\.claude — so that
        // profile (if registered) is the effective default.
        const isDefault = this.defaultDir
          ? this.norm(this.defaultDir) === this.norm(profile.configDir)
          : isHomeDefaultDir(profile.configDir);
        return { profile, identity, usage, activity, isDefault };
      })
    );
  }

  private async pushState(): Promise<void> {
    const states = await this.buildStates();
    this.getWindow()?.webContents.send("state:changed", states);
  }

  private async refreshAll(profileId?: string): Promise<void> {
    const profiles = store.listProfiles().filter((p) => !profileId || p.id === profileId);
    await Promise.allSettled(
      profiles.map(async (p) => {
        if (readIdentity(p.configDir).loggedIn) {
          await this.usage.refresh(p);
        }
      })
    );
    await this.pushState();
  }

  private registerHandlers(): void {
    ipcMain.handle("state:get", () => this.buildStates());

    ipcMain.handle("profiles:create", (_e, name: string) => {
      try {
        const profile = store.createProfile(name);
        linkSharedState(profile.configDir);
        void this.pushState();
        return { ok: true, profile };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    });

    ipcMain.handle("profiles:import", (_e, name: string, dir: string) => {
      try {
        const profile = store.importProfile(name, dir);
        linkSharedState(profile.configDir);
        void this.refreshAll(profile.id);
        return { ok: true, profile };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    });

    ipcMain.handle("profiles:rename", (_e, id: string, name: string) => {
      try {
        const profile = store.renameProfile(id, name);
        void this.pushState();
        return { ok: true, profile };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    });

    ipcMain.handle("profiles:remove", (_e, id: string, deleteDir: boolean) => {
      try {
        stopWatching(id);
        store.removeProfile(id, deleteDir);
        this.usage.dropProfile(id);
        void this.pushState();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    });

    ipcMain.handle("profiles:export", async () => {
      const win = this.getWindow();
      if (!win) return { ok: false, error: "No window" };
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: "Export account list",
        defaultPath: "claude-accounts.json",
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      if (canceled || !filePath) return { ok: false };
      writeJsonAtomic(filePath, store.exportProfiles());
      return { ok: true, path: filePath };
    });

    ipcMain.handle("sys:pickFolder", async () => {
      const win = this.getWindow();
      if (!win) return null;
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: "Select an existing CLAUDE_CONFIG_DIR",
        properties: ["openDirectory", "showHiddenFiles"]
      });
      return canceled ? null : filePaths[0] ?? null;
    });

    ipcMain.handle("usage:refresh", async (_e, profileId?: string) => {
      await this.refreshAll(profileId);
    });

    ipcMain.handle("launch", (_e, kind: string, profileId: string) => {
      const profile = store.getProfile(profileId);
      if (!profile) return { ok: false, error: "Account not found." };
      try {
        switch (kind) {
          case "powershell":
            launcher.openPowerShell(profile);
            return { ok: true };
          case "claude":
            launcher.openClaude(profile);
            return { ok: true };
          case "vscode":
            return launcher.openVSCode(profile);
          case "login":
            launcher.openLoginTerminal(profile);
            watchForLogin(profile.id, profile.configDir, () => void this.refreshAll(profile.id));
            return { ok: true };
          default:
            return { ok: false, error: `Unknown launch kind: ${kind}` };
        }
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    });

    ipcMain.handle("default:set", async (_e, profileId: string | null) => {
      try {
        let dir = profileId ? store.getProfile(profileId)?.configDir ?? null : null;
        if (profileId && !dir) return { ok: false, error: "Account not found." };
        // The home ~\.claude profile is made default by CLEARING the variable
        // (setting it explicitly would fork Claude Code's .claude.json state).
        if (dir && isHomeDefaultDir(dir)) dir = null;
        await setDefaultConfigDir(dir);
        this.defaultDir = dir;
        void this.pushState();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    });

    ipcMain.handle("sys:reveal", (_e, profileId: string) => {
      const profile = store.getProfile(profileId);
      if (profile) shell.openPath(profile.configDir);
    });

    ipcMain.handle("ui:getTheme", () => loadSettings().theme);
    ipcMain.handle("ui:setTheme", (_e, theme: ThemePref) => {
      writeJsonAtomic(settingsFile(), { ...loadSettings(), theme });
    });

    ipcMain.handle("sys:versions", async () => {
      return { app: app.getVersion(), claudeCli: await launcher.claudeCliVersion() };
    });

    ipcMain.handle("guide:open", () => this.openGuideWindow());

    ipcMain.handle("guide:acrobat", async () => {
      const pdf = this.guidePdfPath();
      const candidates = [
        "C:\\Program Files\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe",
        "C:\\Program Files (x86)\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe",
        "C:\\Program Files\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe",
        "C:\\Program Files (x86)\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe"
      ];
      const exe = candidates.find((p) => fs.existsSync(p));
      if (exe) {
        spawn(exe, [pdf], { detached: true, stdio: "ignore" }).unref();
        return { ok: true, how: "acrobat" };
      }
      // no Acrobat on this machine -> whatever handles PDFs by default
      const err = await shell.openPath(pdf);
      return { ok: !err, how: "default", error: err || undefined };
    });
  }
}

export type { UsageSnapshot };
