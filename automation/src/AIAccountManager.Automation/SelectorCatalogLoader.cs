using System.Collections.Immutable;
using System.Text.Json;

namespace AIAccountManager.Automation;

public static class SelectorCatalogLoader
{
    private sealed record RawCatalog(int SchemaVersion, string? Revision, RawSelector[]? Providers);
    private sealed record RawSelector(
        string? Id,
        string? Surface,
        string[]? ContextNames,
        string[]? PromptNames,
        string[]? AllowNames,
        bool LiveEligible,
        string? Status);

    public static SelectorCatalog Load(string? baseDirectory = null)
    {
        var directory = baseDirectory ?? AppContext.BaseDirectory;
        var path = Path.Combine(directory, "automation-selectors.v1.json");
        if (!File.Exists(path))
        {
            throw new FileNotFoundException("Automation selector catalog is missing.", path);
        }

        var raw = JsonSerializer.Deserialize<RawCatalog>(
            File.ReadAllText(path),
            JsonOptions.Default) ?? throw new InvalidDataException("Selector catalog is empty.");
        if (raw.SchemaVersion != 1 || string.IsNullOrWhiteSpace(raw.Revision))
        {
            throw new InvalidDataException("Unsupported selector catalog version.");
        }

        var providers = (raw.Providers ?? [])
            .Where(item => !string.IsNullOrWhiteSpace(item.Id))
            .Select(item => new ProviderSelector(
                Redactor.Label(item.Id, 40),
                Redactor.Label(item.Surface, 40),
                Clean(item.ContextNames),
                Clean(item.PromptNames),
                Clean(item.AllowNames),
                item.LiveEligible,
                Redactor.Label(item.Status, 40)))
            .ToImmutableArray();
        return new SelectorCatalog(1, Redactor.Label(raw.Revision, 40), providers);
    }

    private static ImmutableArray<string> Clean(IEnumerable<string>? values) =>
        (values ?? []).Select(value => Redactor.Label(value, 100))
            .Where(value => value.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToImmutableArray();
}

public static class JsonOptions
{
    public static readonly JsonSerializerOptions Default = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
    };
}
