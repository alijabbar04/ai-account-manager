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
            var element = AutomationElement.FromHandle(hwnd);
            if (element is null) return null;
            var remaining = Math.Clamp(maxNodes, 1, 1_000);
            var root = CaptureNode(element, 0, Math.Clamp(maxDepth, 1, 16), ref remaining);
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

    public static AutomationElement? FindByRuntimeId(AutomationElement root, string runtimeId, int maximum = 300)
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

    public static bool InvokeValidatedButton(IntPtr hwnd, string runtimeId, out string method)
    {
        method = string.Empty;
        try
        {
            var root = AutomationElement.FromHandle(hwnd);
            var button = FindByRuntimeId(root, runtimeId);
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

    private static T Safe<T>(Func<T> get, T fallback = default!)
    {
        try { return get(); }
        catch (ElementNotAvailableException) { return fallback; }
        catch (InvalidOperationException) { return fallback; }
    }
}
