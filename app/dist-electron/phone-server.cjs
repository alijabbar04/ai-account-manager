"use strict";

// A read-only usage endpoint for the phone companion.
//
// It listens on this PC's Tailscale address only, so it is reachable from the
// user's own tailnet and nowhere else, and it refuses any peer outside
// Tailscale's 100.64.0.0/10 range as a second check. Traffic is plain HTTP
// inside the tailnet's WireGuard tunnel. Apart from pairing, every route needs
// the device token issued when the phone scanned a pairing code.

const http = require("node:http");
const {
  MAX_PAIRING_ATTEMPTS,
  createDeviceToken,
  isTailscaleIPv4,
  normalizePairingCode,
  sanitizeDeviceName,
  tokensEqual,
} = require("./phone-domain.cjs");

const MAX_BODY_BYTES = 4096;
const REFRESH_MIN_GAP_MS = 60 * 1000;

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  // The phone app renders from bundled files, so its requests are
  // cross-origin; bearer tokens, not cookies, carry the authority.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Private-Network": "true",
  "Access-Control-Max-Age": "600",
};

class PhoneSyncServer {
  constructor({
    getSnapshot,
    requestRefresh,
    getDeviceToken,
    onPaired,
    now = Date.now,
    allowPeer = isTailscaleIPv4,
  }) {
    this.getSnapshot = getSnapshot;
    this.requestRefresh = requestRefresh;
    this.getDeviceToken = getDeviceToken;
    this.onPaired = onPaired;
    this.now = now;
    this.allowPeer = allowPeer;
    this.server = null;
    this.address = null;
    this.pairing = null;
    this.lastRefreshAt = 0;
  }

  get listening() {
    return Boolean(this.server?.listening);
  }

  startPairing(code, ttlMs) {
    this.pairing = { code, expiresAt: this.now() + ttlMs, attempts: 0 };
    return { ...this.pairing };
  }

  cancelPairing() {
    this.pairing = null;
  }

  activePairing() {
    if (this.pairing && this.pairing.expiresAt <= this.now()) {
      this.pairing = null;
    }
    return this.pairing;
  }

  listen(host, port) {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        this.handle(req, res).catch(() => {
          if (!res.headersSent) this.send(res, 500, { error: "Server error." });
          else res.destroy();
        });
      });
      server.requestTimeout = 10_000;
      server.headersTimeout = 10_000;
      server.once("error", reject);
      server.listen(port, host, () => {
        server.off("error", reject);
        this.server = server;
        this.address = { host, port: server.address().port };
        resolve(this.address);
      });
    });
  }

  close() {
    const server = this.server;
    this.server = null;
    this.address = null;
    this.pairing = null;
    if (!server) return Promise.resolve();
    return new Promise((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections?.();
    });
  }

  send(res, status, body) {
    res.writeHead(status, BASE_HEADERS);
    res.end(body === undefined ? undefined : JSON.stringify(body));
  }

  readJson(req) {
    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      // Drain an oversized body rather than resetting the socket, so the
      // client still gets its 413; requestTimeout bounds how long that takes.
      req.on("data", (chunk) => {
        size += chunk.length;
        if (size <= MAX_BODY_BYTES) chunks.push(chunk);
      });
      req.on("end", () => {
        if (size > MAX_BODY_BYTES) {
          reject(Object.assign(new Error("too large"), { status: 413 }));
          return;
        }
        try {
          resolve(chunks.length ? JSON.parse(Buffer.concat(chunks)) : {});
        } catch {
          reject(Object.assign(new Error("bad json"), { status: 400 }));
        }
      });
      req.on("error", reject);
    });
  }

  authorized(req) {
    const header = String(req.headers.authorization ?? "");
    const match = header.match(/^Bearer ([A-Za-z0-9_-]{16,128})$/);
    return Boolean(match && tokensEqual(this.getDeviceToken(), match[1]));
  }

  async handle(req, res) {
    if (!this.allowPeer(req.socket.remoteAddress)) {
      this.send(res, 403, { error: "Only devices on your Tailscale network." });
      return;
    }
    if (req.method === "OPTIONS") {
      this.send(res, 204);
      return;
    }
    const path = new URL(req.url ?? "/", "http://phone.invalid").pathname;
    const route = `${req.method} ${path}`;

    if (route === "GET /v1/ping") {
      this.send(res, 200, { ok: true, v: 1 });
      return;
    }

    if (route === "POST /v1/pair") {
      let body;
      try {
        body = await this.readJson(req);
      } catch (err) {
        this.send(res, err.status ?? 400, { error: "Bad pairing request." });
        return;
      }
      const pairing = this.activePairing();
      if (!pairing) {
        this.send(res, 410, {
          error:
            "No pairing code is active. On your PC open Settings › Phone and choose Pair a phone.",
        });
        return;
      }
      if (normalizePairingCode(body?.code) !== pairing.code) {
        pairing.attempts += 1;
        if (pairing.attempts >= MAX_PAIRING_ATTEMPTS) this.pairing = null;
        this.send(res, 401, {
          error:
            pairing.attempts >= MAX_PAIRING_ATTEMPTS
              ? "Too many wrong codes. Start pairing again on your PC."
              : "That code doesn't match the one on your PC.",
        });
        return;
      }
      this.pairing = null;
      const token = createDeviceToken();
      await this.onPaired({
        token,
        deviceName: sanitizeDeviceName(body.device),
      });
      this.send(res, 200, { token });
      return;
    }

    if (route === "GET /v1/usage" || route === "POST /v1/refresh") {
      if (!this.authorized(req)) {
        this.send(res, 401, {
          error: "This phone is no longer paired with your PC.",
          code: "unpaired",
        });
        return;
      }
      if (route === "GET /v1/usage") {
        this.send(res, 200, await this.getSnapshot());
        return;
      }
      const now = this.now();
      const wait = this.lastRefreshAt + REFRESH_MIN_GAP_MS - now;
      if (wait > 0) {
        this.send(res, 202, { accepted: false, retryAfterMs: wait });
        return;
      }
      this.lastRefreshAt = now;
      Promise.resolve()
        .then(() => this.requestRefresh())
        .catch(() => {});
      this.send(res, 202, { accepted: true });
      return;
    }

    this.send(res, 404, { error: "Not found." });
  }
}

module.exports = { PhoneSyncServer, REFRESH_MIN_GAP_MS };
