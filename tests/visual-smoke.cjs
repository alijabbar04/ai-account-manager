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
    const workCard = cards.find((card) => card.innerText.includes("Work Example"));
    const personalCard = cards.find((card) => card.innerText.includes("Personal Example"));
    const gptCard = document.querySelector(".gpt-usage-card");
    const launchers = document.querySelector(".global-launchers");
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
          launchers &&
          workCard.compareDocumentPosition(personalCard) & Node.DOCUMENT_POSITION_FOLLOWING &&
          personalCard.compareDocumentPosition(gptCard) & Node.DOCUMENT_POSITION_FOLLOWING &&
          gptCard.compareDocumentPosition(launchers) & Node.DOCUMENT_POSITION_FOLLOWING
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
    for (const value of ["New Claude Cowork", "GPT / Codex usage"]) {
      if (!smoke.text.includes(value)) errors.push(`missing ${value}`);
    }
    for (const removed of [
      "Lifetime tokens",
      "Peak day",
      "Current streak",
      "Usage resets",
    ]) {
      if (smoke.text.includes(removed))
        errors.push(`stale GPT statistic ${removed}`);
    }
    const dashboard = smoke.dashboard;
    if (dashboard.gptMeters < 2) errors.push("GPT rolling meters are missing");
    if (dashboard.launchers?.top < dashboard.gpt?.bottom) {
      errors.push("global launchers do not follow GPT usage");
    }
    if (view === "dashboard") {
      for (const value of ["Work Example", "Personal Example"]) {
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
