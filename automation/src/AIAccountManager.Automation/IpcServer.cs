using System.IO.Pipes;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace AIAccountManager.Automation;

public sealed record IpcMessage(string? Id, string? Type, int? Protocol, string? Secret, JsonElement Payload);

public static class ProtocolValidator
{
    public const int Version = 1;

    public static bool ValidateHello(IpcMessage message, string expectedSecret)
    {
        if (!string.Equals(message.Type, "hello", StringComparison.Ordinal) ||
            message.Protocol != Version || string.IsNullOrEmpty(message.Secret)) return false;
        var expected = Encoding.UTF8.GetBytes(expectedSecret);
        var actual = Encoding.UTF8.GetBytes(message.Secret);
        return expected.Length == actual.Length && CryptographicOperations.FixedTimeEquals(expected, actual);
    }
}

public sealed class IpcServer : IAsyncDisposable
{
    private readonly string _pipeName;
    private readonly string _secret;
    private readonly int _parentProcessId;
    private readonly AutomationEventEngine _engine;
    private readonly AuditStore _audit;
    private readonly SemaphoreSlim _writeGate = new(1, 1);
    private NamedPipeServerStream? _pipe;
    private StreamWriter? _writer;
    private HostSettings _settings = HostSettings.SafeDefaults;
    private bool _shutdown;

    public IpcServer(
        string pipeName,
        string secret,
        int parentProcessId,
        AutomationEventEngine engine,
        AuditStore audit)
    {
        _pipeName = pipeName;
        _secret = secret;
        _parentProcessId = parentProcessId;
        _engine = engine;
        _audit = audit;
        _engine.Activity += OnActivity;
    }

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        _pipe = new NamedPipeServerStream(
            _pipeName,
            PipeDirection.InOut,
            1,
            PipeTransmissionMode.Byte,
            PipeOptions.Asynchronous | PipeOptions.CurrentUserOnly,
            32 * 1024,
            32 * 1024);
        await _pipe.WaitForConnectionAsync(cancellationToken);
        if (!WindowsNative.GetNamedPipeClientProcessId(_pipe.SafePipeHandle, out var peer) ||
            peer != (uint)_parentProcessId)
        {
            throw new UnauthorizedAccessException("Named-pipe peer did not match the expected Electron parent process.");
        }

        using var reader = new StreamReader(_pipe, Encoding.UTF8, false, 32 * 1024, leaveOpen: true);
        _writer = new StreamWriter(_pipe, new UTF8Encoding(false), 32 * 1024, leaveOpen: true)
        {
            AutoFlush = true,
        };

        var helloLine = await reader.ReadLineAsync(cancellationToken);
        var hello = Deserialize(helloLine);
        if (hello is null || !ProtocolValidator.ValidateHello(hello, _secret))
        {
            await WriteAsync(new { id = hello?.Id, ok = false, error = "IPC authentication or protocol version failed." });
            throw new UnauthorizedAccessException("IPC handshake failed.");
        }
        await WriteAsync(new
        {
            id = hello.Id,
            ok = true,
            payload = new { protocol = ProtocolValidator.Version, processId = Environment.ProcessId },
        });

        _engine.Start();
        using var parentMonitor = new PeriodicTimer(TimeSpan.FromSeconds(2));
        var monitor = Task.Run(async () =>
        {
            while (await parentMonitor.WaitForNextTickAsync(cancellationToken))
            {
                try
                {
                    using var parent = System.Diagnostics.Process.GetProcessById(_parentProcessId);
                    if (parent.HasExited) break;
                }
                catch
                {
                    break;
                }
            }
            _shutdown = true;
            try { _pipe?.Dispose(); } catch { }
        }, cancellationToken);

