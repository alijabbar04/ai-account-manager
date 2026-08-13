using System.Collections.Immutable;
using System.Diagnostics;
using System.Security.Principal;
using System.Text.Json;

namespace AIAccountManager.Automation;

internal static class Program
{
    [STAThread]
    private static async Task<int> Main(string[] args)
    {
        try
        {
            var sid = WindowsIdentity.GetCurrent().User?.Value ?? Environment.UserName;
            var mutexName = $"Local\\AIAccountManager.Automation.{StableName(sid)}";
            using var mutex = new Mutex(true, mutexName, out var createdNew);
            if (!createdNew)
            {
                Console.Error.WriteLine("An automation host is already running for this Windows user.");
                return 2;
            }

            var catalog = SelectorCatalogLoader.Load();
            var audit = new AuditStore();
            using var engine = new AutomationEventEngine(catalog, audit);
            if (TryArgument(args, "--pipe", out var pipeName))
            {
                if (!TryArgument(args, "--parent-pid", out var parentRaw) ||
                    !int.TryParse(parentRaw, out var parentProcessId) || parentProcessId <= 0)
                    throw new ArgumentException("--parent-pid is required in IPC mode.");
                var secret = Environment.GetEnvironmentVariable("AAM_AUTOMATION_SECRET");
                if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
                    throw new UnauthorizedAccessException("IPC secret was not supplied securely.");
                await using var server = new IpcServer(pipeName, secret, parentProcessId, engine, audit);
                using var cancellation = new CancellationTokenSource();
                Console.CancelKeyPress += (_, eventArgs) =>
                {
                    eventArgs.Cancel = true;
                    cancellation.Cancel();
                };
                await server.RunAsync(cancellation.Token);
                return 0;
            }

            if (args.Contains("--diagnostics", StringComparer.OrdinalIgnoreCase))
            {
                engine.Start();
                await Task.Delay(150);
                WriteJson(engine.Diagnostics());
                return 0;
            }
            if (args.Contains("--inspect", StringComparer.OrdinalIgnoreCase))
            {
                engine.Start();
                Console.Error.WriteLine("Hover the provider permission card; inspection starts in 3 seconds.");
                WriteJson(engine.InspectWindowUnderCursor());
                return 0;
            }
            if (TryArgument(args, "--performance-soak", out var secondsRaw))
            {
                var seconds = int.TryParse(secondsRaw, out var parsed) ? Math.Clamp(parsed, 3, 600) : 10;
                return await PerformanceSoak(engine, catalog, seconds);
            }
            if (args.Contains("--dry-run", StringComparer.OrdinalIgnoreCase) ||
                args.Contains("--approve-next", StringComparer.OrdinalIgnoreCase))
            {
                var live = args.Contains("--approve-next", StringComparer.OrdinalIgnoreCase);
                var providers = catalog.Providers.ToDictionary(
                    item => item.Id,
                    _ => new ProviderSetting(true, "uia-fallback"),
                    StringComparer.OrdinalIgnoreCase);
                engine.Configure(new HostSettings(true, !live, 150, 5_000, 30, null, catalog.Revision, providers));
                engine.Start();
                using var cancellation = new CancellationTokenSource();
                if (live)
                {
                    var completion = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
                    engine.Activity += record =>
                    {
                        WriteJson(record);
                        if (record.Result is "success" or "invoke-unavailable" or "revalidation-failed") completion.TrySetResult();
                    };
                    await completion.Task.WaitAsync(TimeSpan.FromMinutes(5));
                }
                else
                {
                    Console.CancelKeyPress += (_, eventArgs) =>
                    {
                        eventArgs.Cancel = true;
                        cancellation.Cancel();
                    };
                    await Task.Delay(Timeout.Infinite, cancellation.Token).ContinueWith(_ => { }, TaskScheduler.Default);
                }
                return 0;
            }

            Console.WriteLine("AI Account Manager automation host");
            Console.WriteLine("  --diagnostics | --inspect | --dry-run | --approve-next | --performance-soak <seconds>");
            return 0;
        }
        catch (TimeoutException)
        {
            Console.Error.WriteLine("Timed out waiting for a valid provider permission card.");
            return 3;
        }
        catch (OperationCanceledException)
        {
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(Redactor.Text(error.Message, 200));
            return 1;
        }
    }

    private static async Task<int> PerformanceSoak(
        AutomationEventEngine engine,
        SelectorCatalog catalog,
        int seconds)
    {
        var providers = catalog.Providers.ToDictionary(
            item => item.Id,
            _ => new ProviderSetting(true, "dry-run"),
            StringComparer.OrdinalIgnoreCase);
        engine.Configure(new HostSettings(true, true, 150, 5_000, 30, null, catalog.Revision, providers));
        using var process = Process.GetCurrentProcess();
        engine.Start();
        const int warmupSeconds = 5;
        await Task.Delay(TimeSpan.FromSeconds(warmupSeconds));
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        process.Refresh();
        var beforeCpu = process.TotalProcessorTime;
        var beforeHandles = process.HandleCount;
        await Task.Delay(TimeSpan.FromSeconds(seconds));
        process.Refresh();
        var cpu = process.TotalProcessorTime - beforeCpu;
        var cpuPercent = cpu.TotalMilliseconds / (seconds * 1_000d * Environment.ProcessorCount) * 100d;
        WriteJson(new
        {
            warmupSeconds,
            seconds,
            averageCpuPercent = Math.Round(cpuPercent, 3),
            workingSetBytes = process.WorkingSet64,
            privateBytes = process.PrivateMemorySize64,
            handles = process.HandleCount,
            handleDelta = process.HandleCount - beforeHandles,
            threads = process.Threads.Count,
            status = engine.Status(),
        });
        return 0;
    }

    private static bool TryArgument(string[] args, string name, out string value)
    {
        var index = Array.FindIndex(args, item => item.Equals(name, StringComparison.OrdinalIgnoreCase));
        if (index >= 0 && index + 1 < args.Length)
        {
            value = args[index + 1];
            return true;
        }
        value = string.Empty;
        return false;
    }

    private static string StableName(string value)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes.AsSpan(0, 12));
    }

    private static void WriteJson(object value) =>
        Console.WriteLine(JsonSerializer.Serialize(value, JsonOptions.Default));
}
