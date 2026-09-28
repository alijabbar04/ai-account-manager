// End-to-end smoke of the phone companion UI against the real sync server.
//
//   npx electron tests/phone-ui-smoke.cjs --output=release/phone-smoke
//
// Loads mobile/android/assets in a 390x844 window (the Android WebView's
// bundled page, using its fetch fallback instead of the Java bridge), pairs it
// with a PhoneSyncServer on 127.0.0.1, and screenshots the dashboard in both
// themes, the PC-offline state and the unpaired state.
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { PhoneSyncServer } = require("../app/dist-electron/phone-server.cjs");
const { buildPhoneSnapshot } = require("../app/dist-electron/phone-domain.cjs");

app.setPath(
  "userData",
  path.join(app.getPath("temp"), `aam-phone-smoke-${process.pid}`),
);

const outputArg = process.argv.find((value) => value.startsWith("--output="));
const outputDir = path.resolve(
  outputArg ? outputArg.slice("--output=".length) : "release/phone-smoke",
);

const now = Date.now();
const hours = (value) => now + value * 3600e3;
const states = [
  {
    profile: { id: "work", name: "Work Example" },
    identity: {
      loggedIn: true,
      email: "work@example.test",
      planLabel: "Team Premium",
    },
    usage: {
      ok: true,
      fetchedAt: now,
      limits: [
        { kind: "session", percent: 4, resetsAt: hours(3.77) },
        { kind: "weekly_all", percent: 7, resetsAt: hours(145) },
        {
          kind: "weekly_scoped",
          modelName: "Fable",
          percent: 0,
          resetsAt: hours(145),
        },
      ],
      extra: {
        enabled: true,
        usedCredits: 729,
        currency: "GBP",
        decimalPlaces: 2,
      },
    },
    dashboardRole: "work",
    isDefault: true,
  },
  {
    profile: { id: "personal", name: "Personal Example" },
    identity: {
      loggedIn: true,
      email: "personal@example.test",
      planLabel: "Max 20x",
    },
    usage: {
      ok: true,
      fetchedAt: now,
      limits: [
        { kind: "session", percent: 9, resetsAt: hours(0.6) },
        { kind: "weekly_all", percent: 82, resetsAt: hours(19.7) },
        {
          kind: "weekly_scoped",
          modelName: "Fable",
          percent: 52,
          resetsAt: hours(19.7),
        },
      ],
    },
    dashboardRole: "personal",
  },
];
const gptUsage = {
  ok: true,
  fetchedAt: now,
  account: { email: "codex@example.test", planType: "pro" },
  rateLimits: {
    rateLimits: {
      limitId: "codex",
      primary: {
        usedPercent: 30,
        windowDurationMins: 10080,
        resetsAt: Math.floor(hours(127) / 1000),
      },
    },
  },
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function until(win, expression, label, timeoutMs = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await win.webContents.executeJavaScript(expression)) return;
    await wait(100);
  }
  throw new Error(`timed out waiting for ${label}`);
}

async function shot(win, name) {
  await wait(250);
  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, `${name}.png`), image.toPNG());
}

