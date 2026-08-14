using System.Collections.Immutable;
using System.Windows.Automation;

namespace AIAccountManager.Automation;

public static class UiaSnapshotCapture
{
    public static ProviderSurfaceSnapshot? CaptureWindow(
        IntPtr hwnd,
        int maxDepth = 8,
        int maxNodes = 260,
        ProcessIdentitySnapshot? knownIdentity = null)
    {
        if (hwnd == IntPtr.Zero) return null;
        try
        {
            WindowsNative.GetWindowThreadProcessId(hwnd, out var rawProcessId);
            if (rawProcessId == 0) return null;
            if (knownIdentity is not null && knownIdentity.ProcessId != (int)rawProcessId) return null;
            var element = AutomationElement.FromHandle(hwnd);
            if (element is null) return null;
            var remaining = Math.Clamp(maxNodes, 1, 2_000);
            var root = CaptureNode(element, 0, Math.Clamp(maxDepth, 1, 20), ref remaining);
            var identity = knownIdentity ?? WindowsNative.CaptureIdentity((int)rawProcessId);
            return new ProviderSurfaceSnapshot(
                string.Empty,
                hwnd.ToInt64(),
                WindowsNative.WindowTitle(hwnd),
                identity,
                root);
        }
        catch (ElementNotAvailableException)
        {
            return null;
        }
        catch (InvalidOperationException)
        {
            return null;
        }
    }

    public static ProviderSurfaceSnapshot? CaptureWindowCandidates(
        IntPtr hwnd,
        ProviderSelector selector,
        ProcessIdentitySnapshot? knownIdentity = null)
    {
        if (hwnd == IntPtr.Zero) return null;
        try
        {
            WindowsNative.GetWindowThreadProcessId(hwnd, out var rawProcessId);
            if (rawProcessId == 0) return null;
            if (knownIdentity is not null && knownIdentity.ProcessId != (int)rawProcessId) return null;
            var element = AutomationElement.FromHandle(hwnd);
            if (element is null) return null;

            var identity = knownIdentity ?? WindowsNative.CaptureIdentity((int)rawProcessId);
            var shallowRemaining = 1;
            var root = CaptureNode(element, 0, 1, ref shallowRemaining);
            var children = ImmutableArray.CreateBuilder<AccessibleNodeSnapshot>();
            var contexts = FindNamedElements(element, selector.ContextNames, 16);
            foreach (var context in contexts)
            {
                if (RuntimeId(context).Equals(root.RuntimeId, StringComparison.Ordinal)) continue;
                shallowRemaining = 1;
                children.Add(CaptureNode(context, 0, 1, ref shallowRemaining));
            }

            // Permission prompts and their actions are exposed as buttons in
            // Chromium-backed Claude surfaces. Querying that semantic control
            // type avoids walking the full conversation tree while still
            // allowing a stable prefix such as "Claude wants to use ...".
            var actionElements = FindElementsByControlType(element, ControlType.Button, 512);
            var seenPairs = new HashSet<string>(StringComparer.Ordinal);
            var prompts = actionElements.Where(candidate =>
                    NameMatchesAny(Safe(() => candidate.Current.Name, string.Empty), selector.PromptNames))
                .ToArray();
            var allowButtons = actionElements.Where(candidate =>
                    NameMatchesAny(Safe(() => candidate.Current.Name, string.Empty), selector.AllowNames))
                .Where(IsActionable)
                .ToArray();
            foreach (var button in allowButtons)
            {
                var candidates = prompts
                    .Select(prompt => (Prompt: prompt, Match: FindBoundedCommonAncestor(element, prompt, button, 8)))
                    .Where(candidate => candidate.Match is not null)
                    .Select(candidate => (candidate.Prompt, Match: candidate.Match!))
                    .OrderBy(candidate => candidate.Match.CombinedHops)
                    .ToArray();
                if (candidates.Length == 0) continue;
                var nearest = candidates[0];
                if (candidates.Skip(1).Any(candidate =>
                        candidate.Match.CombinedHops == nearest.Match.CombinedHops &&
                        !RuntimeId(candidate.Prompt).Equals(RuntimeId(nearest.Prompt), StringComparison.Ordinal)))
                {
                    // Two equally close prompts make the requested action
                    // ambiguous, so this button is deliberately ignored.
                    continue;
                }
                var promptId = RuntimeId(nearest.Prompt);
                var buttonId = RuntimeId(button);
                if (!seenPairs.Add($"{promptId}|{buttonId}")) continue;

                shallowRemaining = 1;
                var promptNode = CaptureNode(nearest.Prompt, 0, 1, ref shallowRemaining);
                shallowRemaining = 1;
                var buttonNode = CaptureNode(button, 0, 1, ref shallowRemaining);
                shallowRemaining = 1;
                var ancestorNode = CaptureNode(nearest.Match.Element, 0, 1, ref shallowRemaining);
                children.Add(ancestorNode with { Children = [promptNode, buttonNode] });
            }

            return new ProviderSurfaceSnapshot(
                string.Empty,
                hwnd.ToInt64(),
                WindowsNative.WindowTitle(hwnd),
                identity,
                root with { Children = children.ToImmutable() });
        }
        catch (ElementNotAvailableException)
        {
            return null;
        }
        catch (InvalidOperationException)
        {
            return null;
        }
    }

