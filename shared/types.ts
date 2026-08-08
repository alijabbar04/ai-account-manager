/** Shared IPC contract between the Electron main process and the renderer. */

export interface Profile {
  id: string;
  name: string;
  /** Absolute path to this account's CLAUDE_CONFIG_DIR. */
  configDir: string;
  createdAt: string;
}

/** Non-secret identity derived from the profile's config dir. Never contains tokens. */
export interface Identity {
  loggedIn: boolean;
  email?: string;
  displayName?: string;
  orgName?: string;
  orgType?: string;
  billingType?: string;
  seatTier?: string;
  rateLimitTier?: string;
  subscriptionType?: string;
  /** Epoch ms when the access token expires (informational only). */
  tokenExpiresAt?: number;
  tokenExpired?: boolean;
}

export type Severity = "normal" | "warning" | "critical" | string;

export interface UsageLimit {
  /** e.g. "session" | "weekly_all" | "weekly_scoped" */
  kind: string;
  group?: string;
  percent: number;
  severity: Severity;
  /** ISO timestamp when this window resets. */
  resetsAt?: string;
  /** Present for model-scoped limits, e.g. "Fable" or "Opus". */
  modelName?: string;
  isActive?: boolean;
}

export interface ExtraUsage {
  enabled: boolean;
  usedCredits?: number;
  monthlyLimit?: number | null;
  currency?: string;
  decimalPlaces?: number;
}

export interface UsageSnapshot {
  fetchedAt: number;
  ok: boolean;
  /** Human-readable error when ok is false (e.g. "token expired", "offline"). */
  error?: string;
  limits: UsageLimit[];
  extra?: ExtraUsage;
}

export interface Activity {
  /** Epoch ms of most recent transcript/history write in this profile. */
  lastActiveAt?: number;
  /** Session transcript files touched within the current 5h / 7d windows. */
  sessions5h: number;
  sessions7d: number;
  /** Local token estimates (only computed as a fallback when the usage API fails). */
  estTokens7d?: number;
  estPrompts7d?: number;
  projects: number;
}

export interface ProfileState {
  profile: Profile;
  identity: Identity;
  usage: UsageSnapshot | null;
  activity: Activity;
  isDefault: boolean;
}

/* ==========================================================================
 * API Key Analytics
 * ======================================================================== */

export type ProviderId = "anthropic" | "openai" | "gemini" | "openrouter";

/**
 * How a given metric is obtained for a provider, per the research findings:
 *  - "exact":    provider returns it directly for a standard key
 *  - "admin":    only via a separate Admin/organization key
 *  - "derived":  computed by this app from deltas of a cumulative counter
 *  - "estimated": no API; must be estimated from locally-recorded activity
 *  - "none":     not available at all
 */
export type Capability = "exact" | "admin" | "derived" | "estimated" | "none";

export interface ProviderCapabilities {
  balance: Capability;
  usage: Capability;
  cost: Capability;
  rateLimits: Capability;
}

export interface ProviderMeta {
  id: ProviderId;
  displayName: string;
  /** Accepted key prefixes, used for format validation and masking. */
  keyPrefixes: string[];
  docsUrl: string;
  /** Brand-ish accent (falls back to categorical palette in the UI). */
  accent: string;
  capabilities: ProviderCapabilities;
  /** True when this provider can also use a separate admin/org key for cost. */
  supportsAdminKey: boolean;
  /** Whether a currency balance is denominated in credits ("$" prepaid) vs postpaid spend. */
  billingModel: "prepaid" | "postpaid" | "mixed";
}

/** Non-secret, persisted metadata for one stored API key. Never holds the secret. */
export interface ApiKeyRecord {
  id: string;
  provider: ProviderId;
  nickname: string;
  /** e.g. "sk-ant-…â€¦wxyz" — safe to show and persist. */
  maskedKey: string;
  createdAt: string;
  /** The key is an admin/org key (unlocks cost APIs for anthropic/openai). */
  isAdminKey?: boolean;
  /** Optional user-set monthly budget (USD) for projections & thresholds. */
  monthlyBudgetUsd?: number | null;
}

/**
 * One point-in-time reading from a provider. Cumulative fields are absolute
 * running totals (used to derive windowed usage via deltas); limit fields are
 * point-in-time. All monetary values are USD unless noted.
 */
