# ============================================================================
#  AI Account Manager : install the tools it drives
#
#  This app is a dashboard over three other programs. Without them it starts
#  fine but cannot do much:
#
#     Claude Code    required  - the accounts it manages ARE Claude Code
#                               profiles, and sign-in runs `claude auth login`
#     Codex CLI      optional  - powers the GPT / Codex usage panel
#     VS Code        optional  - "Open in VS Code" launches an account into it
#
#  Usage:
#     .\scripts\install-prerequisites.ps1              # report, then ask
#     .\scripts\install-prerequisites.ps1 -CheckOnly   # report only
#     .\scripts\install-prerequisites.ps1 -Yes         # install without asking
#     .\scripts\install-prerequisites.ps1 -Only claude,vscode
#
#  Everything is installed from Microsoft's winget repository, from the
#  vendors' own official packages (Anthropic PBC, OpenAI Inc., Microsoft Corp).
#  Nothing is installed without your say-so: without -Yes it lists exactly what
#  it would install and waits for you. Per-user scope is preferred so no
#  administrator rights are needed; if a package only ships a machine-wide
#  installer, winget will ask for elevation itself - this script never requests
#  it silently.
#
#  Re-running is safe: anything already present is skipped.
# ============================================================================
[CmdletBinding()]
param(
    [switch]$Yes,
    [switch]$CheckOnly,
    [ValidateSet("claude", "codex", "vscode")]
    [string[]]$Only
)

$ErrorActionPreference = "Stop"

# --- Finding things -------------------------------------------------------
# Deliberately does NOT trust $env:PATH alone. The whole reason this script
# exists is that PATH goes stale: a process keeps the environment it started
# with, so a tool installed five minutes ago is invisible to this shell even
# though it is on disk. Probe real locations, and consult the registry PATH
# rather than the inherited one.

function Get-RegistryPathEntries {
    $parts = @()
    foreach ($hive in @(
        @{ Path = "HKCU:\Environment"; Name = "Path" },
        @{ Path = "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; Name = "Path" }
    )) {
        try {
            $value = (Get-ItemProperty -Path $hive.Path -Name $hive.Name -ErrorAction Stop).Path
            if ($value) { $parts += ($value -split ';' | Where-Object { $_ }) }
        } catch { }
    }
    $parts | ForEach-Object { [Environment]::ExpandEnvironmentVariables($_) }
}

$script:RegistryPath = @(Get-RegistryPathEntries)

function Find-Tool([string[]]$Probes, [string[]]$CommandNames) {
    foreach ($probe in $Probes) {
        if ($probe -and (Test-Path -LiteralPath $probe)) { return $probe }
    }
    foreach ($name in $CommandNames) {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd -and $cmd.Source) { return $cmd.Source }
        foreach ($dir in $script:RegistryPath) {
            foreach ($ext in @(".exe", ".cmd", ".bat")) {
                $candidate = Join-Path $dir ($name + $ext)
                if (Test-Path -LiteralPath $candidate) { return $candidate }
            }
        }
    }
    return $null
}

# Codex installs into a versioned folder, so glob one level down as well.
function Find-CodexBin {
    $root = Join-Path $env:LOCALAPPDATA "OpenAI\Codex\bin"
    if (-not (Test-Path -LiteralPath $root)) { return $null }
    $direct = Join-Path $root "codex.exe"
    if (Test-Path -LiteralPath $direct) { return $direct }
    $nested = Get-ChildItem $root -Directory -ErrorAction SilentlyContinue |
        ForEach-Object { Join-Path $_.FullName "codex.exe" } |
        Where-Object { Test-Path -LiteralPath $_ } |
        Select-Object -First 1
    return $nested
}

