#!/usr/bin/env node
"use strict";

const { finiteError, readScopedUsage } = require("./usage-reader.cjs");

const MAX_STDIN_BYTES = 64 * 1024;
let bytes = 0;
let body = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  bytes += Buffer.byteLength(chunk, "utf8");
  if (bytes > MAX_STDIN_BYTES) {
    process.stdout.write(
      `${JSON.stringify({
        schemaVersion: 1,
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "The usage-reader request is invalid.",
        },
      })}\n`,
    );
    process.exitCode = 2;
    process.stdin.pause();
    return;
  }
  body += chunk;
});

process.stdin.on("end", () => {
  if (process.exitCode) return;
  try {
    const result = readScopedUsage(JSON.parse(body));
    process.stdout.write(
      `${JSON.stringify({ schemaVersion: 1, ok: true, result })}\n`,
    );
  } catch (error) {
    const safe = finiteError(error);
    process.stdout.write(
      `${JSON.stringify({ schemaVersion: 1, ok: false, error: safe })}\n`,
    );
    process.exitCode = 1;
  }
});
