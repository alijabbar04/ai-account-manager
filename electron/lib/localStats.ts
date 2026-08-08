import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import type { Activity } from "../../shared/types";

const FIVE_HOURS = 5 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

interface TranscriptFile {
  file: string;
  mtime: number;
  size: number;
}

function listTranscripts(configDir: string): TranscriptFile[] {
  const projectsDir = path.join(configDir, "projects");
  const out: TranscriptFile[] = [];
  let projectDirs: string[] = [];
  try {
    projectDirs = fs
      .readdirSync(projectsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(projectsDir, d.name));
  } catch {
    return out;
  }
  for (const dir of projectDirs) {
    try {
      for (const entry of fs.readdirSync(dir)) {
        if (!entry.endsWith(".jsonl")) continue;
        try {
          const st = fs.statSync(path.join(dir, entry));
          out.push({ file: path.join(dir, entry), mtime: st.mtimeMs, size: st.size });
        } catch {
          /* file vanished mid-scan */
        }
      }
    } catch {
      /* unreadable project dir */
    }
  }
  return out;
}

/** Cheap, stat-only activity summary (runs on every state read). */
export function readActivity(configDir: string): Activity {
  const now = Date.now();
  const transcripts = listTranscripts(configDir);
  const projects = new Set(transcripts.map((t) => path.dirname(t.file))).size;

  let lastActiveAt: number | undefined;
  let sessions5h = 0;
  let sessions7d = 0;
  for (const t of transcripts) {
    if (!lastActiveAt || t.mtime > lastActiveAt) lastActiveAt = t.mtime;
    if (now - t.mtime <= FIVE_HOURS) sessions5h++;
    if (now - t.mtime <= SEVEN_DAYS) sessions7d++;
  }

  // history.jsonl also moves when the user is active, even before a transcript exists.
  try {
    const h = fs.statSync(path.join(configDir, "history.jsonl"));
    if (!lastActiveAt || h.mtimeMs > lastActiveAt) lastActiveAt = h.mtimeMs;
  } catch {
    /* no history yet */
  }

  return { lastActiveAt, sessions5h, sessions7d, projects };
}

/**
 * Fallback estimation when the usage API is unreachable: sums token usage and
 * user prompts from recent transcript JSONL. Bounded (≤25 files, ≤8 MB each)
 * because transcripts can be large.
 */
export async function estimateFromTranscripts(
  configDir: string
): Promise<{ estTokens7d: number; estPrompts7d: number }> {
  const now = Date.now();
  const recent = listTranscripts(configDir)
    .filter((t) => now - t.mtime <= SEVEN_DAYS && t.size <= 8 * 1024 * 1024)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 25);

  let tokens = 0;
  let prompts = 0;
  for (const t of recent) {
    try {
      const rl = readline.createInterface({
        input: fs.createReadStream(t.file, { encoding: "utf8" }),
        crlfDelay: Infinity
      });
      for await (const line of rl) {
        if (!line) continue;
        try {
          const entry = JSON.parse(line) as {
            type?: string;
            message?: { usage?: { input_tokens?: number; output_tokens?: number } };
          };
          if (entry.type === "user") prompts++;
          const usage = entry.message?.usage;
          if (usage) tokens += (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);
        } catch {
          /* malformed line */
        }
      }
    } catch {
      /* unreadable transcript */
    }
  }
  return { estTokens7d: tokens, estPrompts7d: prompts };
}
