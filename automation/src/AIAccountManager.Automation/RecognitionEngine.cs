using System.Collections.Immutable;

namespace AIAccountManager.Automation;

public sealed class RecognitionEngine
{
    private const int MaxCardNodes = 64;

    public RecognitionDecision Evaluate(
        ProviderSurfaceSnapshot surface,
        ProviderSelector selector)
    {
        var identity = IdentityPolicy.Evaluate(surface.Identity, selector.Id);
        var contextPassed = ContainsAny(surface.Root, selector.ContextNames, 180);
        var signals = new List<ConfidenceSignal>
        {
            new("trusted process/package identity", identity.Trusted),
            new("standard integrity and default desktop", identity.SafeDesktop),
            new("provider window or side-panel context", contextPassed),
        };

        if (!identity.Trusted || !identity.SafeDesktop || !contextPassed)
        {
            return RecognitionDecision.NoMatch(selector.Id, identity.Reason, signals);
        }
        if (selector.PromptNames.IsDefaultOrEmpty || selector.AllowNames.IsDefaultOrEmpty)
        {
            signals.Add(new("observed provider selectors available", false));
            return RecognitionDecision.NoMatch(
                selector.Id,
                "No live selectors have been captured for this provider surface.",
                signals);
        }

        // The top-level window is never itself a permission card. Skipping it
        // prevents a prompt in one pane from being paired with a button in an
        // unrelated sibling pane.
        foreach (var possibleCard in Traverse(surface.Root, 220).Skip(1))
        {
            var bounded = Traverse(possibleCard, MaxCardNodes).ToArray();
            var prompt = bounded.FirstOrDefault(node =>
                NameMatches(node.Name, selector.PromptNames));
            var button = bounded.FirstOrDefault(node =>
                IsActionable(node) && NameMatches(node.Name, selector.AllowNames));
            if (prompt is null || button is null)
            {
                continue;
            }

            signals.Add(new("provider request text or semantic role", true));
            signals.Add(new("nearby actionable allow control", true));
            signals.Add(new("bounded card ancestor relationship", true));
            return new RecognitionDecision(
                true,
                selector.Id,
                "All required trust and card relationship signals passed.",
                100,
                possibleCard.RuntimeId,
                button.RuntimeId,
                Redactor.Label(prompt.Name, 100),
                selector.LiveEligible && selector.Id is not "claudeChrome" and not "chatgptBrowser",
                signals.ToImmutableArray());
        }

        signals.Add(new("provider request text or semantic role", false));
        signals.Add(new("nearby actionable allow control", false));
        signals.Add(new("bounded card ancestor relationship", false));
        return RecognitionDecision.NoMatch(
            selector.Id,
            "No bounded provider permission card matched.",
            signals);
    }

    public IReadOnlyList<RecognitionDecision> EvaluateAll(
        ProviderSurfaceSnapshot surface,
        IEnumerable<ProviderSelector> selectors) =>
        selectors.Select(selector => Evaluate(surface, selector)).ToArray();

    private static bool ContainsAny(
        AccessibleNodeSnapshot root,
        ImmutableArray<string> names,
        int limit) =>
        Traverse(root, limit).Any(node => NameMatches(node.Name, names));

    private static bool NameMatches(string name, ImmutableArray<string> expected)
    {
        var normalized = Normalize(name);
        return expected.Any(item =>
        {
            var target = Normalize(item);
            return normalized.Equals(target, StringComparison.OrdinalIgnoreCase) ||
                   normalized.StartsWith(target + " ", StringComparison.OrdinalIgnoreCase);
        });
    }

