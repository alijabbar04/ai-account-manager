import { contextBridge, ipcRenderer } from "electron";
import type {
  ApiKeyState,
  CamApi,
  MetricKind,
  ProfileState,
  ProviderId,
  RangeKind,
  ThemePref
} from "../shared/types";

const api: CamApi = {
  listStates: () => ipcRenderer.invoke("state:get"),
  createProfile: (name) => ipcRenderer.invoke("profiles:create", name),
  importProfile: (name, configDir) => ipcRenderer.invoke("profiles:import", name, configDir),
  renameProfile: (id, name) => ipcRenderer.invoke("profiles:rename", id, name),
  removeProfile: (id, deleteDir) => ipcRenderer.invoke("profiles:remove", id, deleteDir),
  exportProfiles: () => ipcRenderer.invoke("profiles:export"),
  pickFolder: () => ipcRenderer.invoke("sys:pickFolder"),
  refreshUsage: (profileId) => ipcRenderer.invoke("usage:refresh", profileId),
  launch: (kind, profileId) => ipcRenderer.invoke("launch", kind, profileId),
  setDefault: (profileId) => ipcRenderer.invoke("default:set", profileId),
  revealFolder: (profileId) => ipcRenderer.invoke("sys:reveal", profileId),
  getTheme: () => ipcRenderer.invoke("ui:getTheme"),
  setTheme: (theme: ThemePref) => ipcRenderer.invoke("ui:setTheme", theme),
  getVersions: () => ipcRenderer.invoke("sys:versions"),
  openUsageGuide: () => ipcRenderer.invoke("guide:open"),
  openGuideInAcrobat: () => ipcRenderer.invoke("guide:acrobat"),
  onStateChanged: (cb: (states: ProfileState[]) => void) => {
    const listener = (_e: unknown, states: ProfileState[]) => cb(states);
    ipcRenderer.on("state:changed", listener);
    return () => ipcRenderer.removeListener("state:changed", listener);
  },
  skills: {
    overview: () => ipcRenderer.invoke("skills:overview"),
    install: (opts) => ipcRenderer.invoke("skills:install", opts),
    runAudit: () => ipcRenderer.invoke("skills:audit"),
    openApp: () => ipcRenderer.invoke("skills:openApp")
  },
  apiKeys: {
    providerMeta: () => ipcRenderer.invoke("providers:meta"),
    list: () => ipcRenderer.invoke("apikeys:list"),
    summary: () => ipcRenderer.invoke("apikeys:summary"),
    chart: (id: string, metric: MetricKind, range: RangeKind) =>
      ipcRenderer.invoke("apikeys:chart", id, metric, range),
    validate: (provider: ProviderId, secret: string) => ipcRenderer.invoke("apikeys:validate", provider, secret),
    add: (input) => ipcRenderer.invoke("apikeys:add", input),
    update: (id: string, patch) => ipcRenderer.invoke("apikeys:update", id, patch),
    remove: (id: string) => ipcRenderer.invoke("apikeys:remove", id),
    refresh: (id?: string) => ipcRenderer.invoke("apikeys:refresh", id),
    export: () => ipcRenderer.invoke("apikeys:export"),
    localLedger: () => ipcRenderer.invoke("apikeys:localLedger"),
    onChanged: (cb: (states: ApiKeyState[]) => void) => {
      const listener = (_e: unknown, states: ApiKeyState[]) => cb(states);
      ipcRenderer.on("apikeys:changed", listener);
      return () => ipcRenderer.removeListener("apikeys:changed", listener);
    }
  }
};

contextBridge.exposeInMainWorld("cam", api);
