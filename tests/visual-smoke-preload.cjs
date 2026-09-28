const { contextBridge } = require("electron");

const now = Date.now();
const otherCount = Math.max(
  0,
  Math.min(12, Number(process.env.SMOKE_OTHER_COUNT ?? 5) || 0),
);
const hiddenOtherCount = Math.max(
  0,
  Math.min(otherCount, Number(process.env.SMOKE_HIDDEN_OTHER_COUNT ?? 1) || 0),
);
const hideMainProfiles = process.env.SMOKE_HIDE_MAIN_PROFILES === "1";
const noProfiles = process.env.SMOKE_NO_PROFILES === "1";
const states = noProfiles
  ? []
  : [
      {
        profile: {
          id: "work-smoke",
          name: "Work Example",
          configDir: "C:\\Smoke Test\\Work & Research",
        },
        identity: {
          loggedIn: true,
          email: "work@example.test",
          planLabel: "Team Premium",
        },
        usage: {
          ok: true,
          fetchedAt: now,
          limits: [
            {
              kind: "session",
              percent: 34,
              severity: "normal",
              resetsAt: new Date(now + 60 * 60 * 1_000).toISOString(),
            },
            {
              kind: "weekly_all",
              percent: 61,
              severity: "normal",
              resetsAt: new Date(now + 2 * 24 * 60 * 60 * 1_000).toISOString(),
            },
          ],
        },
        activity: {},
        isDefault: true,
        dashboardRole: "work",
        hidden: hideMainProfiles,
      },
      {
        profile: {
          id: "personal-smoke",
          name: "Personal Example",
          configDir: "C:\\Smoke Test\\Personal's Profile",
        },
        identity: {
          loggedIn: true,
          email: "personal@example.test",
          planLabel: "Max 20x",
        },
        usage: {
          ok: true,
          fetchedAt: now,
          limits: [
            {
              kind: "session",
              percent: 12,
              severity: "normal",
              resetsAt: new Date(now + 90 * 60 * 1_000).toISOString(),
            },
          ],
        },
        activity: {},
        isDefault: false,
        dashboardRole: "personal",
        hidden: hideMainProfiles,
      },
    ];

for (let index = 0; !noProfiles && index < otherCount; index += 1) {
  states.push({
    profile: {
      id: `other-smoke-${index + 1}`,
      name: `Additional Example ${String(index + 1).padStart(2, "0")}`,
      configDir: `C:\\Smoke Test\\Additional ${index + 1} & Research`,
    },
    identity: {
      loggedIn: true,
      email: `additional-${index + 1}@example.test`,
      planLabel: "Pro",
    },
    usage: {
      ok: true,
      fetchedAt: now,
      limits: [
        {
          kind: "session",
          percent: 18 + index * 3,
          severity: "normal",
          resetsAt: new Date(now + 45 * 60 * 1_000).toISOString(),
        },
      ],
    },
    activity: {},
    isDefault: false,
    dashboardRole: null,
    hidden: index >= otherCount - hiddenOtherCount,
  });
}

const gptUsage = {
  ok: true,
  fetchedAt: now,
  account: { email: "codex@example.test", planType: "plus" },
  rateLimits: {
    rateLimits: {
      limitId: "codex",
      limitName: "codex",
      primary: {
        usedPercent: 27,
        windowDurationMins: 300,
        resetsAt: Math.floor((now + 75 * 60 * 1_000) / 1_000),
      },
      secondary: {
        usedPercent: 43,
        windowDurationMins: 10080,
        resetsAt: Math.floor((now + 4 * 24 * 60 * 60 * 1_000) / 1_000),
      },
    },
  },
};

// SMOKE_PHONE=pairing shows Settings with phone sync on and a code on screen.
const qrPlaceholder = `data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#fff"/><path d="M1 1h3v3H1zM6 1h3v3H6zM1 6h3v3H1zM6 6h1v1H6zM8 8h1v1H8z" fill="#000"/></svg>',
)}`;
let phoneView =
  process.env.SMOKE_PHONE === "pairing"
    ? {
        enabled: true,
        keepRunning: true,
        port: 47821,
        status: { state: "listening", host: "100.101.102.103", port: 47821 },
        device: null,
        pairing: {
          code: "K7QX-M2PA",
          link: "aamusage://pair?host=100.101.102.103&port=47821&code=K7QXM2PA",
          qrDataUrl: qrPlaceholder,
          expiresAt: now + 9.5 * 60 * 1_000,
        },
        encryptionAvailable: true,
      }
    : {
        enabled: false,
        keepRunning: true,
        port: 47821,
        status: { state: "off" },
        device: null,
        pairing: null,
        encryptionAvailable: true,
      };

let otherAccountsLayout =
  process.env.SMOKE_SAVED_LAYOUT === "wide" ? "wide" : "grid";
let listStatesCalls = 0;
let layoutSetCalls = 0;

const noopSubscription = () => () => {};
contextBridge.exposeInMainWorld("cam", {
  listStates: async () => {
    listStatesCalls += 1;
    return states;
  },
  onStateChanged: noopSubscription,
  refreshUsage: async () => ({ ok: true }),
  getGptUsage: async () => gptUsage,
  refreshGptUsage: async () => gptUsage,
  onGptUsageChanged: noopSubscription,
  getTheme: async () => process.env.SMOKE_THEME ?? "dark",
  setTheme: async () => undefined,
  launchVSCode: async () => ({ ok: true }),
  login: async () => ({ ok: true }),
  setDefault: async () => ({ ok: true }),
  revealFolder: async () => undefined,
  visibility: {
    setHidden: async () => ({ ok: true }),
    showAll: async () => ({ ok: true }),
  },
  otherAccountsLayout: {
    get: async () => otherAccountsLayout,
    set: async (layout) => {
      layoutSetCalls += 1;
      if (layout !== "grid" && layout !== "wide") {
        return { ok: false, error: "Invalid visual-smoke layout." };
      }
      otherAccountsLayout = layout;
      return { ok: true, layout };
    },
  },
  phone: {
    get: async () => phoneView,
    set: async (patch) => (phoneView = { ...phoneView, ...patch }),
    pair: async () => ({ ok: true, view: phoneView }),
    cancelPairing: async () => (phoneView = { ...phoneView, pairing: null }),
    unpair: async () => (phoneView = { ...phoneView, device: null }),
    onChanged: noopSubscription,
  },
  __visualSmoke: {
    stats: async () => ({ listStatesCalls, layoutSetCalls }),
  },
  launchers: {
    claudeCowork: async () => ({ ok: true }),
    codexChat: async () => ({ ok: true }),
    vscodeCodex: async () => ({ ok: true, message: "VS Code opened." }),
    vscodeProject: async () => ({ ok: true, cancelled: true }),
    openHelp: async () => ({ ok: true }),
  },
  apiKeys: {
    providerMeta: async () => [],
    list: async () => [],
    summary: async () => ({}),
    onChanged: noopSubscription,
  },
});
