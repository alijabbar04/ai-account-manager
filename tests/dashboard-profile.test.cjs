const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
  migrateDashboardSelection,
  selectDashboardProfile,
} = require("../app/dist-electron/dashboard-profile-domain.cjs");
const profile = (id, extra = {}) => ({
  id,
  name: id,
  configDir: "C:/Synthetic/" + id,
  ...extra,
});

test("legacy lone or first unassigned profile migrates once without changing metadata", () => {
  for (const profiles of [
    [profile("only")],
    [profile("first"), profile("second")],
  ]) {
    const legacy = { version: 1, profiles, extra: "preserve" };
    const result = migrateDashboardSelection(legacy);
    assert.equal(result.dashboardProfileId, profiles[0].id);
    assert.equal(result.profiles[0].dashboardRole, "work");
    assert.equal(result.extra, "preserve");
    assert.equal(result.profiles[0].vscodeProfileLabel, null);
    assert.equal(legacy.profiles[0].dashboardRole, undefined);
    assert.equal(migrateDashboardSelection(result), result);
  }
});
test("legacy work/personal dashboard becomes one choice and preserves personal isolation", () => {
  const result = migrateDashboardSelection({
    profiles: [
      profile("other"),
      profile("personal", { dashboardRole: "personal" }),
      profile("work", { dashboardRole: "work" }),
    ],
  });
  assert.equal(result.dashboardProfileId, "work");
  assert.equal(result.profiles.filter((p) => p.dashboardRole).length, 1);
  assert.equal(result.profiles[1].isolatedSharedState, true);
  assert.equal(result.profiles[1].vscodeProfileLabel, "Personal");
  assert.equal(result.profiles[2].vscodeProfileLabel, "Work");
  const switched = selectDashboardProfile(result, "personal");
  assert.equal(switched.profiles[1].dashboardRole, "personal");
  assert.equal(switched.profiles.filter((p) => p.dashboardRole).length, 1);
});
test("clear survives reload and further additions; invalid selections do not mutate store", () => {
  const initial = migrateDashboardSelection({
    profiles: [profile("one"), profile("two")],
  });
  const selected = selectDashboardProfile(initial, "two");
  assert.equal(selected.dashboardProfileId, "two");
  const cleared = selectDashboardProfile(selected, null);
  assert.equal(migrateDashboardSelection(cleared), cleared);
  assert.equal(
    cleared.profiles.some((p) => p.dashboardRole),
    false,
  );
  const added = { ...cleared, profiles: [...cleared.profiles, profile("new")] };
  const normalizedAdded = migrateDashboardSelection(added);
  assert.equal(normalizedAdded.dashboardProfileId, null);
  assert.equal(
    normalizedAdded.profiles.some((p) => p.dashboardRole),
    false,
  );
  assert.equal(migrateDashboardSelection(normalizedAdded), normalizedAdded);
  for (const bad of ["missing", undefined, 42, {}])
    assert.throws(
      () => selectDashboardProfile(initial, bad),
      /Account not found/,
    );
  assert.equal(initial.dashboardProfileId, "one");
});
test("empty installation waits for first add; removed selected profile does not elect a replacement", () => {
  const empty = { version: 1, profiles: [] };
  assert.equal(migrateDashboardSelection(empty), empty);
  assert.equal(
    migrateDashboardSelection({ ...empty, profiles: [profile("new")] })
      .dashboardProfileId,
    "new",
  );
  const missing = migrateDashboardSelection({
    dashboardProfileId: "gone",
    profiles: [profile("remaining")],
  });
  assert.equal(missing.dashboardProfileId, null);
  assert.equal(missing.profiles[0].dashboardRole, undefined);
});

const renderer = fs.readFileSync(
  path.join(__dirname, "../app/dist/assets/index-CfQCNBzk.js"),
  "utf8",
);
function source(name, next) {
  const start = renderer.indexOf(name);
  assert.ok(start >= 0);
  return renderer.slice(start, renderer.indexOf(next, start + name.length));
}
const jsx = (type, props) => ({ type, props });
function buttons(tree) {
  if (!tree || typeof tree !== "object") return [];
  const children = tree.props?.children;
  return [
    ...(tree.type === "button" ? [tree] : []),
    ...[children].flat(Infinity).flatMap(buttons),
  ];
}
test("opening Claude menus renders and dispatches dashboard actions for both card types", () => {
  const make = vm.runInNewContext(
    "(" + source("function Jo({", "function As(") + ")",
    {
      q: {
        useState: (value) => [value === false ? true : value, () => {}],
        useRef: () => ({ current: null }),
        useEffect: () => {},
      },
      i: { jsx, jsxs: jsx },
      Gv: () => ({ kind: "ok" }),
      Xv: () => [],
      ProviderBrand: () => {},
      AccountPlanBadge: () => {},
      Qv: () => {},
      window: {},
    },
  );
  for (const role of [null, "work"]) {
    const calls = [];
    const tree = make({
      state: {
        profile: profile("example"),
        identity: { loggedIn: true, email: "test@example.test" },
        dashboardRole: role,
      },
      onDashboardChange: (id) => calls.push(id),
    });
    const menuButtons = buttons(tree).filter(
      (button) => button.props.role === "menuitem",
    );
    const action = menuButtons.find(
      (button) =>
        button.props.children ===
        (role ? "Remove from Dashboard" : "Show on Dashboard"),
    );
    assert.ok(action);
    action.props.onClick();
    assert.deepEqual(calls, [role ? null : "example"]);
    assert.ok(
      !menuButtons.some((button) => /default/i.test(button.props.children)),
    );
  }
});
test("root boundary supplies an accessible Reload panel and wraps the app", () => {
  class Component {
    constructor(props) {
      this.props = props;
    }
  }
  const Boundary = vm.runInNewContext(
    "(" + source("class AppErrorBoundary", "Uv.createRoot(") + ")",
    {
      q: { Component },
      i: { jsx, jsxs: jsx },
      window: { location: { reload: () => {} } },
    },
  );
  const boundary = new Boundary({ children: "application" });
  assert.equal(boundary.render(), "application");
  boundary.state = Boundary.getDerivedStateFromError(
    new Error("synthetic render failure"),
  );
  const panel = boundary.render();
  assert.equal(panel.props.children.props.role, "alert");
  assert.equal(buttons(panel)[0].props.children, "Reload");
  assert.ok(
    renderer
      .slice(renderer.lastIndexOf("Uv.createRoot("))
      .includes("i.jsx(AppErrorBoundary"),
  );
});