async function run() {
  fs.mkdirSync(outputDir, { recursive: true });
  let deviceToken = null;
  const server = new PhoneSyncServer({
    getSnapshot: async () =>
      buildPhoneSnapshot({ states, gptUsage, hostName: "DESKTOP-EXAMPLE" }),
    requestRefresh: async () => {},
    getDeviceToken: () => deviceToken,
    onPaired: async ({ token }) => {
      deviceToken = token;
    },
    allowPeer: () => true,
  });
  const { port } = await server.listen("127.0.0.1", 0);
  server.startPairing("K7QXM2PA", 60_000);

  const win = new BrowserWindow({
    width: 390,
    height: 844,
    useContentSize: true,
    show: false,
    backgroundColor: "#0d0d0d",
    webPreferences: { sandbox: true, contextIsolation: true },
  });
  const errors = [];
  win.webContents.on("console-message", (_event, level, message) => {
    if (level >= 2) errors.push(message);
  });
  await win.loadFile(
    path.resolve(__dirname, "../mobile/android/assets/index.html"),
    { query: { theme: "dark" } },
  );
  await until(
    win,
    `Boolean(document.querySelector("form.form"))`,
    "pair screen",
  );
  await shot(win, "1-pair-dark");

  // A wrong code is refused with the server's message.
  await win.webContents.executeJavaScript(`(() => {
    const set = (index, value) => {
      const input = document.querySelectorAll("form.form input")[index];
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set(0, "127.0.0.1"); set(1, "AAAA-AAAA"); set(2, ${JSON.stringify(String(port))});
    document.querySelector("form.form").requestSubmit();
  })()`);
  await until(
    win,
    `Boolean(document.querySelector(".error"))`,
    "wrong-code error",
  );
  const wrong = await win.webContents.executeJavaScript(
    `document.querySelector(".error").textContent`,
  );
  if (!/doesn't match/.test(wrong)) throw new Error(`unexpected: ${wrong}`);

  await win.webContents.executeJavaScript(`(() => {
    const input = document.querySelectorAll("form.form input")[1];
    input.value = "k7qx-m2pa";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector("form.form").requestSubmit();
  })()`);
  await until(
    win,
    `document.querySelectorAll("article.card").length === 3`,
    "dashboard cards",
  );
  const dashboard = await win.webContents.executeJavaScript(`({
    names: [...document.querySelectorAll(".card h2")].map((n) => n.textContent),
    plans: [...document.querySelectorAll(".card .plan")].map((n) => n.textContent),
    pill: document.querySelector(".sync-pill").textContent,
    extra: document.querySelector(".card-note")?.textContent,
    fills: [...document.querySelectorAll(".fill")].map((n) => n.style.width),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  })`);
  const expectPlans = "Team Premium|Max 20x|Pro";
  if (dashboard.plans.join("|") !== expectPlans) {
    throw new Error(`plans: ${dashboard.plans.join("|")}`);
  }
  if (!dashboard.pill.startsWith("Synced from DESKTOP-EXAMPLE")) {
    throw new Error(`pill: ${dashboard.pill}`);
  }
  if (!/£7\.29/.test(dashboard.extra ?? "")) {
    throw new Error(`extra usage: ${dashboard.extra}`);
  }
  if (dashboard.fills[1] !== "7%" || dashboard.fills[2] !== "0%") {
    throw new Error(`meter widths: ${dashboard.fills.join(",")}`);
  }
  if (dashboard.overflow) throw new Error("horizontal overflow at 390px");
  await shot(win, "2-dashboard-dark");

  await win.webContents.executeJavaScript(`window.aamTheme("light")`);
  win.setBackgroundColor("#f9f9f7");
  await shot(win, "3-dashboard-light");
  await win.webContents.executeJavaScript(`window.aamTheme("dark")`);

  // PC goes away: cached numbers stay, marked as last known.
  await server.close();
  await win.webContents.executeJavaScript(`window.aamResume()`);
  await until(
    win,
    `document.querySelector(".sync-pill")?.dataset.kind === "offline"`,
    "offline pill",
    15000,
  );
  const offline = await win.webContents.executeJavaScript(`({
    cards: document.querySelectorAll("article.card").length,
    status: document.querySelector(".status").textContent,
  })`);
  if (offline.cards !== 3 || offline.status !== "Last known") {
    throw new Error(`offline: ${JSON.stringify(offline)}`);
  }
  await shot(win, "4-offline-dark");

  // Unpaired on the PC: the next sync returns 401 and the phone asks to pair.
  deviceToken = "revoked-token-value-000000";
  await server.listen("127.0.0.1", port);
  await win.webContents.executeJavaScript(`window.aamResume()`);
  await until(win, `Boolean(document.querySelector("form.form"))`, "unpaired");
  const unpaired = await win.webContents.executeJavaScript(
    `document.querySelector(".error")?.textContent ?? ""`,
  );
  if (!/no longer paired/.test(unpaired)) {
    throw new Error(`unpaired message: ${unpaired}`);
  }
  await shot(win, "5-unpaired-dark");
  await server.close();

  if (errors.length) throw new Error(`console errors: ${errors.join(" | ")}`);
  process.stdout.write(
    `${JSON.stringify({ ok: true, outputDir, dashboard, offline })}\n`,
  );
  win.destroy();
}

app
  .whenReady()
  .then(run)
  .then(() => app.exit(0))
  .catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    app.exit(1);
  });
