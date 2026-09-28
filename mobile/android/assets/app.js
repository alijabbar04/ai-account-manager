"use strict";

// AI Account Usage: the phone companion's whole UI.
//
// It only ever shows what the paired PC sends from GET /v1/usage. The last
// snapshot is kept on the phone so the numbers stay readable while the PC is
// off, and reset times are absolute, so countdowns stay correct offline.
(function () {
  const STORE_KEY = "aam.phone.v1";
  const DEFAULT_PORT = 47821;
  const POLL_MS = 60 * 1000;
  const TICK_MS = 30 * 1000;
  const native = window.AamNative || null;

  // --- Persistence --------------------------------------------------------
  // The pairing and the last snapshot are saved after every change and read
  // back on launch, so the last known figures show even when the app is
  // reopened while the PC is off. On Android they live in the app's private
  // preferences (native.saveState); WebView storage is a secondary copy.
  function parseState(text) {
    try {
      const value = JSON.parse(text || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (err) {
      return {};
    }
  }
  function load() {
    let value = {};
    if (native && native.loadState) value = parseState(native.loadState());
    if (!value.token) {
      // 1.0.0 kept its state only in WebView storage; carry it over once.
      let legacy = {};
      try {
        legacy = parseState(window.localStorage.getItem(STORE_KEY));
      } catch (err) {}
      if (legacy.token) value = legacy;
    }
    return value;
  }
  const store = load();
  function save() {
    const text = JSON.stringify(store);
    if (native && native.saveState) native.saveState(text);
    try {
      window.localStorage.setItem(STORE_KEY, text);
    } catch (err) {}
  }
  if (native && native.saveState && store.token) save();

  const ui = {
    screen: store.token ? "dashboard" : "pair",
    online: null,
    syncing: false,
    sheet: false,
    pairing: false,
    pairError: null,
    form: {
      host: store.host || "",
      port: String(store.port || DEFAULT_PORT),
      code: "",
    },
  };

  // --- Transport ----------------------------------------------------------
  const pending = new Map();
  let nextRequestId = 1;
  window.aamBridgeResult = function (id, status, text) {
    const resolve = pending.get(id);
    if (!resolve) return;
    pending.delete(id);
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (err) {
      body = { error: text };
    }
    resolve({ status: status, body: body });
  };

  function request(target, method, path, options) {
    const opts = options || {};
    const url = "http://" + target.host + ":" + target.port + path;
    const body = opts.body ? JSON.stringify(opts.body) : "";
    if (native) {
      return new Promise(function (resolve) {
        const id = String(nextRequestId++);
        pending.set(id, resolve);
        native.request(id, method, url, opts.token || "", body);
      });
    }
    const headers = {};
    if (opts.token) headers.Authorization = "Bearer " + opts.token;
    if (body) headers["Content-Type"] = "application/json";
    return fetch(url, {
      method: method,
      headers: headers,
      body: body || undefined,
      signal: AbortSignal.timeout(12000),
    })
      .then(function (response) {
        return response.text().then(function (text) {
          let parsed = null;
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch (err) {
            parsed = { error: text };
          }
          return { status: response.status, body: parsed };
        });
      })
      .catch(function (err) {
        return { status: 0, body: { error: String(err && err.message) } };
      });
  }

  function paired() {
    return { host: store.host, port: store.port };
  }

  // --- Actions ------------------------------------------------------------
  async function sync() {
    if (!store.token || ui.syncing) return;
    ui.syncing = true;
    render();
    const result = await request(paired(), "GET", "/v1/usage", {
      token: store.token,
    });
    ui.syncing = false;
    if (result.status === 200 && result.body && result.body.v === 1) {
      store.snapshot = result.body;
      store.lastOkAt = Date.now();
      ui.online = true;
    } else if (result.status === 401) {
      forget(
        (result.body && result.body.error) ||
          "This phone is no longer paired with your PC.",
      );
      return;
    } else {
      ui.online = false;
    }
    save();
    render();
  }

  async function refreshNow() {
    if (!store.token || ui.syncing) return;
    const result = await request(paired(), "POST", "/v1/refresh", {
      token: store.token,
    });
    await sync();
    // The PC polls Claude and Codex in the background; collect the result.
    if (result.status === 202 && result.body && result.body.accepted) {
      window.setTimeout(sync, 6000);
      window.setTimeout(sync, 15000);
    }
  }

  function forget(message) {
    delete store.token;
    delete store.snapshot;
    delete store.lastOkAt;
    save();
    ui.screen = "pair";
    ui.online = null;
    ui.sheet = false;
    ui.pairError = message || null;
    render();
  }

  function normalizeCode(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/[\s-]/g, "");
  }

  async function pair(host, port, code) {
    const target = { host: String(host || "").trim(), port: Number(port) };
    const cleanCode = normalizeCode(code);
    if (!target.host)
      return showPairError("Enter your PC's Tailscale address.");
    if (
      !Number.isInteger(target.port) ||
      target.port < 1 ||
      target.port > 65535
    ) {
      return showPairError("Enter the port shown on your PC.");
    }
    if (cleanCode.length !== 8) {
      return showPairError("Enter the 8-character code shown on your PC.");
    }
    ui.pairing = true;
    ui.pairError = null;
    render();
    const result = await request(target, "POST", "/v1/pair", {
      body: {
        code: cleanCode,
        device: native && native.deviceName ? native.deviceName() : "Phone",
      },
    });
    ui.pairing = false;
    if (result.status === 200 && result.body && result.body.token) {
      store.host = target.host;
      store.port = target.port;
      store.token = result.body.token;
      save();
      ui.screen = "dashboard";
      ui.form.code = "";
      render();
      sync();
      return;
    }
    showPairError(
      result.status === 0
        ? "Can't reach " +
            target.host +
            ":" +
            target.port +
            ". Check that Tailscale is connected on this phone and on the PC, and that phone sharing is on in AI Account Manager › Settings."
        : (result.body && result.body.error) || "Pairing failed.",
    );
  }

  function showPairError(message) {
    ui.pairing = false;
    ui.pairError = message;
    render();
  }

  // --- Native hooks ---------------------------------------------------------
  window.aamPair = function (link) {
    let url;
    try {
      url = new URL(link);
    } catch (err) {
      return;
    }
    const host = url.searchParams.get("host") || "";
    const port = url.searchParams.get("port") || String(DEFAULT_PORT);
    const code = url.searchParams.get("code") || "";
    ui.form = { host: host, port: port, code: code };
    ui.screen = "pair";
    ui.sheet = false;
    if (host && code) pair(host, port, code);
    else render();
  };
  window.aamTheme = function (name) {
    if (name === "dark" || name === "light") {
      document.documentElement.dataset.theme = name;
    }
  };
  let pollTimer = null;
  window.aamResume = function () {
    window.clearInterval(pollTimer);
    pollTimer = window.setInterval(sync, POLL_MS);
    sync();
  };
  window.aamPause = function () {
    window.clearInterval(pollTimer);
    pollTimer = null;
  };
  window.aamBack = function () {
    if (ui.sheet) {
      ui.sheet = false;
      render();
      return true;
    }
    return false;
  };

  // --- Formatting ---------------------------------------------------------
  function duration(ms) {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (days > 0) return days + "d " + hours + "h";
    if (hours > 0) return hours + "h " + minutes + "m";
    if (minutes > 0) return minutes + "m";
    return "under a minute";
  }
  function ago(at) {
    const ms = Date.now() - at;
    if (ms < 60000) return "just now";
    if (ms < 3600000) return Math.floor(ms / 60000) + " min ago";
    return duration(ms) + " ago";
  }
  function money(extra) {
    const value = extra.usedCredits / Math.pow(10, extra.decimalPlaces || 0);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: extra.currency,
      }).format(value);
    } catch (err) {
      return value.toFixed(extra.decimalPlaces || 0) + " " + extra.currency;
    }
  }

  // --- Rendering ------------------------------------------------------------
  const SVG_NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    const node = document.createElement(tag);
    for (const key of Object.keys(attrs || {})) {
      const value = attrs[key];
      if (value === null || value === undefined || value === false) continue;
      if (key === "text") node.textContent = value;
      // CSSOM, not a style attribute: the page's CSP forbids inline styles.
      else if (key === "width") node.style.width = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    }
    for (let i = 2; i < arguments.length; i++) {
      const child = arguments[i];
      if (child === null || child === undefined || child === false) continue;
      node.append(child);
    }
    return node;
  }
  function svg(viewBox, size, paths, attrs) {
    const node = document.createElementNS(SVG_NS, "svg");
    node.setAttribute("viewBox", viewBox);
    node.setAttribute("width", size);
    node.setAttribute("height", size);
    node.setAttribute("aria-hidden", "true");
    for (const key of Object.keys(attrs || {}))
      node.setAttribute(key, attrs[key]);
    for (const spec of paths) {
      const child = document.createElementNS(SVG_NS, spec.tag || "path");
      for (const key of Object.keys(spec)) {
        if (key !== "tag") child.setAttribute(key, spec[key]);
      }
      node.append(child);
    }
    return node;
  }
  const STROKE = {
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };
  function brandMark() {
    const mark = svg("0 0 24 24", 28, [
      {
        d: "M12 2l2.1 6.3L20 6l-3.9 5 5.9 1-5.9 1L20 18l-5.9-2.3L12 22l-2.1-6.3L4 18l3.9-5L2 12l5.9-1L4 6l5.9 2.3z",
        fill: "#d97757",
      },
    ]);
    mark.setAttribute("class", "brand");
    return mark;
  }

  function header(withActions) {
    return el(
      "header",
      { class: "top" },
      brandMark(),
      el(
        "div",
        { class: "top-titles" },
        el("span", { class: "top-kicker", text: "AI Account Manager" }),
        el("h1", { text: withActions ? "Usage" : "Phone companion" }),
      ),
      withActions &&
        el(
          "button",
          {
            class: "icon-btn",
            type: "button",
            "aria-label": "Refresh usage",
            "data-busy": ui.syncing,
            disabled: ui.syncing,
            onclick: refreshNow,
          },
          svg(
            "0 0 24 24",
            19,
            [{ d: "M20 12a8 8 0 1 1-2.34-5.66" }, { d: "M20 4v5h-5" }],
            STROKE,
          ),
        ),
      withActions &&
        el(
          "button",
          {
            class: "icon-btn",
            type: "button",
            "aria-label": "Connection details",
            onclick: function () {
              ui.sheet = true;
              render();
            },
          },
          svg(
            "0 0 24 24",
            19,
            [
              { tag: "circle", cx: "5", cy: "12", r: "1.6" },
              { tag: "circle", cx: "12", cy: "12", r: "1.6" },
              { tag: "circle", cx: "19", cy: "12", r: "1.6" },
            ],
            { fill: "currentColor" },
          ),
        ),
    );
  }

  function meter(limit, offline) {
    const now = Date.now();
    const passed = Boolean(limit.resetsAt && limit.resetsAt <= now);
    const percent = Math.round(limit.percent);
    const width =
      passed || percent <= 0 ? 0 : Math.max(2, Math.min(100, percent));
    const reset = !limit.resetsAt
      ? ""
      : passed
        ? "reset since last update"
        : "resets in " + duration(limit.resetsAt - now);
    return el(
      "div",
      { class: "meter" },
      el(
        "div",
        { class: "meter-top" },
        el("span", { class: "meter-label", text: limit.label }),
        el("span", {
          class: "meter-reset",
          "data-passed": passed,
          text: reset,
        }),
        el("span", { class: "meter-pct", text: passed ? "—" : percent + "%" }),
      ),
      el(
        "div",
        {
          class: "track",
          role: "progressbar",
          "aria-label": limit.label,
          "aria-valuemin": "0",
          "aria-valuemax": "100",
          "aria-valuenow": String(passed ? 0 : percent),
        },
        el("div", {
          class: "fill",
          "data-kind": offline ? "stale" : limit.severity,
          width: width + "%",
        }),
      ),
    );
  }

  // view.stale: not yet confirmed by the PC this session (label as last known).
  // view.offline: the PC was tried and is unreachable (grey the bars too).
  function card(account, view) {
    const gpt = account.provider === "gpt";
    const roleLabel =
      account.role === "work"
        ? "Work"
        : account.role === "personal"
          ? "Personal"
          : "Claude";
    const sub = gpt
      ? account.email
        ? account.email + " · ChatGPT"
        : "ChatGPT"
      : account.email
        ? roleLabel + " · " + account.email
        : roleLabel;
    const kind = view.stale ? "stale" : account.status.kind;
    return el(
      "article",
      { class: "card", "data-provider": account.provider },
      el(
        "div",
        { class: "card-head" },
        gpt &&
          el("div", { class: "gpt-mark", "aria-hidden": "true", text: "GPT" }),
        el(
          "div",
          { class: "card-titles" },
          el(
            "div",
            { class: "name-row" },
            !gpt &&
              el("span", {
                class: "status-dot",
                "data-kind": kind,
                "aria-hidden": "true",
              }),
            el("h2", { text: account.name }),
            account.plan && el("span", { class: "plan", text: account.plan }),
          ),
          el("span", { class: "sub", text: sub }),
        ),
        el("span", {
          class: "status",
          "data-kind": kind,
          text: view.stale ? "Last known" : account.status.label,
        }),
      ),
      account.limits.length > 0 &&
        el.apply(
          null,
          ["div", { class: "meters" }].concat(
            account.limits.map(function (limit) {
              return meter(limit, view.offline);
            }),
          ),
        ),
      account.extra &&
        el("div", {
          class: "card-note",
          text: "Extra usage: " + money(account.extra) + " used",
        }),
      account.error &&
        el("div", {
          class: "card-note",
          "data-kind": "crit",
          text:
            account.error +
            (account.limits.length ? " — showing last known values" : ""),
        }),
      !account.error &&
        account.limits.length === 0 &&
        el("div", {
          class: "empty-limits",
          text: "No usage windows reported yet.",
        }),
    );
  }

  function dashboard() {
    const snapshot = store.snapshot;
    const confirmed = ui.online === true;
    const offline = ui.online === false;
    const view = { stale: !confirmed, offline: offline };
    const pill =
      confirmed && store.lastOkAt
        ? {
            kind: "online",
            text:
              "Synced from " +
              (snapshot.host || "your PC") +
              " · " +
              ago(store.lastOkAt),
          }
        : offline
          ? {
              kind: "offline",
              text: store.lastOkAt
                ? "PC offline · last synced " + ago(store.lastOkAt)
                : "Can't reach your PC",
            }
          : {
              // Reopened with saved figures: they are last known until the PC
              // answers, which takes a few seconds to fail when it is off.
              kind: "checking",
              text: store.lastOkAt
                ? "Last synced " + ago(store.lastOkAt) + " · connecting…"
                : "Connecting to your PC…",
            };
    const nodes = [
      header(true),
      el(
        "div",
        { class: "sync-row" },
        el(
          "div",
          { class: "sync-pill", "data-kind": pill.kind, role: "status" },
          el("span", { class: "sync-dot", "aria-hidden": "true" }),
          el("span", { text: pill.text }),
        ),
      ),
    ];
    if (offline) {
      nodes.push(
        el("p", {
          class: "notice",
          text: snapshot
            ? "Your PC isn't reachable right now, so these are the last numbers it sent. Reset times keep counting down on your phone; usage since then is unknown."
            : "Your PC isn't reachable. Check that Tailscale is connected on this phone and on the PC, and that AI Account Manager is running.",
        }),
      );
    }
    const cards = el("main", { class: "cards" });
    for (const account of (snapshot && snapshot.accounts) || []) {
      cards.append(card(account, view));
    }
    nodes.push(cards);
    nodes.push(
      el("footer", {
        class: "foot",
        text: !confirmed
          ? "Numbers update as soon as your PC is back online"
          : "Your PC sends fresh numbers every 10 minutes · ↻ asks for them now",
      }),
    );
    if (ui.sheet) nodes.push(sheet());
    return nodes;
  }

  function sheet() {
    const close = function () {
      ui.sheet = false;
      render();
    };
    const snapshot = store.snapshot;
    return el(
      "div",
      {
        class: "scrim",
        onclick: function (event) {
          if (event.target === event.currentTarget) close();
        },
      },
      el(
        "section",
        {
          class: "sheet",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Connection",
        },
        el("h2", { text: "Connection" }),
        el(
          "dl",
          null,
          el("dt", { text: "PC" }),
          el("dd", { text: (snapshot && snapshot.host) || "Not synced yet" }),
          el("dt", { text: "Address" }),
          el("dd", { text: store.host + ":" + store.port }),
          el("dt", { text: "Last synced" }),
          el("dd", {
            text: store.lastOkAt
              ? new Date(store.lastOkAt).toLocaleString()
              : "Never",
          }),
        ),
        el("button", {
          class: "secondary",
          type: "button",
          text: "Close",
          onclick: close,
        }),
        el("button", {
          class: "secondary danger",
          type: "button",
          text: "Unpair this phone",
          onclick: function () {
            if (
              window.confirm(
                "Unpair this phone? To pair again, choose Pair a phone in AI Account Manager › Settings on your PC.",
              )
            ) {
              forget(null);
            }
          },
        }),
      ),
    );
  }

  function field(label, key, attrs) {
    const input = el(
      "input",
      Object.assign(
        {
          value: ui.form[key],
          autocomplete: "off",
          autocapitalize: "none",
          spellcheck: "false",
          oninput: function (event) {
            ui.form[key] = event.target.value;
          },
        },
        attrs,
      ),
    );
    input.value = ui.form[key];
    return el("label", { class: "field" }, el("span", { text: label }), input);
  }

  function pairScreen() {
    const form = el(
      "form",
      {
        class: "form",
        novalidate: true,
        onsubmit: function (event) {
          event.preventDefault();
          pair(ui.form.host, ui.form.port, ui.form.code);
        },
      },
      field("PC address", "host", {
        inputmode: "url",
        placeholder: "100.x.x.x",
      }),
      el(
        "div",
        { class: "field-row" },
        field("Code", "code", {
          class: "code-input",
          autocapitalize: "characters",
          placeholder: "XXXX-XXXX",
          maxlength: "9",
        }),
        field("Port", "port", {
          inputmode: "numeric",
          placeholder: String(DEFAULT_PORT),
        }),
      ),
      ui.pairError &&
        el("p", { class: "error", role: "alert", text: ui.pairError }),
      el("button", {
        class: "primary",
        type: "submit",
        disabled: ui.pairing,
        text: ui.pairing ? "Pairing…" : "Pair",
      }),
    );
    const step = function (number, text) {
      return el(
        "li",
        null,
        el("span", { class: "step-num", text: String(number) }),
        el("span", { text: text }),
      );
    };
    return [
      header(false),
      el(
        "section",
        { class: "pair" },
        el("h1", { text: "Pair with your PC" }),
        el("p", {
          text: "On your PC, open AI Account Manager › Settings, turn on Share usage with my phone, and choose Pair a phone.",
        }),
        el(
          "ol",
          { class: "steps" },
          step(
            1,
            "Scan the QR code with your camera app — it opens this app and pairs it",
          ),
          step(2, "Or type the PC address, code and port below"),
          step(3, "Your three accounts appear here and stay up to date"),
        ),
        form,
        el(
          "div",
          { class: "privacy" },
          svg(
            "0 0 24 24",
            18,
            [
              {
                tag: "rect",
                x: "4",
                y: "11",
                width: "16",
                height: "10",
                rx: "2",
              },
              { d: "M8 11V7a4 4 0 0 1 8 0v4" },
            ],
            STROKE,
          ),
          el("span", {
            text: "Your phone only receives usage numbers, plan names and account emails — never tokens or passwords — and only over your Tailscale network.",
          }),
        ),
      ),
    ];
  }

  const root = document.getElementById("app");
  function render() {
    const nodes = ui.screen === "pair" ? pairScreen() : dashboard();
    root.replaceChildren.apply(root, nodes.filter(Boolean));
  }

  // --- Start --------------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  window.aamTheme(params.get("theme"));
  window.setInterval(function () {
    if (ui.screen === "dashboard" && !ui.sheet) render();
  }, TICK_MS);
  if (!native) {
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") window.aamResume();
      else window.aamPause();
    });
  }
  render();
  const link = params.get("pair");
  if (link) window.aamPair(link);
  else window.aamResume();
})();