    public static AccessibleNodeSnapshot CaptureNode(
        AutomationElement element,
        int depth,
        int maxDepth,
        ref int remaining)
    {
        remaining--;
        var name = Safe(() => element.Current.Name);
        var automationId = Safe(() => element.Current.AutomationId);
        var controlType = Safe(() => element.Current.ControlType.ProgrammaticName.Replace("ControlType.", string.Empty));
        var runtimeId = RuntimeId(element);
        var isEnabled = Safe(() => element.Current.IsEnabled, false);
        var isOffscreen = Safe(() => element.Current.IsOffscreen, true);
        var children = ImmutableArray.CreateBuilder<AccessibleNodeSnapshot>();

        if (remaining > 0 && depth < maxDepth)
        {
            AutomationElement? child = null;
            try
            {
                child = TreeWalker.RawViewWalker.GetFirstChild(element);
            }
            catch (ElementNotAvailableException) { }
            while (child is not null && remaining > 0)
            {
                children.Add(CaptureNode(child, depth + 1, maxDepth, ref remaining));
                try
                {
                    child = TreeWalker.RawViewWalker.GetNextSibling(child);
                }
                catch (ElementNotAvailableException)
                {
                    break;
                }
            }
        }

        return new AccessibleNodeSnapshot(
            Redactor.Text(name, 120),
            Redactor.Text(automationId, 100),
            Redactor.Label(controlType, 60),
            runtimeId,
            isEnabled,
            isOffscreen,
            children.ToImmutable());
    }

    public static string RuntimeId(AutomationElement element)
    {
        try
        {
            return string.Join('.', element.GetRuntimeId());
        }
        catch
        {
            return string.Empty;
        }
    }

    public static AutomationElement? FindByRuntimeId(AutomationElement root, string runtimeId, int maximum = 1_600)
    {
        var queue = new Queue<AutomationElement>();
        queue.Enqueue(root);
        var seen = 0;
        while (queue.Count > 0 && seen++ < maximum)
        {
            var element = queue.Dequeue();
            if (RuntimeId(element).Equals(runtimeId, StringComparison.Ordinal)) return element;
            try
            {
                var child = TreeWalker.RawViewWalker.GetFirstChild(element);
                while (child is not null)
                {
                    queue.Enqueue(child);
                    child = TreeWalker.RawViewWalker.GetNextSibling(child);
                }
            }
            catch (ElementNotAvailableException) { }
        }
        return null;
    }

