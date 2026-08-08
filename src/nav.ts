import type { ProviderId } from "../shared/types";

export type ViewKey =
  | "dashboard"
  | "accounts"
  | "skills-sync"
  | "api-dashboard"
  | "api-keys"
  | "analytics"
  | `provider:${ProviderId}`;

export function providerFromView(view: ViewKey): ProviderId | null {
  return view.startsWith("provider:") ? (view.slice("provider:".length) as ProviderId) : null;
}
