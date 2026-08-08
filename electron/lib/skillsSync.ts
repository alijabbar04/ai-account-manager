/**
 * Skills Sync bridge — drives the AI Environment Manager engine
 * (AIEnvironmentManager.exe headless CLI) to inspect Claude profiles and
 * distribute the curated skill library across them.
 *
 * The engine owns all safety rules (backup-first, checksum verification,
 * never overwriting newer/modified copies); this module only locates the
 * executable, invokes its JSON verbs and parses the results.
 */
import { execFile, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { app } from "electron";
import type { SkillsInstallOutcome, SkillsMatrixCell, SkillsOverview } from "../../shared/types";

const ENGINE_EXE = "AIEnvironmentManager.exe";
const ENGINE_TIMEOUT_MS = 120_000;

function candidatePaths(): string[] {
  const desktop = app.getPath("desktop");
  return [
    path.join(desktop, "AI Environment Manager", ENGINE_EXE),
    path.join(app.getPath("home"), "Desktop", "AI Environment Manager", ENGINE_EXE),
    path.join(process.env.LOCALAPPDATA ?? "", "Programs", "AI Environment Manager", ENGINE_EXE),
    path.join(app.getPath("home"), "AI-Environment-Manager", "dist", "app", ENGINE_EXE)
  ];
}

export function findEngine(): string | null {
  for (const candidate of candidatePaths()) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate;
    } catch {
      /* keep probing */
    }
  }
  return null;
}

function runEngine(exe: string, args: string[]): Promise<{ stdout: string; code: number }> {
  return new Promise((resolve, reject) => {
    execFile(
      exe,
      args,
      { timeout: ENGINE_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024, windowsHide: true },
      (err, stdout) => {
        // The engine uses exit code 2 for "completed with failures" — stdout is
        // still valid JSON in that case, so only hard launch errors reject.
        const code = (err as NodeJS.ErrnoException & { code?: number | string })?.code;
        if (err && typeof code !== "number") {
          reject(err);
          return;
        }
        resolve({ stdout: stdout ?? "", code: typeof code === "number" ? code : 0 });
      }
    );
  });
}

function parseJson<T>(stdout: string): T {
  // AttachConsole may emit a leading blank line before the JSON payload.
  const start = stdout.indexOf("{");
  if (start < 0) throw new Error("Engine returned no JSON output.");
  return JSON.parse(stdout.slice(start)) as T;
}

export async function skillsOverview(): Promise<SkillsOverview> {
  const exe = findEngine();
  if (!exe) {
    return {
      engineFound: false,
      skills: [],
      profiles: [],
      matrix: [],
      error:
        "AIEnvironmentManager.exe was not found. Install AI Environment Manager (Desktop folder or installer) to enable Skills Sync."
    };
  }

  try {
    const version = await runEngine(exe, ["--version"]);
    const status = await runEngine(exe, ["--skills-status", "--json"]);
    const parsed = parseJson<{
      libraryPath: string | null;
      skills: SkillsOverview["skills"];
      profiles: SkillsOverview["profiles"];
      matrix: SkillsMatrixCell[];
    }>(status.stdout);

    return {
      engineFound: true,
      enginePath: exe,
      engineVersion: version.stdout.trim().replace(/^AI Environment Manager\s*/i, "") || undefined,
      libraryPath: parsed.libraryPath ?? undefined,
      skills: parsed.skills ?? [],
      profiles: parsed.profiles ?? [],
      matrix: parsed.matrix ?? []
    };
  } catch (err) {
    return {
      engineFound: true,
      enginePath: exe,
      skills: [],
      profiles: [],
      matrix: [],
      error: `Engine call failed: ${(err as Error).message}`
    };
  }
}

export async function installSkills(opts: {
  profiles?: string[];
  skills?: string[];
  dryRun?: boolean;
  force?: boolean;
}): Promise<SkillsInstallOutcome> {
  const exe = findEngine();
  if (!exe) {
    return { ok: false, error: "AIEnvironmentManager.exe not found.", results: [] };
  }

  const args = ["--install-skills", "--json"];
  if (opts.profiles?.length) args.push("--profiles", opts.profiles.join(","));
  if (opts.skills?.length) args.push("--skills", opts.skills.join(","));
  if (opts.dryRun) args.push("--dry-run");
  if (opts.force) args.push("--force");

  try {
    const run = await runEngine(exe, args);
    const parsed = parseJson<{ results: SkillsInstallOutcome["results"] }>(run.stdout);
    const results = parsed.results ?? [];
    return { ok: results.every((r) => r.success), results };
  } catch (err) {
    return { ok: false, error: (err as Error).message, results: [] };
  }
}

export async function runAudit(): Promise<{ ok: boolean; output: string }> {
  const exe = findEngine();
  if (!exe) return { ok: false, output: "AIEnvironmentManager.exe not found." };

  try {
    const run = await runEngine(exe, ["--audit"]);
    return { ok: run.code === 0, output: run.stdout.trim() };
  } catch (err) {
    return { ok: false, output: (err as Error).message };
  }
}

export function openApp(): { ok: boolean; error?: string } {
  const exe = findEngine();
  if (!exe) return { ok: false, error: "AIEnvironmentManager.exe not found." };

  const child = spawn(exe, [], { detached: true, stdio: "ignore", cwd: path.dirname(exe) });
  child.unref();
  return { ok: true };
}