        while (!_shutdown && !cancellationToken.IsCancellationRequested && _pipe.IsConnected)
        {
            string? line;
            try
            {
                line = await reader.ReadLineAsync(cancellationToken);
            }
            catch (IOException)
            {
                break;
            }
            if (line is null) break;
            var message = Deserialize(line);
            if (message is null || string.IsNullOrWhiteSpace(message.Type))
            {
                await WriteAsync(new { id = message?.Id, ok = false, error = "Malformed IPC request." });
                continue;
            }
            await HandleAsync(message);
        }
        _shutdown = true;
        try { await monitor.WaitAsync(TimeSpan.FromSeconds(1), CancellationToken.None); } catch { }
    }

    private async Task HandleAsync(IpcMessage message)
    {
        try
        {
            switch (message.Type)
            {
                case "configure":
                    _settings = message.Payload.Deserialize<HostSettings>(JsonOptions.Default)?.Sanitize()
                        ?? HostSettings.SafeDefaults;
                    _engine.Configure(_settings);
                    await Ok(message, _engine.Status());
                    break;
                case "status":
                    await Ok(message, _engine.Status());
                    break;
                case "pause":
                    var pauseUntil = message.Payload.TryGetProperty("pausedUntil", out var pauseValue) &&
                                     pauseValue.TryGetInt64(out var parsedPause)
                        ? parsedPause
                        : DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeMilliseconds();
                    _settings = _settings with { PausedUntil = pauseUntil };
                    _engine.Configure(_settings);
                    await Ok(message, _engine.Status());
                    break;
                case "resume":
                    _settings = _settings with { PausedUntil = null };
                    _engine.Configure(_settings);
                    await Ok(message, _engine.Status());
                    break;
                case "diagnostics":
                    await Ok(message, _engine.Diagnostics());
                    break;
                case "inspect":
                    var delay = message.Payload.TryGetProperty("delayMs", out var delayValue) && delayValue.TryGetInt32(out var parsedDelay)
                        ? parsedDelay
                        : 3_000;
                    await Ok(message, await Task.Run(() => _engine.InspectWindowUnderCursor(delay)));
                    break;
                case "activity:list":
                    var limit = message.Payload.TryGetProperty("limit", out var limitValue) && limitValue.TryGetInt32(out var parsedLimit)
                        ? parsedLimit
                        : 500;
                    await Ok(message, _audit.List(limit));
                    break;
                case "activity:clear":
                    _audit.Clear();
                    await Ok(message, new { cleared = true });
                    break;
                case "native-mode":
                    var mode = message.Payload.TryGetProperty("mode", out var modeValue)
                        ? modeValue.GetString() ?? string.Empty
                        : string.Empty;
                    var result = await _engine.ApplyClaudeNativeModeAsync(mode);
                    await Ok(message, new { ok = result.Ok, message = result.Message });
                    break;
                case "shutdown":
                    _shutdown = true;
                    await Ok(message, new { stopping = true });
                    break;
                default:
                    await WriteAsync(new { id = message.Id, ok = false, error = "Unknown IPC request type." });
                    break;
            }
        }
        catch (Exception error)
        {
            await WriteAsync(new
            {
                id = message.Id,
                ok = false,
                error = Redactor.Text(error.Message, 160),
            });
        }
    }

    private Task Ok(IpcMessage message, object payload) =>
        WriteAsync(new { id = message.Id, ok = true, payload });

    private static IpcMessage? Deserialize(string? line)
    {
        if (string.IsNullOrWhiteSpace(line) || line.Length > 1_000_000) return null;
        try { return JsonSerializer.Deserialize<IpcMessage>(line, JsonOptions.Default); }
        catch (JsonException) { return null; }
    }

    private void OnActivity(AuditRecord record)
    {
        _ = WriteAsync(new { type = "event", @event = "activity", payload = record });
    }

    private async Task WriteAsync(object value)
    {
        var writer = _writer;
        if (writer is null) return;
        var json = JsonSerializer.Serialize(value, JsonOptions.Default);
        await _writeGate.WaitAsync();
        try
        {
            await writer.WriteLineAsync(json);
        }
        catch (IOException) { }
        catch (ObjectDisposedException) { }
        finally
        {
            _writeGate.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        _shutdown = true;
        _engine.Activity -= OnActivity;
        _engine.Stop();
        if (_writer is not null) await _writer.DisposeAsync();
        _pipe?.Dispose();
        _writeGate.Dispose();
    }
}
