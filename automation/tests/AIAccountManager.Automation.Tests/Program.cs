using System.Collections.Immutable;
using System.Text.Json;
using AIAccountManager.Automation;

var tests = new (string Name, Action Run)[]
{
    ("positive Claude tree needs every strong signal", PositiveClaudeTree),
    ("live Claude Windows-MCP card is recognized", LiveClaudeWindowsMcpTree),
    ("live Claude Gmail draft card is recognized", LiveClaudeGmailDraftTree),
    ("permission card remains discoverable after a long conversation", DeepClaudeTree),
    ("spoofed process name is rejected", SpoofedProcessName),
    ("elevated and secure surfaces are rejected", ElevatedSurface),
    ("button in a different card is rejected", WrongAncestor),
    ("partial and malformed trees are rejected", PartialTree),
    ("localized selectors remain data-driven", LocalizedSelector),
    ("multiple cards in one window are independently recognized", MultipleCards),
    ("browser candidates can never become live from selector data alone", BrowserNeverLive),
    ("duplicate event fingerprints expire", Dedupe),
    ("an unchanged visible card remains suppressed until disappearance", ActiveDedupe),
    ("protocol versions and secrets fail closed", Protocol),
    ("audit storage redacts and can be cleared", Audit),
    ("host settings clamp fallback and retention", Settings),
    ("native-only and unknown methods cannot enter UIA", ProviderMethods),
    ("unverified selectors report validation required instead of monitoring", ValidationRequiredStatus),
};

var failures = 0;
foreach (var test in tests)
{
    try
    {
        test.Run();
        Console.WriteLine($"PASS {test.Name}");
    }
    catch (Exception error)
    {
        failures++;
        Console.Error.WriteLine($"FAIL {test.Name}: {error.Message}");
    }
}
Console.WriteLine($"{tests.Length - failures}/{tests.Length} automation host tests passed.");
return failures == 0 ? 0 : 1;

static void PositiveClaudeTree()
{
    var engine = new RecognitionEngine();
    var decision = engine.Evaluate(Surface(TrustedClaude(),
        AccessibleNodeSnapshot.Node("Claude", "Window",
            AccessibleNodeSnapshot.Node("Permission card", "Pane",
                AccessibleNodeSnapshot.Node("Claude wants to use computer", "Text"),
                AccessibleNodeSnapshot.Node("Allow once", "Button")))), ClaudeSelector());
    Equal(true, decision.IsMatch);
    Equal(100, decision.Score);
    Equal(6, decision.Signals.Count(signal => signal.Passed));
}

static void LiveClaudeWindowsMcpTree()
{
    var root = AccessibleNodeSnapshot.Node("Claude", "Window",
        AccessibleNodeSnapshot.Node("Primary pane", "Pane",
            AccessibleNodeSnapshot.Node("Permission card", "Group",
                AccessibleNodeSnapshot.Node("Claude wants to use App from Windows-MCP", "Button"),
                AccessibleNodeSnapshot.Node("Deny", "Button"),
                AccessibleNodeSnapshot.Node("Always allow", "Button"),
                AccessibleNodeSnapshot.Node("Allow once", "Button"))));
    var decision = new RecognitionEngine().Evaluate(Surface(TrustedClaude(), root), ClaudeSelector());
    Equal(true, decision.IsMatch);
    Equal("Claude wants to use App from Windows-MCP", decision.SanitizedLabel);
}

static void LiveClaudeGmailDraftTree()
{
    var root = AccessibleNodeSnapshot.Node("Claude", "Window",
        AccessibleNodeSnapshot.Node("Permission card", "Group",
            AccessibleNodeSnapshot.Node("Claude wants to use Create draft email from Gmail", "Button"),
            AccessibleNodeSnapshot.Node("Deny", "Button"),
            AccessibleNodeSnapshot.Node("Always allow", "Button"),
            AccessibleNodeSnapshot.Node("Allow once", "Button")));
    var decision = new RecognitionEngine().Evaluate(Surface(TrustedClaude(), root), ClaudeSelector());
    Equal(true, decision.IsMatch);
    Equal("Claude wants to use Create draft email from Gmail", decision.SanitizedLabel);
}

static void DeepClaudeTree()
{
    var history = Enumerable.Range(0, 500)
        .Select(index => AccessibleNodeSnapshot.Node($"Conversation item {index}", "Text"))
        .Append(AccessibleNodeSnapshot.Node("Permission card", "Group",
            AccessibleNodeSnapshot.Node("Claude wants to use App from Windows-MCP", "Button"),
            AccessibleNodeSnapshot.Node("Allow once", "Button")))
        .ToArray();
    var root = AccessibleNodeSnapshot.Node("Claude", "Window", history);
    Equal(true, new RecognitionEngine().Evaluate(Surface(TrustedClaude(), root), ClaudeSelector()).IsMatch);
}

