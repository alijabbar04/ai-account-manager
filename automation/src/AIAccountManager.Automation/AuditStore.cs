using System.Collections.Immutable;
using System.Text.Json;

namespace AIAccountManager.Automation;

public sealed class AuditStore
{
    private readonly string _directory;
    private readonly object _gate = new();
    private int _retentionDays;

    public AuditStore(string? applicationDataRoot = null, int retentionDays = 30)
    {
        var root = applicationDataRoot ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "ClaudeAccountManager");
        _directory = Path.Combine(root, "automation");
        Directory.CreateDirectory(_directory);
        _retentionDays = Math.Clamp(retentionDays, 1, 365);
        ApplyRetention();
    }

    public void SetRetention(int days)
    {
        _retentionDays = Math.Clamp(days, 1, 365);
        ApplyRetention();
    }

    public AuditRecord Append(AuditRecord value)
    {
        var record = Sanitize(value);
        var file = Path.Combine(_directory, $"activity-{DateTime.UtcNow:yyyy-MM}.jsonl");
        var line = JsonSerializer.Serialize(record, JsonOptions.Default) + Environment.NewLine;
        lock (_gate)
        {
            File.AppendAllText(file, line);
        }
        return record;
    }

    public ImmutableArray<AuditRecord> List(int limit = 500)
    {
        var output = new List<AuditRecord>();
        lock (_gate)
        {
            foreach (var file in Directory.EnumerateFiles(_directory, "activity-*.jsonl")
                         .OrderByDescending(item => item, StringComparer.OrdinalIgnoreCase))
            {
                foreach (var line in File.ReadLines(file).Reverse())
                {
                    try
                    {
                        var value = JsonSerializer.Deserialize<AuditRecord>(line, JsonOptions.Default);
                        if (value is not null) output.Add(Sanitize(value));
                    }
                    catch
                    {
                        // A partial final line after a crash is ignored.
                    }
                    if (output.Count >= Math.Clamp(limit, 1, 5_000)) return output.ToImmutableArray();
                }
            }
        }
        return output.ToImmutableArray();
    }

    public void Clear()
    {
        lock (_gate)
        {
            foreach (var file in Directory.EnumerateFiles(_directory, "activity-*.jsonl"))
            {
                File.Delete(file);
            }
        }
    }

    private void ApplyRetention()
    {
        var cutoff = DateTime.UtcNow.AddDays(-_retentionDays);
        lock (_gate)
        {
            foreach (var file in Directory.EnumerateFiles(_directory, "activity-*.jsonl"))
            {
                if (File.GetLastWriteTimeUtc(file) < cutoff) File.Delete(file);
            }
        }
    }

    private static AuditRecord Sanitize(AuditRecord value) => value with
    {
        DurationMs = Math.Clamp(value.DurationMs, 0, 300_000),
        Provider = Redactor.Label(value.Provider, 40),
        Surface = Redactor.Label(value.Surface, 40),
        Process = Redactor.Text(value.Process, 160),
        Window = Redactor.Text(value.Window, 120),
        Label = Redactor.Text(value.Label, 100),
        RequestedAction = Redactor.Label(value.RequestedAction, 40),
        Method = Redactor.Label(value.Method, 60),
        Result = Redactor.Label(value.Result, 40),
        ConfidenceSignals = value.ConfidenceSignals.Take(12)
            .Select(signal => new ConfidenceSignal(Redactor.Label(signal.Name, 80), signal.Passed))
            .ToImmutableArray(),
        RetryCount = Math.Clamp(value.RetryCount, 0, 5),
        ErrorCode = Redactor.Label(value.ErrorCode, 80),
    };
}