export interface ProviderSnapshot {
  at: number;
  ok: boolean;
  error?: string;
  /** Remaining prepaid balance / credits, if the provider exposes one. */
  balanceUsd?: number | null;
  /** Total credits ever granted (prepaid providers). */
  creditLimitUsd?: number | null;
  currency?: string;
  /** Cumulative lifetime spend, tokens, requests (absolute running totals). */
  lifetimeCostUsd?: number | null;
  lifetimeTokens?: number | null;
  lifetimeRequests?: number | null;
  /** Point-in-time rate limits, when discoverable. */
  rpmLimit?: number | null;
  tpmLimit?: number | null;
  rpdLimit?: number | null;
  /** Free-form provider notes (e.g. "tier-1", "free tier"). */
  tier?: string;
  /**
   * Windowed spend supplied DIRECTLY by the provider (e.g. OpenRouter's
   * usage_daily/weekly/monthly). When present the analytics layer uses these
   * for the cost metric instead of deriving windows from snapshot deltas.
   */
  directCost?: { today?: number; week?: number; month?: number; lifetime?: number };
}

export type MetricKind = "cost" | "tokens" | "requests";
export type RangeKind = "1d" | "7d" | "30d" | "lifetime";
export type StatusKind = "green" | "yellow" | "red" | "unknown";

/** A single day bucket for charts. */
export interface DayBucket {
  /** ISO date (YYYY-MM-DD, local). */
  date: string;
  /** Usage attributed to this day (delta within the day). */
  daily: number;
  /** Cumulative running total up to and including this day. */
  running: number;
}

/** Derived windowed usage for one metric. */
export interface WindowUsage {
  today: number;
  week: number;
  month: number;
  lifetime: number;
}

/** Everything the UI needs to render one API key card / provider page. */
export interface ApiKeyState {
  record: ApiKeyRecord;
  meta: ProviderMeta;
  latest: ProviderSnapshot | null;
  status: StatusKind;
  /** Windowed usage per metric (derived from the snapshot series). */
  usage: Record<MetricKind, WindowUsage>;
  /** True where the metric came from provider data vs local derivation. */
  derivedFromSnapshots: boolean;
  /** Convenience roll-ups for cards. */
  balanceUsd: number | null;
  creditLimitUsd: number | null;
  currency: string;
  lastUpdated: number | null;
  /** Projection & runway (computed from recent daily spend). */
  avgDailySpendUsd: number | null;
  projectedMonthlyUsd: number | null;
  runwayDays: number | null;
}

/** Aggregate analytics across all keys, for the Analytics page. */
export interface AnalyticsSummary {
  totalBalanceUsd: number | null;
  spendToday: number;
  spendWeek: number;
  spendMonth: number;
  avgDailySpendUsd: number;
  projectedMonthlyUsd: number;
  topProvider: { provider: ProviderId; displayName: string; spendMonth: number } | null;
  mostUsedModel: string | null;
  /** Shortest runway across prepaid keys, for the headline warning. */
  shortestRunway: { keyId: string; nickname: string; days: number } | null;
  perProviderMonthSpend: Array<{ provider: ProviderId; displayName: string; spend: number }>;
}

export interface AddKeyResult {
  ok: boolean;
  error?: string;
  record?: ApiKeyRecord;
}

export interface ChartSeries {
  metric: MetricKind;
  range: RangeKind;
  buckets: DayBucket[];
  /** True when there aren't enough snapshots yet to draw a meaningful trend. */
  sparse: boolean;
}

export type ThemePref = "system" | "dark" | "light";

export interface CreateProfileResult {
  ok: boolean;
  error?: string;
  profile?: Profile;
}

export interface LaunchResult {
  ok: boolean;
  error?: string;
}

/** Locally-measured usage from the shared LiftedPDFTools ledger
 * (real Anthropic response token counts recorded by the desktop apps on
 * this PC - the no-admin-key alternative for usage tracking). */
export interface LocalLedgerWindow {
  day: number;
  week: number;
  month: number;
  lifetime: number;
}
export interface LocalLedgerData {
  available: boolean;
  rows: number;
  since: string;
  ledgerDir: string;
  cost: LocalLedgerWindow;
  calls: LocalLedgerWindow;
  byApp: { app: string; windows: LocalLedgerWindow }[];
}

/** API exposed on window.cam by the preload script. */
/* ---------------- Skills Sync (AI Environment Manager bridge) ---------------- */