static void SpoofedProcessName()
{
    var spoof = TrustedClaude() with
    {
        ExecutablePath = @"C:\Temp\claude.exe",
        Publisher = "Unknown",
        PackageFamilyName = string.Empty,
        SignatureValid = false,
    };
    var decision = new RecognitionEngine().Evaluate(Surface(spoof,
        AccessibleNodeSnapshot.Node("Claude", "Window",
            AccessibleNodeSnapshot.Node("Card", "Pane",
                AccessibleNodeSnapshot.Node("Claude wants to use computer", "Text"),
                AccessibleNodeSnapshot.Node("Allow once", "Button")))), ClaudeSelector());
    Equal(false, decision.IsMatch);
    Contains(decision.Reason, "Process name alone");
}

static void ElevatedSurface()
{
    var elevated = TrustedClaude() with { IsElevated = true, IntegrityLevel = "high" };
    var result = IdentityPolicy.Evaluate(elevated, "claudeDesktop");
    Equal(true, result.Trusted);
    Equal(false, result.SafeDesktop);
}

static void WrongAncestor()
{
    var root = AccessibleNodeSnapshot.Node("Claude", "Window",
        AccessibleNodeSnapshot.Node("Request pane", "Pane",
            AccessibleNodeSnapshot.Node("Claude wants to use computer", "Text")),
        AccessibleNodeSnapshot.Node("Unrelated pane", "Pane",
            AccessibleNodeSnapshot.Node("Allow once", "Button")));
    Equal(false, new RecognitionEngine().Evaluate(Surface(TrustedClaude(), root), ClaudeSelector()).IsMatch);
}

static void PartialTree()
{
    var root = AccessibleNodeSnapshot.Node("Claude", "Window",
        AccessibleNodeSnapshot.Node("Permission card", "Pane",
            AccessibleNodeSnapshot.Node("Claude wants to use computer", "Text")));
    Equal(false, new RecognitionEngine().Evaluate(Surface(TrustedClaude(), root), ClaudeSelector()).IsMatch);
}

static void LocalizedSelector()
{
    var selector = ClaudeSelector() with
    {
        PromptNames = ["Claude souhaite utiliser computer"],
        AllowNames = ["Autoriser une fois"],
    };
    var root = AccessibleNodeSnapshot.Node("Claude", "Window",
        AccessibleNodeSnapshot.Node("Carte", "Group",
            AccessibleNodeSnapshot.Node("Claude souhaite utiliser computer", "Text"),
            AccessibleNodeSnapshot.Node("Autoriser une fois", "Button")));
    Equal(true, new RecognitionEngine().Evaluate(Surface(TrustedClaude(), root), selector).IsMatch);
}

static void MultipleCards()
{
    var root = AccessibleNodeSnapshot.Node("Claude", "Window",
        AccessibleNodeSnapshot.Node("First card", "Group",
            AccessibleNodeSnapshot.Node("Claude wants to use computer", "Text"),
            AccessibleNodeSnapshot.Node("Allow once", "Button")),
        AccessibleNodeSnapshot.Node("Second card", "Group",
            AccessibleNodeSnapshot.Node("Claude wants to use javascript_tool", "Text"),
            AccessibleNodeSnapshot.Node("Allow this action", "Button")));
    var engine = new RecognitionEngine();
    var surface = Surface(TrustedClaude(), root);
    var matches = engine.EvaluateMatches(surface, ClaudeSelector());
    Equal(2, matches.Count);
    Equal(2, matches.Select(match => DedupeCache.Fingerprint(surface, match)).Distinct().Count());
    var secondWindow = surface with { Hwnd = 200 };
    var secondWindowMatches = engine.EvaluateMatches(secondWindow, ClaudeSelector());
    Equal(false,
        DedupeCache.Fingerprint(surface, matches[0]) ==
        DedupeCache.Fingerprint(secondWindow, secondWindowMatches[0]));
}

static void BrowserNeverLive()
{
    var chrome = new ProcessIdentitySnapshot(
        55, "chrome", Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
            "Google", "Chrome", "Application", "chrome.exe"),
        "CN=Google LLC", string.Empty, true, "medium", false, false);
    var selector = ClaudeSelector() with { Id = "claudeChrome", Surface = "chrome-side-panel", LiveEligible = true };
    var root = AccessibleNodeSnapshot.Node("Claude", "Window",
        AccessibleNodeSnapshot.Node("Permission card", "Group",
            AccessibleNodeSnapshot.Node("Claude wants to use computer", "Text"),
            AccessibleNodeSnapshot.Node("Allow once", "Button")));
    var decision = new RecognitionEngine().Evaluate(Surface(chrome, root), selector);
    Equal(true, decision.IsMatch);
    Equal(false, decision.LiveEligible);
}

static void Dedupe()
{
    var cache = new DedupeCache(TimeSpan.FromSeconds(2));
    var now = DateTimeOffset.UtcNow;
    Equal(true, cache.TryAdd("same", now));
    Equal(false, cache.TryAdd("same", now.AddSeconds(1)));
    Equal(true, cache.TryAdd("same", now.AddSeconds(3)));
}

