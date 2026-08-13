using System.Text.RegularExpressions;

namespace AIAccountManager.Automation;

public static partial class Redactor
{
    [GeneratedRegex(@"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", RegexOptions.IgnoreCase)]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"\b(?:sk|sess|token|oauth)[-_][A-Za-z0-9_-]{12,}\b", RegexOptions.IgnoreCase)]
    private static partial Regex SecretRegex();

    [GeneratedRegex(@"https?://[^\s]+", RegexOptions.IgnoreCase)]
    private static partial Regex UrlRegex();

    [GeneratedRegex("(?<![A-Za-z0-9])(?:[A-Za-z]:\\\\|\\\\\\\\)[^\\r\\n\\t\"<>|?*]+", RegexOptions.IgnoreCase)]
    private static partial Regex WindowsPathRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();

    public static string Text(string? value, int maximum = 120)
    {
        var text = value ?? string.Empty;
        text = EmailRegex().Replace(text, "[email]");
        text = SecretRegex().Replace(text, "[secret]");
        text = UrlRegex().Replace(text, match =>
        {
            return Uri.TryCreate(match.Value, UriKind.Absolute, out var uri)
                ? $"{uri.GetLeftPart(UriPartial.Authority)}/[url-path-redacted]"
                : "[url]";
        });
        text = WindowsPathRegex().Replace(text, "[path]");
        text = new string(text.Select(ch => char.IsControl(ch) ? ' ' : ch).ToArray());
        text = WhitespaceRegex().Replace(text, " ").Trim();
        return text.Length <= maximum ? text : text[..maximum];
    }

    public static string Label(string? value, int maximum = 80) => Text(value, maximum);
}