    public static bool InvokeValidatedButton(
        IntPtr hwnd,
        int expectedProcessId,
        string runtimeId,
        ImmutableArray<string> allowNames,
        out string method)
    {
        method = string.Empty;
        try
        {
            WindowsNative.GetWindowThreadProcessId(hwnd, out var currentProcessId);
            if (currentProcessId == 0 || currentProcessId != expectedProcessId) return false;
            var root = AutomationElement.FromHandle(hwnd);
            var button = FindNamedElements(root, allowNames, 512)
                .FirstOrDefault(candidate => RuntimeId(candidate).Equals(runtimeId, StringComparison.Ordinal));
            if (button is null || !button.Current.IsEnabled || button.Current.IsOffscreen) return false;
            if (button.TryGetCurrentPattern(InvokePattern.Pattern, out var invokeObject) &&
                invokeObject is InvokePattern invoke)
            {
                invoke.Invoke();
                method = "uia-invoke";
                return true;
            }
            if (button.TryGetCurrentPattern(SelectionItemPattern.Pattern, out var selectionObject) &&
                selectionObject is SelectionItemPattern selection)
            {
                selection.Select();
                method = "uia-selection";
                return true;
            }
        }
        catch (ElementNotAvailableException) { }
        catch (InvalidOperationException) { }
        return false;
    }

    private static AutomationElement[] FindNamedElements(
        AutomationElement root,
        IEnumerable<string> names,
        int maximum)
    {
        var conditions = names
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(name => (Condition)new PropertyCondition(
                AutomationElement.NameProperty,
                name,
                PropertyConditionFlags.IgnoreCase))
            .ToArray();
        if (conditions.Length == 0) return [];
        var condition = conditions.Length == 1 ? conditions[0] : new OrCondition(conditions);
        var matches = root.FindAll(TreeScope.Subtree, condition);
        return matches.Cast<AutomationElement>().Take(maximum).ToArray();
    }

    private static AutomationElement[] FindElementsByControlType(
        AutomationElement root,
        ControlType controlType,
        int maximum)
    {
        var condition = new PropertyCondition(AutomationElement.ControlTypeProperty, controlType);
        var matches = root.FindAll(TreeScope.Subtree, condition);
        return matches.Cast<AutomationElement>().Take(maximum).ToArray();
    }

    private static bool NameMatchesAny(string name, ImmutableArray<string> expected)
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

    private sealed record CommonAncestorMatch(AutomationElement Element, int CombinedHops);

    private static CommonAncestorMatch? FindBoundedCommonAncestor(
        AutomationElement root,
        AutomationElement first,
        AutomationElement second,
        int maximumHops)
    {
        var rootId = RuntimeId(root);
        var firstAncestors = Ancestors(first, maximumHops)
            .Where(item => !item.Id.Equals(rootId, StringComparison.Ordinal))
            .ToDictionary(item => item.Id, item => item, StringComparer.Ordinal);
        foreach (var candidate in Ancestors(second, maximumHops))
        {
            if (candidate.Id.Equals(rootId, StringComparison.Ordinal)) continue;
            if (firstAncestors.TryGetValue(candidate.Id, out var firstCandidate) &&
                firstCandidate.Hops + candidate.Hops <= maximumHops * 2)
            {
                return new CommonAncestorMatch(candidate.Element, firstCandidate.Hops + candidate.Hops);
            }
        }
        return null;
    }

    private static IEnumerable<(AutomationElement Element, string Id, int Hops)> Ancestors(
        AutomationElement element,
        int maximumHops)
    {
        var current = element;
        for (var hops = 1; hops <= maximumHops; hops++)
        {
            current = Parent(current);
            if (current is null) yield break;
            var id = RuntimeId(current);
            if (!string.IsNullOrWhiteSpace(id)) yield return (current, id, hops);
        }
    }

    private static AutomationElement? Parent(AutomationElement element)
    {
        try
        {
            return TreeWalker.ControlViewWalker.GetParent(element) ??
                TreeWalker.RawViewWalker.GetParent(element);
        }
        catch (ElementNotAvailableException)
        {
            return null;
        }
        catch (InvalidOperationException)
        {
            return null;
        }
    }

    private static bool IsActionable(AutomationElement element) =>
        Safe(() => element.Current.IsEnabled, false) &&
        !Safe(() => element.Current.IsOffscreen, true) &&
        Safe(() => element.Current.ControlType == ControlType.Button ||
            element.Current.ControlType == ControlType.MenuItem ||
            element.Current.ControlType == ControlType.Hyperlink, false);

    private static T Safe<T>(Func<T> get, T fallback = default!)
    {
        try { return get(); }
        catch (ElementNotAvailableException) { return fallback; }
        catch (InvalidOperationException) { return fallback; }
    }
}