/** One curated skill shipped in the AI Environment Manager library. */
export interface SkillsLibrarySkill {
  name: string;
  version: string;
  description: string;
  files: number;
}

/** A Claude profile folder (.claude / .claude-*) detected on this machine. */
export interface SkillsProfileInfo {
  name: string;
  path: string;
}

export type SkillsCellState = "Missing" | "UpToDate" | "Outdated" | "NewerAtTarget" | "Modified";

/** One skill × profile cell of the deployment matrix. */
export interface SkillsMatrixCell {
  skill: string;
  profile: string;
  state: SkillsCellState;
  installedVersion: string;
}

/** Full skills-sync state, produced by the AI Environment Manager engine. */
export interface SkillsOverview {
  engineFound: boolean;
  enginePath?: string;
  engineVersion?: string;
  libraryPath?: string;
  skills: SkillsLibrarySkill[];
  profiles: SkillsProfileInfo[];
  matrix: SkillsMatrixCell[];
  error?: string;
}

export interface SkillsInstallResultItem {
  skill: string;
  profile: string;
  action: string;
  success: boolean;
  simulated: boolean;
  detail: string;
}

export interface SkillsInstallOutcome {
  ok: boolean;
  error?: string;
  results: SkillsInstallResultItem[];
}

/** Skills Sync surface, namespaced under window.cam.skills. */
export interface SkillsSyncApi {
  overview(): Promise<SkillsOverview>;
  install(opts: {
    profiles?: string[];
    skills?: string[];
    dryRun?: boolean;
    force?: boolean;
  }): Promise<SkillsInstallOutcome>;
  runAudit(): Promise<{ ok: boolean; output: string }>;
  openApp(): Promise<{ ok: boolean; error?: string }>;
}

export interface CamApi {
  listStates(): Promise<ProfileState[]>;
  createProfile(name: string): Promise<CreateProfileResult>;
  importProfile(name: string, configDir: string): Promise<CreateProfileResult>;
  renameProfile(id: string, name: string): Promise<CreateProfileResult>;
  removeProfile(id: string, deleteDir: boolean): Promise<{ ok: boolean; error?: string }>;
  exportProfiles(): Promise<{ ok: boolean; path?: string; error?: string }>;
  pickFolder(): Promise<string | null>;
  refreshUsage(profileId?: string): Promise<void>;
  launch(kind: "claude" | "vscode" | "powershell" | "login", profileId: string): Promise<LaunchResult>;
  setDefault(profileId: string | null): Promise<{ ok: boolean; error?: string }>;
  revealFolder(profileId: string): Promise<void>;
  getTheme(): Promise<ThemePref>;
  setTheme(theme: ThemePref): Promise<void>;
  getVersions(): Promise<{ app: string; claudeCli?: string }>;
  /** Open the usage-tracking guide in the in-app PDF viewer window. */
  openUsageGuide(): Promise<void>;
  /** Open the guide PDF in Adobe Acrobat (or the default PDF app). */
  openGuideInAcrobat(): Promise<{ ok: boolean; how?: "acrobat" | "default"; error?: string }>;
  onStateChanged(cb: (states: ProfileState[]) => void): () => void;
  apiKeys: ApiKeysApi;
  skills: SkillsSyncApi;
}

/** API Key Analytics surface, namespaced under window.cam.apiKeys. */
export interface ApiKeysApi {
  providerMeta(): Promise<ProviderMeta[]>;
  list(): Promise<ApiKeyState[]>;
  summary(): Promise<AnalyticsSummary>;
  chart(id: string, metric: MetricKind, range: RangeKind): Promise<ChartSeries>;
  validate(provider: ProviderId, secret: string): Promise<{ ok: boolean; isAdminKey: boolean; error?: string }>;
  add(input: {
    provider: ProviderId;
    nickname: string;
    secret: string;
    isAdminKey?: boolean;
    monthlyBudgetUsd?: number | null;
  }): Promise<AddKeyResult>;
  update(
    id: string,
    patch: { nickname?: string; isAdminKey?: boolean; monthlyBudgetUsd?: number | null; secret?: string }
  ): Promise<AddKeyResult>;
  remove(id: string): Promise<{ ok: boolean; error?: string }>;
  refresh(id?: string): Promise<void>;
  export(): Promise<{ ok: boolean; path?: string; error?: string }>;
  localLedger(): Promise<LocalLedgerData>;
  onChanged(cb: (states: ApiKeyState[]) => void): () => void;
}
