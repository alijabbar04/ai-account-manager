"use strict";

// electron/preload.ts
var import_electron = require("electron");
var api = {
  listStates: () => import_electron.ipcRenderer.invoke("state:get"),
  createProfile: (name, dashboardRole) =>
    import_electron.ipcRenderer.invoke("profiles:create", name, dashboardRole),
  importProfile: (name, configDir, dashboardRole) =>
    import_electron.ipcRenderer.invoke(
      "profiles:import",
      name,
      configDir,
      dashboardRole,
    ),
  renameProfile: (id, name) =>
    import_electron.ipcRenderer.invoke("profiles:rename", id, name),
  removeProfile: (id, deleteDir) =>
    import_electron.ipcRenderer.invoke("profiles:remove", id, deleteDir),
  exportProfiles: () => import_electron.ipcRenderer.invoke("profiles:export"),
  pickFolder: () => import_electron.ipcRenderer.invoke("sys:pickFolder"),
  refreshUsage: (profileId) =>
    import_electron.ipcRenderer.invoke("usage:refresh", profileId),
  getGptUsage: () => import_electron.ipcRenderer.invoke("gpt:usage"),
  refreshGptUsage: () => import_electron.ipcRenderer.invoke("gpt:refresh"),
  getClaudeHistory: (days) =>
    import_electron.ipcRenderer.invoke("claude:history", days),
  onGptUsageChanged: (cb) => {
    const listener = (_e, usage) => cb(usage);
    import_electron.ipcRenderer.on("gpt:usage-changed", listener);
    return () =>
      import_electron.ipcRenderer.removeListener("gpt:usage-changed", listener);
  },
  launchVSCode: (profileId) =>
    import_electron.ipcRenderer.invoke("profiles:launchVSCode", profileId),
  login: (profileId) =>
    import_electron.ipcRenderer.invoke("profiles:login", profileId),
  launchers: {
    claudeCowork: () =>
      import_electron.ipcRenderer.invoke("launchers:claudeCowork"),
    codexChat: () => import_electron.ipcRenderer.invoke("launchers:codexChat"),
    vscodeCodex: () =>
      import_electron.ipcRenderer.invoke("launchers:vscodeCodex"),
    vscodeProject: () =>
      import_electron.ipcRenderer.invoke("launchers:vscodeProject"),
    openHelp: (target) =>
      import_electron.ipcRenderer.invoke("launchers:help", target),
  },
  visibility: {
    get: () => import_electron.ipcRenderer.invoke("profiles:visibility:get"),
    setHidden: (profileId, hidden) =>
      import_electron.ipcRenderer.invoke(
        "profiles:visibility:setHidden",
        profileId,
        hidden,
      ),
    showAll: () =>
      import_electron.ipcRenderer.invoke("profiles:visibility:showAll"),
  },
  otherAccountsLayout: {
    get: () =>
      import_electron.ipcRenderer.invoke("profiles:otherAccountsLayout:get"),
    set: (layout) =>
      import_electron.ipcRenderer.invoke(
        "profiles:otherAccountsLayout:set",
        layout,
      ),
  },
  setDefault: (profileId) =>
    import_electron.ipcRenderer.invoke("default:set", profileId),
  revealFolder: (profileId) =>
    import_electron.ipcRenderer.invoke("sys:reveal", profileId),
  getTheme: () => import_electron.ipcRenderer.invoke("ui:getTheme"),
  setTheme: (theme) => import_electron.ipcRenderer.invoke("ui:setTheme", theme),
  getVersions: () => import_electron.ipcRenderer.invoke("sys:versions"),
  openUsageGuide: () => import_electron.ipcRenderer.invoke("guide:open"),
  openGuideInAcrobat: () => import_electron.ipcRenderer.invoke("guide:acrobat"),
  onStateChanged: (cb) => {
    const listener = (_e, states) => cb(states);
    import_electron.ipcRenderer.on("state:changed", listener);
    return () =>
      import_electron.ipcRenderer.removeListener("state:changed", listener);
  },
  alerts: {
    get: () => import_electron.ipcRenderer.invoke("alerts:get"),
    set: (settings) =>
      import_electron.ipcRenderer.invoke("alerts:set", settings),
    test: () => import_electron.ipcRenderer.invoke("alerts:test"),
  },
  updates: {
    get: () => import_electron.ipcRenderer.invoke("updates:get"),
    check: () => import_electron.ipcRenderer.invoke("updates:check"),
    configure: (settings) =>
      import_electron.ipcRenderer.invoke("updates:configure", settings),
    openDownload: () =>
      import_electron.ipcRenderer.invoke("updates:openDownload"),
  },
  automation: {
    getState: () => import_electron.ipcRenderer.invoke("automation:getState"),
    setSettings: (patch) =>
      import_electron.ipcRenderer.invoke("automation:setSettings", patch),
    pause: (minutes) =>
      import_electron.ipcRenderer.invoke("automation:pause", minutes),
    resume: () => import_electron.ipcRenderer.invoke("automation:resume"),
    diagnostics: () =>
      import_electron.ipcRenderer.invoke("automation:diagnostics"),
    inspect: () => import_electron.ipcRenderer.invoke("automation:inspect"),
    applyNativeMode: (mode) =>
      import_electron.ipcRenderer.invoke("automation:applyNativeMode", mode),
    activity: () => import_electron.ipcRenderer.invoke("automation:activity"),
    clearActivity: () =>
      import_electron.ipcRenderer.invoke("automation:clearActivity"),
    exportActivity: () =>
      import_electron.ipcRenderer.invoke("automation:exportActivity"),
    exportDiagnostics: (reviewedReport) =>
      import_electron.ipcRenderer.invoke(
        "automation:exportDiagnostics",
        reviewedReport,
      ),
    onChanged: (cb) => {
      const listener = (_e, state) => cb(state);
      import_electron.ipcRenderer.on("automation:changed", listener);
      return () =>
        import_electron.ipcRenderer.removeListener(
          "automation:changed",
          listener,
        );
    },
    onActivityChanged: (cb) => {
      const listener = () => cb();
      import_electron.ipcRenderer.on("automation:activity-changed", listener);
      return () =>
        import_electron.ipcRenderer.removeListener(
          "automation:activity-changed",
          listener,
        );
    },
    sessions: {
      discover: () => import_electron.ipcRenderer.invoke("sessions:discover"),
      list: () => import_electron.ipcRenderer.invoke("sessions:list"),
      save: (profile) =>
        import_electron.ipcRenderer.invoke("sessions:save", profile),
      remove: (id) => import_electron.ipcRenderer.invoke("sessions:remove", id),
      cleanupData: (id) =>
        import_electron.ipcRenderer.invoke("sessions:cleanupData", id),
      quickLaunch: (provider) =>
        import_electron.ipcRenderer.invoke("sessions:quickLaunch", provider),
      launch: (id) => import_electron.ipcRenderer.invoke("sessions:launch", id),
      openLoginLink: (id, url) =>
        import_electron.ipcRenderer.invoke("sessions:openLoginLink", id, url),
    },
  },
  skills: {
    overview: () => import_electron.ipcRenderer.invoke("skills:overview"),
    install: (opts) =>
      import_electron.ipcRenderer.invoke("skills:install", opts),
    runAudit: () => import_electron.ipcRenderer.invoke("skills:audit"),
    openApp: () => import_electron.ipcRenderer.invoke("skills:openApp"),
  },
  apiKeys: {
    providerMeta: () => import_electron.ipcRenderer.invoke("providers:meta"),
    list: () => import_electron.ipcRenderer.invoke("apikeys:list"),
    summary: () => import_electron.ipcRenderer.invoke("apikeys:summary"),
    chart: (id, metric, range) =>
      import_electron.ipcRenderer.invoke("apikeys:chart", id, metric, range),
    validate: (provider, secret) =>
      import_electron.ipcRenderer.invoke("apikeys:validate", provider, secret),
    add: (input) => import_electron.ipcRenderer.invoke("apikeys:add", input),
    update: (id, patch) =>
      import_electron.ipcRenderer.invoke("apikeys:update", id, patch),
    remove: (id) => import_electron.ipcRenderer.invoke("apikeys:remove", id),
    refresh: (id) => import_electron.ipcRenderer.invoke("apikeys:refresh", id),
    export: () => import_electron.ipcRenderer.invoke("apikeys:export"),
    localLedger: () =>
      import_electron.ipcRenderer.invoke("apikeys:localLedger"),
    onChanged: (cb) => {
      const listener = (_e, states) => cb(states);
      import_electron.ipcRenderer.on("apikeys:changed", listener);
      return () =>
        import_electron.ipcRenderer.removeListener("apikeys:changed", listener);
    },
  },
};
import_electron.contextBridge.exposeInMainWorld("cam", api);
