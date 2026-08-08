import type { ProviderId, ProviderMeta } from "../../../../shared/types";
import type { ProviderAdapter } from "./base";
import { ANTHROPIC_META, anthropicAdapter } from "./anthropic";
import { GEMINI_META, geminiAdapter } from "./gemini";
import { OPENAI_META, openAiAdapter } from "./openai";
import { OPENROUTER_META, openRouterAdapter } from "./openrouter";

const ADAPTERS: Record<ProviderId, ProviderAdapter> = {
  anthropic: anthropicAdapter,
  openai: openAiAdapter,
  gemini: geminiAdapter,
  openrouter: openRouterAdapter
};

/** Display order for the UI (OpenRouter first: best-supported). */
export const PROVIDER_ORDER: ProviderId[] = ["openrouter", "anthropic", "openai", "gemini"];

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  anthropic: ANTHROPIC_META,
  openai: OPENAI_META,
  gemini: GEMINI_META,
  openrouter: OPENROUTER_META
};

export function getAdapter(id: ProviderId): ProviderAdapter {
  const adapter = ADAPTERS[id];
  if (!adapter) throw new Error(`No adapter for provider "${id}"`);
  return adapter;
}

export function allProviderMeta(): ProviderMeta[] {
  return PROVIDER_ORDER.map((id) => PROVIDER_META[id]);
}

export type { ProviderAdapter } from "./base";
