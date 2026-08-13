using System.Collections.Immutable;
using System.Text.Json.Serialization;

namespace AIAccountManager.Automation;

public sealed record AccessibleNodeSnapshot(
    string Name,
    string AutomationId,
    string ControlType,
    string RuntimeId,
    bool IsEnabled,
    bool IsOffscreen,
    ImmutableArray<AccessibleNodeSnapshot> Children)
{
    public static AccessibleNodeSnapshot Node(
        string name,
        string controlType,
        params AccessibleNodeSnapshot[] children) =>
        new(name, string.Empty, controlType, Guid.NewGuid().ToString("N"), true, false, children.ToImmutableArray());
}

public sealed record ProcessIdentitySnapshot(
    int ProcessId,
    string ProcessName,
    string ExecutablePath,
    string Publisher,
    string PackageFamilyName,
    bool SignatureValid,
    string IntegrityLevel,
    bool IsElevated,
    bool IsSecureDesktop);

public sealed record ProviderSurfaceSnapshot(
    string Provider,
    long Hwnd,
    string WindowTitle,
    ProcessIdentitySnapshot Identity,
    AccessibleNodeSnapshot Root);

public sealed record ConfidenceSignal(string Name, bool Passed);

public sealed record RecognitionDecision(
    bool IsMatch,
    string Provider,
    string Reason,
    int Score,
    string CardRuntimeId,
    string ButtonRuntimeId,
    string SanitizedLabel,
    bool LiveEligible,
    ImmutableArray<ConfidenceSignal> Signals)
{
    public static RecognitionDecision NoMatch(
        string provider,
        string reason,
        IEnumerable<ConfidenceSignal>? signals = null) =>
        new(false, provider, reason, 0, string.Empty, string.Empty, string.Empty, false,
            (signals ?? []).ToImmutableArray());
}

public sealed record ProviderSelector(
    string Id,
    string Surface,
    ImmutableArray<string> ContextNames,
    ImmutableArray<string> PromptNames,
    ImmutableArray<string> AllowNames,
    bool LiveEligible,
    string Status);

public sealed record SelectorCatalog(
    int SchemaVersion,
    string Revision,
    ImmutableArray<ProviderSelector> Providers);

public sealed record ProviderSetting(bool Enabled, string Method)
{
    private static readonly HashSet<string> AllowedMethods = new(StringComparer.Ordinal)
    {
        "native-auto",
        "native-skip",
        "native-no-prompts",
        "native-auto-review",
        "native-auto-with-uia-fallback",
        "native-auto-review-with-uia-fallback",
        "uia-fallback",
        "dry-run",
        "disabled",
    };

    [JsonIgnore]
    public bool UsesUia => Enabled &&
        (Method.Contains("uia-fallback", StringComparison.Ordinal) || Method == "dry-run");

    public ProviderSetting Sanitize() =>
        AllowedMethods.Contains(Method) ? this : new ProviderSetting(false, "disabled");
}

public sealed record HostSettings(
    bool AutomationEnabled,
    bool DryRun,
    int ApprovalDelayMs,
    int FallbackPollMs,
    int LogRetentionDays,
    long? PausedUntil,
    string SelectorRevision,
    Dictionary<string, ProviderSetting> Providers)
{
    public static HostSettings SafeDefaults => new(
        false,
        true,
        150,
        5_000,
        30,
        null,
        "2026-08-v1",
        new Dictionary<string, ProviderSetting>(StringComparer.OrdinalIgnoreCase));

    [JsonIgnore]
    public bool IsPaused => PausedUntil is { } value && value > DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    public HostSettings Sanitize()
    {
        return this with
        {
            AutomationEnabled = AutomationEnabled,
            DryRun = DryRun,
            ApprovalDelayMs = Math.Clamp(ApprovalDelayMs, 0, 5_000),
            FallbackPollMs = Math.Clamp(FallbackPollMs, 1_000, 60_000),
            LogRetentionDays = Math.Clamp(LogRetentionDays, 1, 365),
            SelectorRevision = Redactor.Label(SelectorRevision, 40),
            Providers = (Providers ?? new(StringComparer.OrdinalIgnoreCase))
                .ToDictionary(
                    pair => Redactor.Label(pair.Key, 40),
                    pair => (pair.Value ?? new ProviderSetting(false, "disabled")).Sanitize(),
                    StringComparer.OrdinalIgnoreCase),
        };
    }
}

public sealed record AuditRecord(
    long Timestamp,
    long DurationMs,
    string Provider,
    string Surface,
    string Process,
    string Window,
    string Label,
    string RequestedAction,
    string Method,
    string Result,
    bool DryRun,
    ImmutableArray<ConfidenceSignal> ConfidenceSignals,
    int RetryCount,
    string ErrorCode);

public sealed record DiagnosticElement(
    int ProcessId,
    string Hwnd,
    string PackageFamily,
    string Signer,
    bool SignatureValid,
    string ControlType,
    string Name,
    string AutomationId,
    string RuntimeId,
    string AdapterDecision);

public sealed record DiagnosticReport(
    long CapturedAt,
    string SelectorRevision,
    ImmutableArray<DiagnosticElement> Elements,
    ImmutableArray<string> Notes);

public sealed record HostStatus(
    string State,
    bool Running,
    bool DryRun,
    long? PausedUntil,
    long EventsSeen,
    long Scans,
    long Matches,
    long Invocations,
    long Errors,
    string SelectorRevision,
    string? LastError);