test("profile migration uses the atomic writer and selection is bridged independently of default/layout", () => {
  const main = fs.readFileSync(
    path.join(__dirname, "../app/dist-electron/main.cjs"),
    "utf8",
  );
  const preload = fs.readFileSync(
    path.join(__dirname, "../app/dist-electron/preload.cjs"),
    "utf8",
  );
  const loadStart = main.indexOf("function load() {");
  const loadEnd = main.indexOf("function slugify", loadStart);
  let store = { profiles: [profile("legacy")] };
  const writes = [];
  const load = vm.runInNewContext(main.slice(loadStart, loadEnd) + "; load", {
    readJson: () => store,
    profilesFile: () => "synthetic-profiles.json",
    migrateDashboardSelection,
    writeJsonAtomic: (file, value) => {
      writes.push([file, value]);
      store = value;
    },
  });
  assert.equal(load().dashboardProfileId, "legacy");
  load();
  assert.equal(writes.length, 1);
  assert.equal(writes[0][0], "synthetic-profiles.json");
  assert.ok(main.includes('"profiles:dashboard:set"'));
  assert.ok(
    preload.includes("setDashboardProfile") &&
      preload.includes('"profiles:dashboard:set"'),
  );
  assert.ok(!renderer.includes("!N.isDefault && !N.dashboardRole"));
});

test("dashboard IPC restores selected visibility and keeps layout/default settings", async () => {
  const main = fs.readFileSync(
    path.join(__dirname, "../app/dist-electron/main.cjs"),
    "utf8",
  );
  const channel = main.indexOf('"profiles:dashboard:set"');
  const start = main.lastIndexOf("import_electron4.ipcMain.handle(", channel);
  const end = main.indexOf(
    'import_electron4.ipcMain.handle("profiles:rename"',
    channel,
  );
  let handler;
  let store = migrateDashboardSelection({
    profiles: [profile("one"), profile("two")],
  });
  let settings = {
    hiddenProfileIds: ["two", "unrelated"],
    otherAccountsLayout: "wide",
    defaultDir: "synthetic-default",
  };
  let pushes = 0;
  const register = vm.runInNewContext(
    "(function() {" + main.slice(start, end) + "})",
    {
      import_electron4: {
        ipcMain: {
          handle: (name, callback) => {
            assert.equal(name, "profiles:dashboard:set");
            handler = callback;
          },
        },
      },
      load: () => store,
      save: (value) => {
        store = value;
      },
      selectDashboardProfile,
      loadSettings: () => settings,
      saveSettings: (patch) => {
        settings = { ...settings, ...patch };
      },
    },
  );
  register.call({
    pushState: async () => {
      pushes += 1;
    },
  });
  assert.equal((await handler(null, "two")).ok, true);
  assert.equal(store.dashboardProfileId, "two");
  assert.deepEqual(Array.from(settings.hiddenProfileIds), ["unrelated"]);
  assert.equal(settings.otherAccountsLayout, "wide");
  assert.equal(settings.defaultDir, "synthetic-default");
  assert.equal((await handler(null, null)).ok, true);
  assert.equal(store.dashboardProfileId, null);
  assert.equal((await handler(null, "missing")).ok, false);
  assert.equal(pushes, 2);
});

test("dashboard changes preserve VS Code profile names and personal shared-state isolation", () => {
  const main = fs.readFileSync(
    path.join(__dirname, "../app/dist-electron/main.cjs"),
    "utf8",
  );
  const extract = (name, next) =>
    main.slice(
      main.indexOf("function " + name + "("),
      main.indexOf(next, main.indexOf("function " + name + "(")),
    );
  const name = vm.runInNewContext(
    "(" +
      extract("vsCodeProfileName", "function writeVSCodeProfileSettings(") +
      ")",
  );
  const links = [];
  const prepare = vm.runInNewContext(
    "(" + extract("prepareProfileState", "var wtPath") + ")",
    { linkSharedState: (dir) => links.push(dir) },
  );
  const migrated = migrateDashboardSelection({
    profiles: [
      profile("custom"),
      profile("personal", { dashboardRole: "personal" }),
      profile("legacy", { dashboardRole: "work" }),
    ],
  });
  const switched = selectDashboardProfile(migrated, "custom");
  assert.deepEqual(switched.profiles.map(name), [
    "Claude custom",
    "Claude Personal",
    "Claude Work",
  ]);
  assert.deepEqual(
    selectDashboardProfile(switched, "personal").profiles.map(name),
    switched.profiles.map(name),
  );
  prepare(switched.profiles[1]);
  assert.equal(links.length, 0);
  prepare(switched.profiles[0]);
  assert.deepEqual(links, ["C:/Synthetic/custom"]);
});
