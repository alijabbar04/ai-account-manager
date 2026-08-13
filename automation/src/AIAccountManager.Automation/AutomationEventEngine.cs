using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Diagnostics;
using System.Windows.Automation;
using System.Windows.Threading;

namespace AIAccountManager.Automation;

public sealed class AutomationEventEngine : IDisposable
{
    private sealed record CachedProcessIdentity(long StartTicks, long ExpiresAt, ProcessIdentitySnapshot Identity);

    private readonly SelectorCatalog _catalog;
    private readonly RecognitionEngine _recognizer = new();
    private readonly DedupeCache _dedupe = new();
    private readonly AuditStore _audit;
    private readonly ConcurrentDictionary<long, long> _pendingWindows = new();
    private readonly ConcurrentDictionary<long, long> _lastWindowScans = new();
    private readonly ConcurrentDictionary<int, CachedProcessIdentity> _identityCache = new();
    private readonly ConcurrentDictionary<int, (long ExpiresAt, bool Relevant)> _relevantProcessCache = new();
    private readonly object _settingsGate = new();
    private readonly ManualResetEventSlim _started = new(false);
    private Thread? _thread;
    private Dispatcher? _dispatcher;
    private DispatcherTimer? _workTimer;
    private DispatcherTimer? _pollTimer;
    private HostSettings _settings = HostSettings.SafeDefaults;
    private WindowsNative.WinEventDelegate? _winEventDelegate;
    private AutomationEventHandler? _uiaWindowHandler;
    private IntPtr _objectHook;
    private IntPtr _foregroundHook;
    private long _eventsSeen;
    private long _scans;
    private long _matches;
    private long _invocations;
    private long _errors;
    private string? _lastError;
    private bool _disposed;

    public event Action<AuditRecord>? Activity;

    public AutomationEventEngine(SelectorCatalog catalog, AuditStore audit)
    {
        _catalog = catalog;
        _audit = audit;
    }

    public void Configure(HostSettings settings)
    {
        lock (_settingsGate)
        {
            _settings = settings.Sanitize();
            _audit.SetRetention(_settings.LogRetentionDays);
        }
        _dispatcher?.BeginInvoke(() =>
        {
            if (_pollTimer is not null)
            {
                _pollTimer.Interval = TimeSpan.FromMilliseconds(CurrentSettings().FallbackPollMs);
            }
        });
    }

    public void Start()
    {
        if (_thread?.IsAlive == true) return;
        _thread = new Thread(RunSta)
        {
            IsBackground = true,
            Name = "AI Account Manager UIA STA",
        };
        _thread.SetApartmentState(ApartmentState.STA);
        _thread.Start();
        if (!_started.Wait(TimeSpan.FromSeconds(5)))
            throw new TimeoutException("The UI Automation STA did not start in time.");
    }

    public void Stop()
    {
        _dispatcher?.BeginInvokeShutdown(DispatcherPriority.Send);
        if (_thread is not null && _thread != Thread.CurrentThread)
        {
            _thread.Join(TimeSpan.FromSeconds(5));
        }
        _thread = null;
        _dispatcher = null;
        _started.Reset();
    }

    public HostStatus Status()
    {
        var settings = CurrentSettings();
        var state = !settings.AutomationEnabled
            ? "Off"
            : settings.IsPaused
                ? "Paused"
                : settings.DryRun
                    ? "Dry run"
                    : _lastError is not null
                        ? "Needs attention"
                        : "Monitoring";
        return new HostStatus(
            state,
            _thread?.IsAlive == true,
            settings.DryRun,
            settings.PausedUntil,
            Interlocked.Read(ref _eventsSeen),
            Interlocked.Read(ref _scans),
            Interlocked.Read(ref _matches),
            Interlocked.Read(ref _invocations),
            Interlocked.Read(ref _errors),
            _catalog.Revision,
            _lastError);
    }

    public DiagnosticReport Diagnostics(bool includeUnknown = false)
    {
        return InvokeOnSta(() => DiagnosticsCore(includeUnknown));
    }