static void ActiveDedupe()
{
    var cache = new DedupeCache(TimeSpan.FromMilliseconds(1));
    Equal(2, cache.ReconcileActive("claude|1|window", ["card-a", "card-b"]).Count);
    Thread.Sleep(5);
    Equal(0, cache.ReconcileActive("claude|1|window", ["card-a", "card-b"]).Count);
    Equal(0, cache.ReconcileActive("claude|1|window", ["card-b"]).Count);
    Equal(1, cache.ReconcileActive("claude|1|window", ["card-a", "card-b"]).Count);
    Equal(0, cache.ReconcileActive("claude|1|window", []).Count);
    Equal(2, cache.ReconcileActive("claude|1|window", ["card-a", "card-b"]).Count);
}

static void Protocol()
{
    using var document = JsonDocument.Parse("{}");
    var good = new IpcMessage("1", "hello", 1, new string('a', 40), document.RootElement.Clone());
    Equal(true, ProtocolValidator.ValidateHello(good, new string('a', 40)));
    Equal(false, ProtocolValidator.ValidateHello(good with { Protocol = 99 }, new string('a', 40)));
    Equal(false, ProtocolValidator.ValidateHello(good with { Secret = new string('b', 40) }, new string('a', 40)));
}

static void Audit()
{
    var root = Path.Combine(Path.GetTempPath(), $"aam-automation-test-{Guid.NewGuid():N}");
    try
    {
        var store = new AuditStore(root, 30);
        store.Append(new AuditRecord(
            DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), 2, "claudeDesktop", "desktop",
            @"claude.exe C:\Users\Someone\private\brief.txt sk-token_abcdefghijklmnopqrstuvwxyz",
            "me@example.com https://x.test/path?code=secret",
            "Allow once", "approve", "uia-invoke", "success", false,
            [new ConfidenceSignal("trusted", true)], 0, string.Empty));
        var records = store.List();
        Equal(1, records.Length);
        Equal(false, JsonSerializer.Serialize(records).Contains("abcdefghijklmnopqrstuvwxyz", StringComparison.Ordinal));
        Equal(false, records[0].Process.Contains("Someone", StringComparison.Ordinal));
        Equal(false, records[0].Window.Contains("?code=", StringComparison.Ordinal));
        store.Clear();
        Equal(0, store.List().Length);
    }
    finally
    {
        if (Directory.Exists(root)) Directory.Delete(root, true);
    }
}

static void Settings()
{
    var settings = new HostSettings(true, false, -50, 50, 900, null, "v1",
        new Dictionary<string, ProviderSetting>()).Sanitize();
    Equal(0, settings.ApprovalDelayMs);
    Equal(1_000, settings.FallbackPollMs);
    Equal(365, settings.LogRetentionDays);
}

static void ProviderMethods()
{
    Equal(false, new ProviderSetting(true, "native-skip").UsesUia);
    Equal(true, new ProviderSetting(true, "native-auto-with-uia-fallback").UsesUia);
    Equal(true, new ProviderSetting(true, "dry-run").UsesUia);
    var settings = new HostSettings(true, false, 150, 5_000, 30, null, "v1",
        new Dictionary<string, ProviderSetting>
        {
            ["claudeDesktop"] = new(true, "invented-live-mode"),
        }).Sanitize();
    Equal(false, settings.Providers["claudeDesktop"].Enabled);
    Equal("disabled", settings.Providers["claudeDesktop"].Method);
}

static void ValidationRequiredStatus()
{
    var root = Path.Combine(Path.GetTempPath(), $"aam-status-test-{Guid.NewGuid():N}");
    try
    {
        var catalog = new SelectorCatalog(1, "2026-08-v3", [ClaudeSelector() with { LiveEligible = false }]);
        using var engine = new AutomationEventEngine(catalog, new AuditStore(root));
        engine.Configure(new HostSettings(true, false, 150, 5_000, 30, null, "2026-08-v3",
            new Dictionary<string, ProviderSetting>
            {
                ["claudeDesktop"] = new(true, "uia-fallback"),
            }));
        Equal("Validation required", engine.Status().State);
    }
    finally
    {
        if (Directory.Exists(root)) Directory.Delete(root, true);
    }
}

static ProviderSelector ClaudeSelector() => new(
    "claudeDesktop", "desktop", ["Claude", "Cowork"],
    ["Claude wants to use", "Claude wants to use computer", "Claude wants to use javascript_tool", "Claude wants to use App from Windows-MCP"],
    ["Allow once", "Allow this action"], true, "needs-live-test");

static ProcessIdentitySnapshot TrustedClaude() => new(
    42, "claude", @"C:\Program Files\WindowsApps\Claude_1.2.3_x64__pzs8sxrjxfjjc\app\claude.exe",
    "CN=Anthropic, PBC", "Claude_pzs8sxrjxfjjc", true, "medium", false, false);

static ProviderSurfaceSnapshot Surface(ProcessIdentitySnapshot identity, AccessibleNodeSnapshot root) =>
    new("claudeDesktop", 100, "Claude", identity, root);

static void Equal<T>(T expected, T actual)
{
    if (!EqualityComparer<T>.Default.Equals(expected, actual))
        throw new InvalidOperationException($"Expected {expected}, got {actual}.");
}

static void Contains(string value, string expected)
{
    if (!value.Contains(expected, StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException($"Expected '{value}' to contain '{expected}'.");
}