$tools = @(
    [pscustomobject]@{
        Key       = "claude"
        Name      = "Claude Code"
        Required  = $true
        WingetId  = "Anthropic.ClaudeCode"
        Publisher = "Anthropic PBC"
        Why       = "the accounts this app manages are Claude Code profiles"
        Path      = Find-Tool -CommandNames @("claude") -Probes @(
            (Join-Path $env:USERPROFILE ".local\bin\claude.exe"),
            (Join-Path $env:USERPROFILE ".claude\local\claude.exe"),
            (Join-Path $env:USERPROFILE ".bun\bin\claude.exe"),
            (Join-Path $env:LOCALAPPDATA "Programs\claude\claude.exe"),
            (Join-Path $env:APPDATA "npm\claude.cmd")
        )
    },
    [pscustomobject]@{
        Key       = "codex"
        Name      = "Codex CLI"
        Required  = $false
        WingetId  = "OpenAI.Codex"
        Publisher = "OpenAI, Inc."
        Why       = "the GPT / Codex usage panel reads your ChatGPT plan usage from it"
        Path      = (Find-CodexBin) ?? (Find-Tool -CommandNames @("codex") -Probes @(
            (Join-Path $env:APPDATA "npm\codex.cmd"),
            (Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\codex.exe")
        ))
    },
    [pscustomobject]@{
        Key       = "vscode"
        Name      = "Visual Studio Code"
        Required  = $false
        WingetId  = "Microsoft.VisualStudioCode"
        Publisher = "Microsoft Corporation"
        Why       = '"Open in VS Code" launches an account into it'
        Path      = Find-Tool -CommandNames @("code") -Probes @(
            (Join-Path $env:LOCALAPPDATA "Programs\Microsoft VS Code\Code.exe"),
            (Join-Path $env:ProgramFiles "Microsoft VS Code\Code.exe"),
            (Join-Path ${env:ProgramFiles(x86)} "Microsoft VS Code\Code.exe")
        )
    }
)

if ($Only) { $tools = $tools | Where-Object { $Only -contains $_.Key } }

# --- Report ---------------------------------------------------------------
Write-Host "=== AI Account Manager prerequisites ===" -ForegroundColor Cyan
Write-Host ""
foreach ($t in $tools) {
    $label = if ($t.Required) { "required" } else { "optional" }
    if ($t.Path) {
        Write-Host ("  [installed] {0,-20} {1}" -f $t.Name, $t.Path) -ForegroundColor Green
    } else {
        $colour = if ($t.Required) { "Red" } else { "Yellow" }
        Write-Host ("  [missing]   {0,-20} ({1}) - {2}" -f $t.Name, $label, $t.Why) -ForegroundColor $colour
    }
}
Write-Host ""

$missing = @($tools | Where-Object { -not $_.Path })
if ($missing.Count -eq 0) {
    Write-Host "Everything is installed. Nothing to do." -ForegroundColor Green
    exit 0
}
if ($CheckOnly) {
    Write-Host "$($missing.Count) missing. Re-run without -CheckOnly to install." -ForegroundColor Yellow
    exit 1
}

# --- winget ---------------------------------------------------------------
# winget ships as an app-execution alias, which is a zero-length reparse point:
# Get-Command can miss it when PATH is stale, so probe the real location too.
$winget = (Get-Command winget -ErrorAction SilentlyContinue).Source
if (-not $winget) {
    $alias = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\winget.exe"
    if (Test-Path -LiteralPath $alias) { $winget = $alias }
}
if (-not $winget) {
    Write-Host "winget was not found, so this script cannot install anything." -ForegroundColor Red
    Write-Host "Install 'App Installer' from the Microsoft Store, then re-run. Or install"
    Write-Host "the missing tools by hand:"
    foreach ($t in $missing) { Write-Host "  $($t.Name): winget id $($t.WingetId)" }
    exit 1
}

# --- Consent --------------------------------------------------------------
Write-Host "These would be installed from winget, using each vendor's own package:" -ForegroundColor Cyan
foreach ($t in $missing) {
    Write-Host ("  {0,-20} {1,-30} by {2}" -f $t.Name, $t.WingetId, $t.Publisher)
}
Write-Host ""
if (-not $Yes) {
    # Read-Host throws outright in a non-interactive host (a provisioning
    # script, a CI step, an installer). Say what to do instead of dying on it.
    try {
        $answer = Read-Host "Install these now? [y/N]"
    } catch {
        Write-Host "No console is attached, so this cannot ask for confirmation." -ForegroundColor Yellow
        Write-Host "Re-run with -Yes to install without prompting, or -CheckOnly to just report."
        exit 1
    }
    if ($answer -notmatch '^(y|yes)$') {
        Write-Host "Nothing was installed." -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
}

# --- Install --------------------------------------------------------------
$failed = @()
foreach ($t in $missing) {
    Write-Host "Installing $($t.Name)..." -ForegroundColor Cyan
    $common = @(
        "install", "--id", $t.WingetId, "--exact",
        "--accept-package-agreements", "--accept-source-agreements",
        "--disable-interactivity"
    )
    # Prefer a per-user install so no administrator rights are needed. Not every
    # package publishes one, so fall back rather than failing.
    & $winget @common --scope user
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  per-user install unavailable or failed; retrying default scope..." -ForegroundColor DarkGray
        & $winget @common
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  $($t.Name) did not install (winget exit $LASTEXITCODE)." -ForegroundColor Red
        $failed += $t
    } else {
        Write-Host "  $($t.Name) installed." -ForegroundColor Green
    }
    Write-Host ""
}

# --- Result ---------------------------------------------------------------
if ($failed.Count -gt 0) {
    Write-Host "Could not install: $(($failed | ForEach-Object { $_.Name }) -join ', ')" -ForegroundColor Red
    Write-Host "Try running the winget command by hand to see the full error."
    exit 1
}

Write-Host "All prerequisites installed." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: fully quit AI Account Manager - including its tray icon -" -ForegroundColor Yellow
Write-Host "and reopen it. A running program keeps the environment it started with," -ForegroundColor Yellow
Write-Host "so it cannot see anything installed since. The same applies to any" -ForegroundColor Yellow
Write-Host "terminal you already have open." -ForegroundColor Yellow
exit 0