    private DiagnosticReport DiagnosticsCore(bool includeUnknown)
    {
        var elements = ImmutableArray.CreateBuilder<DiagnosticElement>();
        foreach (var hwnd in WindowsNative.TopLevelWindows())
        {
            var surface = UiaSnapshotCapture.CaptureWindow(hwnd, 5, 100);
            if (surface is null) continue;
            var decisions = _catalog.Providers.Select(selector => _recognizer.Evaluate(surface, selector)).ToArray();
            var candidateSelectors = decisions
                .Where(decision =>
                    decision.Signals.Any(signal => signal.Name == "trusted process/package identity" && signal.Passed) &&
                    decision.Signals.Any(signal => signal.Name == "provider window or side-panel context" && signal.Passed))
                .Select(decision => _catalog.Providers.First(selector => selector.Id == decision.Provider))
                .ToArray();
            var relevant = candidateSelectors.Length > 0;
            if (!includeUnknown && !relevant) continue;
            foreach (var node in RecognitionEngine.Traverse(surface.Root, 100))
            {
                if (string.IsNullOrWhiteSpace(node.Name) && string.IsNullOrWhiteSpace(node.AutomationId)) continue;
                if (!includeUnknown && !DiagnosticNameMatches(node.Name, candidateSelectors)) continue;
                elements.Add(new DiagnosticElement(
                    surface.Identity.ProcessId,
                    $"0x{surface.Hwnd:X}",
                    surface.Identity.PackageFamilyName,
                    surface.Identity.Publisher,
                    surface.Identity.SignatureValid,
                    node.ControlType,
                    Redactor.Text(node.Name, 120),
                    Redactor.Text(node.AutomationId, 100),
                    node.RuntimeId,
                    string.Join("; ", decisions.Select(decision => $"{decision.Provider}: {decision.Reason}"))));
            }
        }
        return new DiagnosticReport(
            DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            _catalog.Revision,
            elements.Take(500).ToImmutableArray(),
            [
                "Names, paths, emails, URLs, and token-like strings are redacted and bounded.",
                "No prompt bodies, page contents, typed values, cookies, or credentials are collected.",
            ]);
    }

    private static bool DiagnosticNameMatches(string name, IEnumerable<ProviderSelector> selectors)
    {
        if (string.IsNullOrWhiteSpace(name)) return false;
        return selectors.SelectMany(selector => selector.ContextNames
                .Concat(selector.PromptNames)
                .Concat(selector.AllowNames))
            .Any(expected =>
                name.Equals(expected, StringComparison.OrdinalIgnoreCase) ||
                name.StartsWith(expected + " ", StringComparison.OrdinalIgnoreCase));
    }

    public DiagnosticReport InspectWindowUnderCursor(int delayMilliseconds = 3_000)
    {
        Thread.Sleep(Math.Clamp(delayMilliseconds, 0, 10_000));
        return InvokeOnSta(InspectWindowUnderCursorCore);
    }

    private DiagnosticReport InspectWindowUnderCursorCore()
    {
        if (!WindowsNative.GetCursorPos(out var point))
            throw new InvalidOperationException("Could not read the cursor location.");
        var hwnd = WindowsNative.WindowFromPoint(point);
        var surface = UiaSnapshotCapture.CaptureWindow(hwnd, 7, 240)
            ?? throw new InvalidOperationException("No accessible window was found under the cursor.");
        var decisions = _catalog.Providers.Select(selector => _recognizer.Evaluate(surface, selector)).ToArray();
        var elements = RecognitionEngine.Traverse(surface.Root, 240)
            .Select(node => new DiagnosticElement(
                surface.Identity.ProcessId,
                $"0x{surface.Hwnd:X}",
                surface.Identity.PackageFamilyName,
                surface.Identity.Publisher,
                surface.Identity.SignatureValid,
                node.ControlType,
                Redactor.Text(node.Name, 120),
                Redactor.Text(node.AutomationId, 100),
                node.RuntimeId,
                string.Join("; ", decisions.Select(decision => $"{decision.Provider}: {decision.Reason}"))))
            .ToImmutableArray();
        return new DiagnosticReport(
            DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            _catalog.Revision,
            elements,
            ["Bounded subtree captured from the window under the cursor after the inspection delay."]);
    }

