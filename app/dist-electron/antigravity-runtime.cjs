const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const https = require("node:https");
const childProcess = require("node:child_process");

const SERVICE = "/exa.language_server_pb.LanguageServerService/";

// Antigravity 2.x and its VS Code extension share the Gemini data directory but
// can have different in-memory authentication. Prefer the native app's server.
const PROCESS_QUERY = `
$servers = @(Get-CimInstance Win32_Process -Filter "Name = 'language_server.exe' or Name = 'language_server_windows_x64.exe' or Name = 'agy.exe'" -ErrorAction SilentlyContinue)
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue)
@($servers | ForEach-Object {
  $server = $_
  [pscustomobject]@{
    name = $server.Name
    commandLine = $server.CommandLine
    executablePath = $server.ExecutablePath
    ports = @($listeners | Where-Object { $_.OwningProcess -eq $server.ProcessId } | Select-Object -ExpandProperty LocalPort -Unique)
  }
}) | ConvertTo-Json -Depth 4 -Compress
`;

const INSTALL_QUERY = `
$roots = @('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall', 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall', 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall')
@($roots | ForEach-Object { Get-ItemProperty (Join-Path $_ '*') -ErrorAction SilentlyContinue } | Where-Object { $_.DisplayName -match '^Antigravity(?:\\s|$)' } | Select-Object InstallLocation,DisplayIcon) | ConvertTo-Json -Compress
`;

function stringValue(value, maxLength = 160) {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim()
        .slice(0, maxLength)
    : "";
}

function detectedPlan(userStatus, loadResponse, planInfo) {
  const paidTier = loadResponse?.paidTier;
  const activeTier = userStatus?.userTier ?? loadResponse?.currentTier;
  // Use only the active/paid tier; allowedTiers lists available upgrades.
  function tierIdLabel(raw) {
    const id = stringValue(raw);
    if (/ultra/i.test(id)) return "Google AI Ultra";
    if (/(?:^|[-_])pro(?:$|[-_])/i.test(id)) return "Google AI Pro";
    if (/(?:^|[-_])plus(?:$|[-_])/i.test(id)) return "Google AI Plus";
    if (/(?:^|[-_])free(?:$|[-_])/i.test(id)) return "Free";
    return null;
  }
  const paidLabel = stringValue(paidTier?.name) || tierIdLabel(paidTier?.id);
  if (paidLabel) return paidLabel;
  const googleOneLabel = tierIdLabel(
    loadResponse?.g1Tier || userStatus?.g1Tier,
  );
  if (googleOneLabel) return googleOneLabel;
  const activeLabel =
    stringValue(activeTier?.name) || tierIdLabel(activeTier?.id);
  if (activeLabel) return activeLabel;
  return stringValue(planInfo?.planName) || null;
}