    private static string Normalize(string value) =>
        string.Join(' ', (value ?? string.Empty)
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

    private static bool IsActionable(AccessibleNodeSnapshot node) =>
        node.IsEnabled && !node.IsOffscreen &&
        (node.ControlType.EndsWith("Button", StringComparison.OrdinalIgnoreCase) ||
         node.ControlType.EndsWith("MenuItem", StringComparison.OrdinalIgnoreCase) ||
         node.ControlType.EndsWith("Hyperlink", StringComparison.OrdinalIgnoreCase));

    public static IEnumerable<AccessibleNodeSnapshot> Traverse(
        AccessibleNodeSnapshot root,
        int maximum)
    {
        var queue = new Queue<AccessibleNodeSnapshot>();
        queue.Enqueue(root);
        var seen = 0;
        while (queue.Count > 0 && seen++ < maximum)
        {
            var node = queue.Dequeue();
            yield return node;
            foreach (var child in node.Children)
            {
                queue.Enqueue(child);
            }
        }
    }
}

public sealed record IdentityDecision(bool Trusted, bool SafeDesktop, string Reason);

public static class IdentityPolicy
{
    public static IdentityDecision Evaluate(ProcessIdentitySnapshot identity, string provider)
    {
        var executable = Path.GetFileName(identity.ExecutablePath);
        var safeDesktop = !identity.IsElevated && !identity.IsSecureDesktop &&
            !identity.IntegrityLevel.Equals("high", StringComparison.OrdinalIgnoreCase) &&
            !identity.IntegrityLevel.Equals("system", StringComparison.OrdinalIgnoreCase);

        bool trusted;
        switch (provider)
        {
            case "claudeDesktop":
                trusted = identity.PackageFamilyName.Equals(
                              "Claude_pzs8sxrjxfjjc", StringComparison.OrdinalIgnoreCase) ||
                          (identity.SignatureValid && executable.Equals("claude.exe", StringComparison.OrdinalIgnoreCase) &&
                           identity.Publisher.Contains("Anthropic", StringComparison.OrdinalIgnoreCase));
                break;
            case "claudeChrome":
                trusted = identity.SignatureValid &&
                          executable.Equals("chrome.exe", StringComparison.OrdinalIgnoreCase) &&
                          identity.Publisher.Contains("Google", StringComparison.OrdinalIgnoreCase) &&
                          CanonicalChromePath(identity.ExecutablePath);
                break;
            case "chatgptDesktop":
                trusted = identity.PackageFamilyName.Equals(
                              "OpenAI.Codex_2p2nqsd0c76g0", StringComparison.OrdinalIgnoreCase) ||
                          identity.PackageFamilyName.Equals(
                              "OpenAI.ChatGPT-Desktop_2p2nqsd0c76g0", StringComparison.OrdinalIgnoreCase) ||
                          (identity.SignatureValid && identity.Publisher.Contains("OpenAI", StringComparison.OrdinalIgnoreCase) &&
                           (executable.Equals("chatgpt.exe", StringComparison.OrdinalIgnoreCase) ||
                            executable.Equals("chatgpt classic.exe", StringComparison.OrdinalIgnoreCase)));
                break;
            case "chatgptBrowser":
                trusted = false;
                break;
            case "syntheticTest":
                trusted = identity.ProcessName.Equals("synthetic-harness", StringComparison.OrdinalIgnoreCase);
                break;
            default:
                trusted = false;
                break;
        }

        var reason = trusted
            ? safeDesktop ? "Identity and desktop integrity passed." : "Elevated or secure surfaces are never automated."
            : "Process name alone is insufficient; package/signer/path validation failed.";
        return new IdentityDecision(trusted, safeDesktop, reason);
    }

    private static bool CanonicalChromePath(string path)
    {
        try
        {
            var full = Path.GetFullPath(path);
            var programFiles = new[]
            {
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
            };
            return programFiles.Where(root => !string.IsNullOrWhiteSpace(root)).Any(root =>
                full.StartsWith(Path.Combine(root, "Google", "Chrome"), StringComparison.OrdinalIgnoreCase));
        }
        catch
        {
            return false;
        }
    }
}

public sealed class DedupeCache
{
    private readonly Dictionary<string, DateTimeOffset> _entries = new(StringComparer.Ordinal);
    private readonly TimeSpan _ttl;

    public DedupeCache(TimeSpan? ttl = null) => _ttl = ttl ?? TimeSpan.FromSeconds(8);

    public bool TryAdd(string fingerprint, DateTimeOffset now)
    {
        foreach (var expired in _entries.Where(pair => now - pair.Value > _ttl).Select(pair => pair.Key).ToArray())
        {
            _entries.Remove(expired);
        }
        if (_entries.ContainsKey(fingerprint)) return false;
        _entries[fingerprint] = now;
        return true;
    }

    public static string Fingerprint(
        ProviderSurfaceSnapshot surface,
        RecognitionDecision decision) =>
        string.Join('|', decision.Provider, surface.Identity.ProcessId, surface.Hwnd,
            decision.CardRuntimeId, decision.ButtonRuntimeId, decision.SanitizedLabel.ToLowerInvariant());
}