    public async Task<(bool Ok, string Message)> ApplyClaudeNativeModeAsync(string mode)
    {
        var targetName = mode switch
        {
            "auto" => "Automatically approve",
            "skip" => "Skip all approvals",
            "manual" => "Manually approve",
            _ => throw new ArgumentOutOfRangeException(nameof(mode)),
        };
        return await InvokeOnStaAsync(() =>
        {
            var selector = _catalog.Providers.First(item => item.Id == "claudeDesktop");
            foreach (var hwnd in WindowsNative.TopLevelWindows())
            {
                var surface = UiaSnapshotCapture.CaptureWindow(hwnd, 8, 320);
                if (surface is null) continue;
                var identity = IdentityPolicy.Evaluate(surface.Identity, selector.Id);
                if (!identity.Trusted || !identity.SafeDesktop) continue;
                try
                {
                    var root = AutomationElement.FromHandle(hwnd);
                    var condition = new PropertyCondition(AutomationElement.NameProperty, targetName);
                    var element = root.FindFirst(TreeScope.Subtree, condition);
                    if (element is null) continue;
                    var runtimeId = UiaSnapshotCapture.RuntimeId(element);
                    if (UiaSnapshotCapture.InvokeValidatedButton(hwnd, runtimeId, out var method))
                    {
                        Record(surface, new RecognitionDecision(true, selector.Id,
                            "Explicit native mode action", 100, runtimeId, runtimeId,
                            targetName, true,
                            [new ConfidenceSignal("trusted Claude package/signer", true)]),
                            "apply-native-mode", method, "success", false, 0, string.Empty, 0);
                        return (true, $"Selected {targetName}.");
                    }
                }
                catch (ElementNotAvailableException) { }
            }
            return (false,
                $"{targetName} is not currently exposed in a trusted Claude window. Open the mode menu and retry.");
        });
    }

    private void RunSta()
    {
        _dispatcher = Dispatcher.CurrentDispatcher;
        _started.Set();
        _winEventDelegate = OnWinEvent;
        _objectHook = WindowsNative.SetWinEventHook(
            WindowsNative.EventObjectShow,
            WindowsNative.EventObjectNameChange,
            IntPtr.Zero,
            _winEventDelegate,
            0,
            0,
            WindowsNative.WineventOutOfContext);
        _foregroundHook = WindowsNative.SetWinEventHook(
            WindowsNative.EventSystemForeground,
            WindowsNative.EventSystemForeground,
            IntPtr.Zero,
            _winEventDelegate,
            0,
            0,
            WindowsNative.WineventOutOfContext);
        _uiaWindowHandler = (_, args) =>
        {
            if (args.EventId != WindowPattern.WindowOpenedEvent) return;
            if (_ is AutomationElement element)
            {
                try
                {
                    QueueWindow(new IntPtr(element.Current.NativeWindowHandle));
                }
                catch (ElementNotAvailableException) { }
            }
        };
        try
        {
            System.Windows.Automation.Automation.AddAutomationEventHandler(
                WindowPattern.WindowOpenedEvent,
                AutomationElement.RootElement,
                TreeScope.Subtree,
                _uiaWindowHandler);
        }
        catch (Exception error)
        {
            SetError("uia-event-registration", error);
        }

        _workTimer = new DispatcherTimer(TimeSpan.FromMilliseconds(125), DispatcherPriority.Background,
            (_, _) => ProcessPending(), _dispatcher);
        _pollTimer = new DispatcherTimer(
            TimeSpan.FromMilliseconds(CurrentSettings().FallbackPollMs),
            DispatcherPriority.ApplicationIdle,
            (_, _) => PollRelevantWindows(),
            _dispatcher);
        _workTimer.Start();
        _pollTimer.Start();
        Dispatcher.Run();

        _workTimer.Stop();
        _pollTimer.Stop();
        if (_uiaWindowHandler is not null)
        {
            try
            {
                System.Windows.Automation.Automation.RemoveAutomationEventHandler(
                    WindowPattern.WindowOpenedEvent,
                    AutomationElement.RootElement,
                    _uiaWindowHandler);
            }
            catch { }
        }
        if (_objectHook != IntPtr.Zero) WindowsNative.UnhookWinEvent(_objectHook);
        if (_foregroundHook != IntPtr.Zero) WindowsNative.UnhookWinEvent(_foregroundHook);
        _objectHook = IntPtr.Zero;
        _foregroundHook = IntPtr.Zero;
    }

