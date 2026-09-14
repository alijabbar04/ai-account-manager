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
        identity: { loggedIn: true, email: "work@example.test" },
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
        identity: { loggedIn: true, email: "personal@example.test" },
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
