const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

function argument(name, fallback) {
  const prefix = `--${name}=`;
  return (
    process.argv
      .find((value) => value.startsWith(prefix))
      ?.slice(prefix.length) ?? fallback
  );
}

app.setPath(
  "userData",
  path.join(app.getPath("temp"), `aam-visual-smoke-${process.pid}`),
);

async function run() {
  const width = Number(argument("width", "1120"));
  const height = Number(argument("height", "760"));
  const view = argument("view", "dashboard");
  const layout = argument("layout", "grid") === "wide" ? "wide" : "grid";
  let layoutStatsBefore = null;
  let layoutStatsAfter = null;
  const output = path.resolve(argument("output", "release/visual-smoke.png"));
  const win = new BrowserWindow({
    width,
    height,
    show: false,
    backgroundColor:
      process.env.SMOKE_THEME === "light" ? "#f9f9f7" : "#0d0d0d",
    webPreferences: {
      preload: path.join(__dirname, "visual-smoke-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.webContents.on("console-message", (_event, level, message) => {
    if (level >= 2) process.stderr.write(`renderer: ${message}\n`);
  });
  await win.loadFile(path.resolve(__dirname, "../app/dist/index.html"));
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  if (view === "settings") {
    await win.webContents.executeJavaScript(`
      [...document.querySelectorAll("button")]
        .find((button) => button.innerText.includes("Settings"))?.click()
    `);
    await new Promise((resolve) => setTimeout(resolve, 200));
  } else if (view === "accounts") {
    await win.webContents.executeJavaScript(`
      [...document.querySelectorAll("button")]
        .find((button) => button.innerText.trim().includes("Other Accounts"))?.click()
    `);
    await new Promise((resolve) => setTimeout(resolve, 250));
    layoutStatsBefore = await win.webContents.executeJavaScript(
      "window.cam.__visualSmoke.stats()",
    );
    await win.webContents.executeJavaScript(`
      (() => {
        const label = ${JSON.stringify(layout === "wide" ? "Full width" : "Cards")};
        const button = [...document.querySelectorAll(".layout-segment")]
          .find((candidate) => candidate.innerText.trim().includes(label));
        if (button?.getAttribute("aria-pressed") !== "true") button?.click();
      })()
    `);
    await new Promise((resolve) => setTimeout(resolve, 250));
    layoutStatsAfter = await win.webContents.executeJavaScript(
      "window.cam.__visualSmoke.stats()",
    );
  }
  const smoke = await win.webContents.executeJavaScript(`(() => {
    const rect = (element) => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return {
        left: value.left,
        top: value.top,
        right: value.right,
        bottom: value.bottom,
        width: value.width,
        height: value.height,
      };
    };
    const cards = [...document.querySelectorAll("article.card")];
    const workCard = cards.find((card) => card.dataset.profileId === "work-smoke");
    const personalCard = cards.find((card) => card.dataset.profileId === "personal-smoke");
    const gptCard = document.querySelector(".gpt-usage-card");
    const launchers = gptCard?.querySelector(".codex-launchers");
    const antigravity = document.querySelector(".antigravity-card");
    const dashboardGrid = document.querySelector(".claude-dashboard-grid");
    const otherGrid = document.querySelector(".other-accounts-grid");
    const otherCards = otherGrid ? [...otherGrid.querySelectorAll(":scope > .card")] : [];
    const pressedLayout = [...document.querySelectorAll(".layout-segment")]
      .find((button) => button.getAttribute("aria-pressed") === "true")
      ?.innerText.trim();
    return {
      title: document.title,
      theme: document.documentElement.dataset.theme,
      text: document.body.innerText,
      width: window.innerWidth,
      height: window.innerHeight,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      modalBackdrops: document.querySelectorAll(".modal-backdrop").length,
      buttons: [...document.querySelectorAll("button")].slice(0, 12).map((button) => ({
        text: button.innerText,
        disabled: button.disabled,
        background: getComputedStyle(button).backgroundColor,
        color: getComputedStyle(button).color,
      })),
      dashboard: {
        antigravity: rect(antigravity),
        work: rect(workCard),
        personal: rect(personalCard),
        grid: rect(dashboardGrid),
        gpt: rect(gptCard),
        launchers: rect(launchers),
        gptMeters: gptCard?.querySelectorAll('[role="progressbar"]').length ?? 0,
        ordered: Boolean(
          workCard &&
          personalCard &&
          gptCard &&
          workCard.compareDocumentPosition(personalCard) & Node.DOCUMENT_POSITION_FOLLOWING &&
          personalCard.compareDocumentPosition(gptCard) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
      },
      accounts: {
        grid: rect(otherGrid),
        cards: otherCards.map(rect),
        names: otherCards.map((card) => card.querySelector(".card-name")?.textContent ?? ""),
        pressedLayout,
        columns: new Set(otherCards.map((card) => Math.round(card.getBoundingClientRect().left))).size,
      },
    };
  })()`);

  const errors = [];
  smoke.layoutStatsBefore = layoutStatsBefore;
  smoke.layoutStatsAfter = layoutStatsAfter;
  if (smoke.overflow) errors.push("horizontal overflow detected");
  if (view === "settings") {
    for (const value of ["Profile visibility", "Visible in profile views"]) {
      if (!smoke.text.includes(value)) errors.push(`missing ${value}`);
    }
  } else if (view.startsWith("dashboard")) {
    for (const value of [
      "New Codex chat",
      "New VS Code Codex",
      "Open VS Code project…",
      "Codex",
    ]) {
      if (!smoke.text.includes(value)) errors.push(`missing ${value}`);
    }
    for (const removed of [
      "GPT / Codex usage",
      "signed-in ChatGPT account",
      "ChatGPT plan usage via the local Codex service",
      "VS Code extension 1.7.0",
      "Usage guide",
      "Select the Antigravity icon to start a chat",
      "Start something new",
      "Choose an account",
      "Lifetime tokens",
      "Peak day",
      "Current streak",
      "Usage resets",
    ]) {
      if (smoke.text.includes(removed))
        errors.push(`stale GPT statistic ${removed}`);
    }
    const dashboard = smoke.dashboard;
    if (
      !dashboard.antigravity ||
      dashboard.antigravity.top < dashboard.gpt.bottom
    )
      errors.push("Antigravity must appear below Codex");
    if (dashboard.gptMeters < 2) errors.push("GPT rolling meters are missing");
    if (
      !dashboard.launchers ||
      dashboard.launchers.top < dashboard.gpt.top ||
      dashboard.launchers.bottom > dashboard.gpt.bottom
    ) {
      errors.push("Codex launchers are not contained in the Codex card");
    }
    if (view === "dashboard") {
      for (const value of ["Claude", "Max 5x"]) {
        if (!smoke.text.includes(value)) errors.push(`missing ${value}`);
      }
      if (!dashboard.ordered)
        errors.push("dashboard sections are out of order");
      if (
        !dashboard.work ||
        !dashboard.personal ||
        !dashboard.grid ||
        Math.abs(dashboard.work.left - dashboard.grid.left) > 1 ||
        Math.abs(dashboard.personal.left - dashboard.grid.left) > 1 ||
        Math.abs(dashboard.work.width - dashboard.grid.width) > 1 ||
        Math.abs(dashboard.personal.width - dashboard.grid.width) > 1
      ) {
        errors.push("Work and Personal cards are not full width");
      }
      if (dashboard.personal?.top < dashboard.work?.bottom) {
        errors.push("Work and Personal cards are not stacked");
      }
    } else if (
      view === "dashboard-hidden" &&
      !smoke.text.includes("All profiles are hidden")
    ) {
      errors.push("hidden-profile dashboard state is missing");
    } else if (
      view === "dashboard-empty" &&
      !smoke.text.includes("No accounts yet")
    ) {
      errors.push("empty dashboard state is missing");
    }
  } else if (view === "accounts") {
    const otherCount = Math.max(
      0,
      Number(process.env.SMOKE_OTHER_COUNT ?? 5) || 0,
    );
    const hiddenCount = Math.max(
      0,
      Math.min(
        otherCount,
        Number(process.env.SMOKE_HIDDEN_OTHER_COUNT ?? 1) || 0,
      ),
    );
    const expectedVisible = otherCount - hiddenCount;
    if (
      smoke.layoutStatsBefore?.listStatesCalls !==
      smoke.layoutStatsAfter?.listStatesCalls
    ) {
      errors.push("switching layout refetched the account list");
    }
    if (smoke.accounts.cards.length !== expectedVisible) {
      errors.push(
        `expected ${expectedVisible} visible Other Accounts cards; found ${smoke.accounts.cards.length}`,
      );
    }
    if (
      layout === "wide" &&
      smoke.accounts.cards.length > 0 &&
      smoke.accounts.columns !== 1
    ) {
      errors.push("Full width layout rendered more than one column");
    }
    if (
      layout === "grid" &&
      width >= 1100 &&
      smoke.accounts.cards.length >= 2 &&
      smoke.accounts.columns < 2
    ) {
      errors.push(
        "Cards layout did not render a multi-column grid at wide width",
      );
    }
    const selectedLabel = layout === "wide" ? "Full width" : "Cards";
    if (!smoke.accounts.pressedLayout?.includes(selectedLabel)) {
      errors.push(
        `${selectedLabel} layout does not have visible selected state`,
      );
    }
  }
  // Exercise the rail and its persistence, then restore the requested state.
  const sidebarCheck = await win.webContents.executeJavaScript(`(async () => {
    const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const expandedWidth = document.querySelector(".sidebar").getBoundingClientRect().width;
    document.querySelector(".sidebar-toggle").click();
    await frame();
    const collapsedWidth = document.querySelector(".sidebar").getBoundingClientRect().width;
    const persisted = localStorage.getItem("aam-sidebar-collapsed") === "true";
    const labelled = [...document.querySelectorAll(".nav-item")].every(button => button.getAttribute("aria-label"));
    if (${JSON.stringify(argument("collapsed", "false"))} !== "true") {
      document.querySelector(".sidebar-toggle").click();
      await frame();
    }
    return { expandedWidth, collapsedWidth, persisted, labelled };
  })()`);
  smoke.sidebarCheck = sidebarCheck;
  if (
    sidebarCheck.collapsedWidth >= sidebarCheck.expandedWidth ||
    !sidebarCheck.persisted ||
    !sidebarCheck.labelled
  ) {
    errors.push("sidebar collapse or accessible navigation failed");
  }
  if (view === "dashboard") {
    const actions = await win.webContents.executeJavaScript(`(async () => {
      const tick = () => new Promise(resolve => setTimeout(resolve, 50));
      const click = (scope, label) => [...document.querySelectorAll(scope + " button")].find(button => button.textContent === label)?.click();
      click(".claude-account-card", "Open in VS Code"); await tick();
      click(".claude-account-card", "Open VS Code project…"); await tick();
      click(".gpt-usage-card", "New Codex chat"); await tick();
      click(".gpt-usage-card", "New VS Code Codex"); await tick();
      click(".gpt-usage-card", "Open VS Code project…"); await tick();
      click(".antigravity-card", "Open Antigravity"); await tick();
      click(".antigravity-card", "Open in VS Code"); await tick();
      click(".antigravity-card", "Open VS Code project…"); await tick();
      if (${JSON.stringify(process.env.SMOKE_ANTIGRAVITY_SIGNED_OUT === "1")}) { click(".antigravity-card", "Sign in"); await tick(); }
      const images = [...document.querySelectorAll(".provider-brand img")];
      const logosLoaded = images.length >= 4 && images.every(img => img.complete && img.naturalWidth > 0);
      const cleanClaudeHeaders = [...document.querySelectorAll(".claude-account-card")].every(card =>
        card.querySelector(".card-name").textContent === "Claude" && !card.querySelector(".visibility-button, .status-label, .badge, .dot"));
      const beforeClaude = document.querySelector(".claude-account-card .account-plan-badge").textContent;
      await window.cam.__visualSmoke.changePlans(); window.dispatchEvent(new Event("focus")); await tick();
      const updated = document.querySelector(".gpt-usage-card .account-plan-badge").textContent === "Pro 200" &&
        document.querySelector(".claude-account-card .account-plan-badge").textContent === "Max 20x";
      const antigravityUpdated = ${JSON.stringify(process.env.SMOKE_ANTIGRAVITY_SIGNED_OUT === "1")} || document.querySelector(".antigravity-card .account-plan-badge").textContent === "Google AI Ultra";
      return { ...(await window.cam.__visualSmoke.stats()), updated, antigravityUpdated, logosLoaded, cleanClaudeHeaders, beforeClaude,
        noSelectors: document.querySelectorAll(".account-plan-badge select, select.account-plan-badge").length === 0 };
    })()`);
    smoke.actions = actions;
    const expected = [
      ["claude-window", "work-smoke"],
      ["claude-project", "work-smoke"],
      ["codex-chat"],
      ["codex-window"],
      ["codex-project"],
      ["antigravity", "app"],
      ["antigravity", "vscode"],
      ["antigravity", "project"],
    ];
    if (process.env.SMOKE_ANTIGRAVITY_SIGNED_OUT === "1")
      expected.push(["antigravity", "signin"]);
    if (JSON.stringify(actions.launchCalls) !== JSON.stringify(expected))
      errors.push("card actions called the wrong launcher or Claude profile");
    if (
      !actions.updated ||
      !actions.antigravityUpdated ||
      !actions.logosLoaded ||
      !actions.cleanClaudeHeaders ||
      !actions.noSelectors ||
      !actions.beforeClaude.includes("Max 5x")
    )
      errors.push("automatic plan updates failed");
  }
  if (argument("scroll", "top") === "bottom") {
    await win.webContents.executeJavaScript(
      "document.querySelector('.main-scroll').scrollTop = document.querySelector('.main-scroll').scrollHeight",
    );
  }
  if (errors.length) {
    throw new Error(`Visual smoke failed: ${errors.join("; ")}`);
  }
  await win.webContents.executeJavaScript(
    "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
  );
  win.webContents.invalidate();
  await new Promise((resolve) => setTimeout(resolve, 200));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const image = await win.webContents.capturePage();
  fs.writeFileSync(output, image.toPNG());
  fs.writeFileSync(`${output}.json`, `${JSON.stringify(smoke, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({ ...smoke, text: undefined, output })}\n`,
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