    private void OnWinEvent(
        IntPtr hook,
        uint eventType,
        IntPtr hwnd,
        int objectId,
        int childId,
        uint eventThread,
        uint eventTime)
    {
        if (hwnd == IntPtr.Zero) return;
        if (eventType != WindowsNative.EventSystemForeground &&
            eventType != WindowsNative.EventObjectShow &&
            eventType != WindowsNative.EventObjectNameChange) return;
        if (eventType != WindowsNative.EventSystemForeground &&
            objectId != WindowsNative.ObjidWindow && objectId != WindowsNative.ObjidClient) return;
        QueueWindow(hwnd);
    }

    private void QueueWindow(IntPtr hwnd)
    {
        var root = WindowsNative.GetAncestor(hwnd, WindowsNative.GaRoot);
        if (root != IntPtr.Zero) hwnd = root;
        WindowsNative.GetWindowThreadProcessId(hwnd, out var rawProcessId);
        if (rawProcessId == 0 || !IsRelevantProcess((int)rawProcessId)) return;
        Interlocked.Increment(ref _eventsSeen);
        _pendingWindows[hwnd.ToInt64()] = Environment.TickCount64;
    }

    private bool IsRelevantProcess(int processId)
    {
        var now = Environment.TickCount64;
        if (_relevantProcessCache.TryGetValue(processId, out var cached) && cached.ExpiresAt > now)
            return cached.Relevant;
        try
        {
            using var process = Process.GetProcessById(processId);
            var relevant = IsRelevantProcessName(process.ProcessName);
            _relevantProcessCache[processId] = (now + 5_000, relevant);
            return relevant;
        }
        catch
        {
            _relevantProcessCache.TryRemove(processId, out _);
            return false;
        }
    }

    private bool IsRelevantProcessName(string processName)
    {
        var providerIds = processName.ToLowerInvariant() switch
        {
            "claude" => new[] { "claudeDesktop" },
            "chrome" => new[] { "claudeChrome", "chatgptBrowser" },
            "chatgpt" or "chatgpt classic" => new[] { "chatgptDesktop" },
            _ => [],
        };
        var settings = CurrentSettings();
        return _catalog.Providers.Any(selector =>
            providerIds.Contains(selector.Id, StringComparer.OrdinalIgnoreCase) &&
            !selector.PromptNames.IsDefaultOrEmpty &&
            !selector.AllowNames.IsDefaultOrEmpty &&
            settings.Providers.TryGetValue(selector.Id, out var provider) &&
            provider.UsesUia);
    }

    private void ProcessPending()
    {
        // Provider apps can emit several accessible-name changes for a single
        // render. A half-second quiet window coalesces those bursts while the
        // polling watchdog still guarantees eventual recovery.
        var cutoff = Environment.TickCount64 - 500;
        var now = Environment.TickCount64;
        foreach (var stale in _lastWindowScans.Where(pair => now - pair.Value > 600_000).Select(pair => pair.Key).ToArray())
            _lastWindowScans.TryRemove(stale, out _);
        foreach (var entry in _pendingWindows.Where(pair => pair.Value <= cutoff).Take(16).ToArray())
        {
            if (!_pendingWindows.TryRemove(entry.Key, out _)) continue;
            if (_lastWindowScans.TryGetValue(entry.Key, out var last) && now - last < 2_000)
            {
                _pendingWindows[entry.Key] = now;
                continue;
            }
            _lastWindowScans[entry.Key] = now;
            ScanWindow(new IntPtr(entry.Key));
        }
    }