function epochSeconds(value) {
  if (typeof value === "string") {
    const millis = Date.parse(value);
    return Number.isFinite(millis) ? Math.floor(millis / 1000) : null;
  }
  const seconds = Number(value?.seconds);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function quotaLimits(response) {
  const rows = [];
  function add(bucket, groupName) {
    if (bucket.disabled) return;
    const raw =
      bucket.remainingFraction ??
      (bucket.remaining?.case === "remainingFraction"
        ? bucket.remaining.value
        : undefined);
    if (typeof raw !== "number" || !Number.isFinite(raw)) return;
    const window = stringValue(bucket.window);
    const suffix =
      window === "weekly"
        ? "Weekly"
        : window === "5h"
          ? "Session (5h)"
          : window;
    const label = [
      stringValue(groupName || bucket.displayName || bucket.bucketId),
      suffix,
    ]
      .filter(Boolean)
      .join(" · ");
    if (!label) return;
    const row = {
      label,
      usedPercent: Math.round((1 - Math.min(1, Math.max(0, raw))) * 100),
    };
    const resetsAt = epochSeconds(bucket.resetTime);
    if (resetsAt !== null) row.resetsAt = resetsAt;
    rows.push(row);
  }
  for (const group of response?.groups ?? []) {
    for (const bucket of group.buckets ?? []) add(bucket, group.displayName);
  }
  if (!rows.length) {
    for (const bucket of response?.buckets ?? []) add(bucket);
  }
  return rows;
}

function requestLocal(service, method, body, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    // All URLs are constructed here from validated local ports, never supplied
    // by account data or the renderer. Older native servers use local TLS.
    const transport = service.protocol === "https:" ? https : http;
    const data = body === undefined ? null : JSON.stringify(body);
    const request = transport.request(
      {
        hostname: "127.0.0.1",
        port: service.port,
        path: method ? `${SERVICE}${method}` : "/",
        method: data === null ? "GET" : "POST",
        rejectUnauthorized: service.protocol !== "https:",
        headers:
          data === null
            ? {}
            : {
                "Content-Type": "application/json",
                "Connect-Protocol-Version": "1",
                "x-codeium-csrf-token": service.csrfToken,
                "Content-Length": Buffer.byteLength(data),
              },
      },
      (response) => {
        const chunks = [];
        let size = 0;
        response.on("error", reject);
        response.on("aborted", () =>
          reject(new Error("Antigravity service response was interrupted")),
        );
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > 2 * 1024 * 1024)
            request.destroy(new Error("Response too large"));
          else chunks.push(chunk);
        });
        response.on("end", () => {
          if (response.statusCode !== 200) {
            reject(
              new Error(
                `Antigravity service returned HTTP ${response.statusCode}`,
              ),
            );
            return;
          }
          const text = Buffer.concat(chunks).toString("utf8");
          if (!method) resolve(text);
          else {
            try {
              resolve(JSON.parse(text));
            } catch {
              reject(new Error("Invalid Antigravity service response"));
            }
          }
        });
      },
    );
    request.on("error", reject);
    request.setTimeout(timeoutMs, () =>
      request.destroy(new Error("Antigravity service timed out")),
    );
    if (data !== null) request.write(data);
    request.end();
  });
}

