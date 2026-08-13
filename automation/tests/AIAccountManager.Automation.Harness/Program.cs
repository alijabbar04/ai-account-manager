using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Media;

namespace AIAccountManager.Automation.Harness;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        var app = new Application();
        var first = PermissionWindow("Synthetic Claude card — TEST ONLY", "Claude wants to use computer", "Allow once", 120, 120);
        var second = PermissionWindow("Synthetic concurrent card — TEST ONLY", "Claude wants to use javascript_tool", "Allow this action", 600, 180);
        first.Closed += (_, _) => second.Close();
        first.Show();
        second.Show();
        app.Run();
    }

    private static Window PermissionWindow(string title, string prompt, string action, double left, double top)
    {
        var status = new TextBlock { Text = "Waiting", Foreground = Brushes.DarkSlateGray, Margin = new Thickness(0, 10, 0, 0) };
        var button = new Button
        {
            Name = "SyntheticAllowButton",
            Content = action,
            MinWidth = 140,
            Margin = new Thickness(0, 12, 0, 0),
        };
        AutomationProperties.SetName(button, action);
        button.Click += (_, _) => status.Text = "Invoked by test";
        var card = new StackPanel
        {
            Margin = new Thickness(24),
            Children =
            {
                new TextBlock { Text = "AI Account Manager synthetic harness", FontWeight = FontWeights.Bold },
                new TextBlock { Text = prompt, Margin = new Thickness(0, 14, 0, 0) },
                button,
                status,
            },
        };
        return new Window
        {
            Title = title,
            Width = 420,
            Height = 240,
            Left = left,
            Top = top,
            Content = card,
            WindowStartupLocation = WindowStartupLocation.Manual,
        };
    }
}