    private void PollRelevantWindows()
    {
        var settings = CurrentSettings();
        if (!settings.AutomationEnabled || settings.IsPaused) return;
        var processes = Process.GetProcesses();
        HashSet<int> pids;
        try
        {
            pids = processes
                .Where(process => IsRelevantProcessName(process.ProcessName))
                .Select(process => process.Id)
                .ToHashSet();
        }
        finally
        {
            foreach (var process in processes) process.Dispose();
        }
        if (pids.Count == 0) return;
        foreach (var hwnd in WindowsNative.TopLevelWindows())
        {
            WindowsNative.GetWindowThreadProcessId(hwnd, out var pid);
            if (pids.Contains((int)pid)) QueueWindow(hwnd);
        }
    }

    private void ScanWindow(IntPtr hwnd)
    {
        var settings = CurrentSettings();
        if (!settings.AutomationEnabled || settings.IsPaused) return;
        try
        {
            WindowsNative.GetWindowThreadProcessId(hwnd, out var rawProcessId);
            if (rawProcessId == 0) return;
            var identity = CaptureIdentityCached((int)rawProcessId);
            var enabledSelectors = _catalog.Providers.Where(selector =>
                settings.Providers.TryGetValue(selector.Id, out var provider) &&
                provider.UsesUia &&
                !selector.PromptNames.IsDefaultOrEmpty &&
                !selector.AllowNames.IsDefaultOrEmpty).ToArray();
            if (!enabledSelectors.Any(selector =>
                    IdentityPolicy.Evaluate(identity, selector.Id) is { Trusted: true, SafeDesktop: true })) return;
            Interlocked.Increment(ref _scans);
            var surface = UiaSnapshotCapture.CaptureWindow(hwnd, 8, 260, identity);
            if (surface is null) return;
            foreach (var selector in enabledSelectors)
            {
                if (!settings.Providers.TryGetValue(selector.Id, out var provider) ||
                    !provider.UsesUia) continue;
                var decision = _recognizer.Evaluate(surface, selector);
                if (!decision.IsMatch) continue;
                Interlocked.Increment(ref _matches);
                var fingerprint = DedupeCache.Fingerprint(surface, decision);
                if (!_dedupe.TryAdd(fingerprint, DateTimeOffset.UtcNow)) continue;
                var forcedDryRun = settings.DryRun || provider.Method == "dry-run" || !decision.LiveEligible;
                if (forcedDryRun)
                {
                    Record(surface, decision, "approve", "uia-event", "detected", true, 0,
                        decision.LiveEligible ? string.Empty : "selector-not-live-verified", 0);
                    continue;
                }
                Approve(surface, selector, decision, settings.ApprovalDelayMs);
            }
        }
        catch (Exception error)
        {
            SetError("scan-failed", error);
        }
    }

    private ProcessIdentitySnapshot CaptureIdentityCached(int processId)
    {
        long startTicks;
        try
        {
            using var process = Process.GetProcessById(processId);
            startTicks = process.StartTime.ToUniversalTime().Ticks;
        }
        catch
        {
            return WindowsNative.CaptureIdentity(processId);
        }
        var now = Environment.TickCount64;
        if (_identityCache.TryGetValue(processId, out var cached) &&
            cached.StartTicks == startTicks && cached.ExpiresAt > now)
        {
            return cached.Identity with { IsSecureDesktop = !WindowsNative.IsDefaultInputDesktop() };
        }
        var identity = WindowsNative.CaptureIdentity(processId);
        _identityCache[processId] = new CachedProcessIdentity(startTicks, now + 60_000, identity);
        foreach (var stale in _identityCache.Where(pair => pair.Value.ExpiresAt <= now).Select(pair => pair.Key).ToArray())
            _identityCache.TryRemove(stale, out _);
        return identity;
    }

