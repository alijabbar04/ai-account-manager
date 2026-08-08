// Re-exports the real TS sources for the analytics test bundle (esbuild resolves .ts).
export {
  consumptionBetween,
  windowUsage,
  dailyBuckets,
  avgDailySpend,
  projectSpend,
  computeStatus,
  runwayPhrase
} from "../electron/lib/api/analytics";
export { maskKey } from "../electron/lib/api/keyStore";
export { anthropicAdapter } from "../electron/lib/api/adapters/anthropic";
export { openAiAdapter } from "../electron/lib/api/adapters/openai";
export { geminiAdapter } from "../electron/lib/api/adapters/gemini";
export { openRouterAdapter } from "../electron/lib/api/adapters/openrouter";