function createAntigravityRuntime(options = {}) {
  const fileSystem = options.fs ?? fs;
  const pathApi = options.path ?? path;
  const env = options.env ?? process.env;
  const execFile = options.execFile ?? childProcess.execFile;
  const request = options.requestLocal ?? requestLocal;
  const now = options.now ?? Date.now;
  let installPromise = null;
  let installCheckedAt = 0;
  let serviceCache = null;
  let statusPromise = null;
  let loginPromise = null;
  let loginError = null;

  function runPowerShell(script) {
    return new Promise((resolve) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", script],
        { windowsHide: true, timeout: 10000, maxBuffer: 512 * 1024 },
        (error, stdout) => {
          if (error) return resolve([]);
          try {
            const data = JSON.parse(String(stdout).trim() || "[]");
            resolve(Array.isArray(data) ? data : [data]);
          } catch {
            resolve([]);
          }
        },
      );
    });
  }

  function isExecutable(candidate) {
    try {
      return (
        candidate &&
        pathApi.isAbsolute(candidate) &&
        fileSystem.statSync(candidate).isFile()
      );
    } catch {
      return false;
    }
  }

  async function discover() {
    if (installPromise && now() - installCheckedAt < 15000)
      return installPromise;
    installCheckedAt = now();
    installPromise = (async () => {
      const candidates = [env.ANTIGRAVITY_PATH];
      for (const root of [
        env.LOCALAPPDATA && pathApi.join(env.LOCALAPPDATA, "Programs"),
        env.ProgramFiles,
        env["ProgramFiles(x86)"],
      ]) {
        if (!root) continue;
        candidates.push(pathApi.join(root, "Antigravity", "Antigravity.exe"));
        candidates.push(
          pathApi.join(root, "Google", "Antigravity", "Antigravity.exe"),
        );
      }
      for (const segment of (env.PATH || env.Path || "").split(
        pathApi.delimiter,
      )) {
        if (segment)
          candidates.push(
            pathApi.join(segment.replace(/^"|"$/g, ""), "Antigravity.exe"),
          );
      }
      let executable = candidates.find(isExecutable);
      if (!executable && (options.platform ?? process.platform) === "win32") {
        for (const installed of await runPowerShell(INSTALL_QUERY)) {
          const icon = installed.DisplayIcon?.replace(/^"|"$/g, "").replace(
            /,\s*-?\d+$/,
            "",
          );
          const located =
            installed.InstallLocation &&
            pathApi.join(installed.InstallLocation, "Antigravity.exe");
          executable = [located, icon].find(isExecutable);
          if (executable) break;
        }
      }
      return executable || null;
    })();
    return installPromise;
  }

  async function probe(port, native) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
    for (const protocol of ["http:", "https:"]) {
      try {
        const service = { port, protocol, native };
        const page = await request(service, null, undefined, 1500);
        const match = page.match(
          /window\.__APP_CONFIG__\s*=\s*(\{[^\r\n]*?\})\s*;/,
        );
        if (!match) continue;
        const config = JSON.parse(match[1]);
        if (
          config.productName !== "antigravity" ||
          typeof config.csrfToken !== "string" ||
          config.csrfToken.length > 256
        )
          continue;
        return { ...service, csrfToken: config.csrfToken };
      } catch {}
    }
    return null;
  }

  async function findService({ nativeOnly = false, refresh = false } = {}) {
    if (
      !refresh &&
      serviceCache &&
      now() - serviceCache.checkedAt < 15000 &&
      (!nativeOnly || serviceCache.native)
    )
      return serviceCache;
    const processes = options.listServers
      ? await options.listServers()
      : await runPowerShell(PROCESS_QUERY);
    const servers = processes
      .filter((server) => {
        if (server.name?.toLowerCase() !== "agy.exe") return true;
        return /--app_data_dir(?:=|\s+)antigravity(?:\s|$)/.test(
          server.commandLine || "",
        );
      })
      .sort(
        (a, b) =>
          Number(a.name?.toLowerCase() === "agy.exe") -
          Number(b.name?.toLowerCase() === "agy.exe"),
      );
    for (const server of servers) {
      const native = server.name?.toLowerCase() !== "agy.exe";
      if (nativeOnly && !native) continue;
      const hinted = Number(
        server.commandLine?.match(
          /--(?:hub-port|https_server_port)(?:=|\s+)(\d+)/,
        )?.[1],
      );
      for (const port of [...new Set([hinted, ...(server.ports || [])])]) {
        const service = await probe(Number(port), native);
        if (service) {
          serviceCache = { ...service, checkedAt: now() };
          return serviceCache;
        }
      }
    }
    serviceCache = null;
    return null;
  }

  async function readStatus() {
    const executable = await discover();
    const base = {
      nativeInstalled: Boolean(executable),
      loggedIn: null,
      account: null,
      usageAvailable: false,
      limits: [],
    };
    if (!executable)
      return { ...base, message: "Antigravity is not installed." };
    let service = await findService({ nativeOnly: true });
    if (!service)
      return {
        ...base,
        message: "Open Antigravity to detect its account and plan.",
      };
    let auth;
    try {
      auth = await request(service, "HasAuthToken", {});
    } catch {
      service = await findService({ nativeOnly: true, refresh: true });
      if (!service)
        return {
          ...base,
          message: "Open Antigravity to detect its account and plan.",
        };
      try {
        auth = await request(service, "HasAuthToken", {});
      } catch {
        return {
          ...base,
          message: "Antigravity account status is unavailable. Try Refresh.",
        };
      }
    }
    if (!auth.hasToken)
      return {
        ...base,
        loggedIn: false,
        message:
          loginError || "Sign in to Antigravity to detect your plan and usage.",
      };
    const responses = await Promise.allSettled([
      request(service, "GetAuthStatus", {}),
      request(service, "GetUserStatus", {}),
      request(service, "GetLoadCodeAssist", { forceRefresh: true }),
      request(service, "RetrieveUserQuotaSummary", { forceRefresh: true }),
    ]);
    const [authResult, status, load, quota] = responses.map((result) =>
      result.status === "fulfilled" ? result.value : null,
    );
    const userStatus = status?.userStatus;
    const validAuth = authResult?.authResult?.hasValidAuth;
    const email = stringValue(userStatus?.email, 254) || null;
    const planLabel = detectedPlan(
      userStatus,
      load?.response,
      status?.planInfo ||
        userStatus?.planInfo ||
        userStatus?.planStatus?.planInfo,
    );
    const limits = quotaLimits(quota?.response);
    const loggedIn =
      validAuth === true ? true : authResult?.authResult ? false : null;
    return {
      ...base,
      loggedIn,
      account:
        loggedIn === true ? { email, planLabel, planType: planLabel } : null,
      limits: loggedIn === true ? limits : [],
      usageAvailable: loggedIn === true && limits.length > 0,
      message:
        loggedIn === false
          ? "Sign in to Antigravity to detect your plan and usage."
          : loggedIn === null
            ? "Antigravity sign-in status is temporarily unavailable."
            : !planLabel
              ? "Antigravity has not returned its subscription plan."
              : !limits.length
                ? "Antigravity usage is temporarily unavailable."
                : null,
      updatedAt: Math.floor(now() / 1000),
    };
  }

  async function status() {
    if (statusPromise) return statusPromise;
    statusPromise = readStatus()
      .catch(() => ({
        nativeInstalled: false,
        loggedIn: null,
        account: null,
        usageAvailable: false,
        limits: [],
        message: "Antigravity account status is unavailable. Try Refresh.",
      }))
      .finally(() => {
        statusPromise = null;
      });
    return statusPromise;
  }

  async function launch() {
    const executable = await discover();
    if (!executable)
      return {
        ok: false,
        error: "Install the Antigravity app, then try again.",
      };
    try {
      if (options.spawnDetachedExecutable)
        options.spawnDetachedExecutable(executable, []);
      else {
        const launchEnv = { ...env };
        delete launchEnv.ELECTRON_RUN_AS_NODE;
        const launched = (options.spawn ?? childProcess.spawn)(executable, [], {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
          shell: false,
          env: launchEnv,
        });
        await new Promise((resolve, reject) => {
          launched.once("spawn", resolve);
          launched.once("error", reject);
        });
        launched.unref();
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not open the Antigravity app." };
    }
  }

  async function signIn() {
    if (loginPromise) return { ok: true, pending: true };
    const opened = await launch();
    if (!opened.ok) return opened;
    let service = await findService({ nativeOnly: true, refresh: true });
    for (let attempt = 0; !service && attempt < 5; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      service = await findService({ nativeOnly: true, refresh: true });
    }
    if (!service)
      return {
        ok: false,
        error: "Antigravity is still starting. Try Sign in again.",
      };
    loginError = null;
    // Login is the native UI's browser OAuth action. It remains pending until
    // the user completes Google's sign-in; never return credentials over IPC.
    loginPromise = request(service, "Login", { isGcpTos: false }, 300000)
      .then(() => {
        serviceCache = null;
      })
      .catch(() => {
        loginError = "Antigravity sign-in did not complete. Try Sign in again.";
      })
      .finally(() => {
        loginPromise = null;
      });
    return { ok: true, pending: true };
  }

  return { discover, status, launch, signIn };
}

module.exports = {
  createAntigravityRuntime,
  createRuntime: createAntigravityRuntime,
  detectedPlan,
  quotaLimits,
};