    private void Approve(
        ProviderSurfaceSnapshot original,
        ProviderSelector selector,
        RecognitionDecision originalDecision,
        int delayMilliseconds)
    {
        var started = Stopwatch.StartNew();
        if (delayMilliseconds > 0) Thread.Sleep(delayMilliseconds);
        var current = CurrentSettings();
        if (!current.AutomationEnabled || current.IsPaused || current.DryRun)
        {
            Record(original, originalDecision, "approve", "uia-event", "cancelled-before-invoke", true, 0,
                "automation-state-changed", started.ElapsedMilliseconds);
            return;
        }
        var refreshed = UiaSnapshotCapture.CaptureWindow(new IntPtr(original.Hwnd));
        if (refreshed is null)
        {
            Record(original, originalDecision, "approve", "uia-event", "disappeared", false, 0,
                "candidate-disappeared", started.ElapsedMilliseconds);
            return;
        }
        var revalidated = _recognizer.Evaluate(refreshed, selector);
        if (!revalidated.IsMatch || revalidated.ButtonRuntimeId != originalDecision.ButtonRuntimeId)
        {
            Record(refreshed, revalidated, "approve", "uia-event", "revalidation-failed", false, 0,
                "candidate-changed", started.ElapsedMilliseconds);
            return;
        }
        var invoked = false;
        var confirmed = false;
        var retryCount = 0;
        var method = string.Empty;
        for (var attempt = 0; attempt < 2; attempt++)
        {
            current = CurrentSettings();
            if (!current.AutomationEnabled || current.IsPaused || current.DryRun)
            {
                Record(refreshed, revalidated, "approve", "uia-event", "cancelled-before-invoke", true,
                    retryCount, "automation-state-changed", started.ElapsedMilliseconds);
                return;
            }
            invoked = UiaSnapshotCapture.InvokeValidatedButton(
                new IntPtr(refreshed.Hwnd), revalidated.ButtonRuntimeId, out method);
            if (!invoked) break;
            Interlocked.Increment(ref _invocations);
            Thread.Sleep(200);
            var confirmation = UiaSnapshotCapture.CaptureWindow(new IntPtr(refreshed.Hwnd));
            if (confirmation is null)
            {
                confirmed = true;
                break;
            }
            var confirmationDecision = _recognizer.Evaluate(confirmation, selector);
            if (!confirmationDecision.IsMatch ||
                confirmationDecision.ButtonRuntimeId != revalidated.ButtonRuntimeId)
            {
                confirmed = true;
                break;
            }
            if (attempt == 0)
            {
                retryCount = 1;
                refreshed = confirmation;
                revalidated = confirmationDecision;
            }
        }
        var result = !invoked
            ? "invoke-unavailable"
            : confirmed
                ? "success"
                : "invoke-not-confirmed";
        var errorCode = !invoked
            ? "no-supported-action-pattern"
            : confirmed
                ? string.Empty
                : "card-still-present-after-retry";
        Record(refreshed, revalidated, "approve", method.Length > 0 ? method : "uia-invoke",
            result, false, retryCount, errorCode, started.ElapsedMilliseconds);
    }

    private void Record(
        ProviderSurfaceSnapshot surface,
        RecognitionDecision decision,
        string requestedAction,
        string method,
        string result,
        bool dryRun,
        int retryCount,
        string errorCode,
        long durationMs)
    {
        var record = _audit.Append(new AuditRecord(
            DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            durationMs,
            decision.Provider,
            _catalog.Providers.FirstOrDefault(item => item.Id == decision.Provider)?.Surface ?? "unknown",
            $"{surface.Identity.ProcessName} pid={surface.Identity.ProcessId}",
            $"hwnd=0x{surface.Hwnd:X}",
            decision.SanitizedLabel,
            requestedAction,
            method,
            result,
            dryRun,
            decision.Signals,
            retryCount,
            errorCode));
        Activity?.Invoke(record);
    }

    private HostSettings CurrentSettings()
    {
        lock (_settingsGate) return _settings;
    }

    private Task<T> InvokeOnStaAsync<T>(Func<T> action)
    {
        if (_dispatcher is null) throw new InvalidOperationException("Automation host is not running.");
        return _dispatcher.InvokeAsync(action, DispatcherPriority.Normal).Task;
    }

    private T InvokeOnSta<T>(Func<T> action)
    {
        var dispatcher = _dispatcher ?? throw new InvalidOperationException("Automation host is not running.");
        return dispatcher.CheckAccess()
            ? action()
            : dispatcher.Invoke(action, DispatcherPriority.Normal);
    }

    private void SetError(string code, Exception error)
    {
        Interlocked.Increment(ref _errors);
        _lastError = $"{code}: {Redactor.Text(error.Message, 120)}";
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        Stop();
        _started.Dispose();
    }
}
