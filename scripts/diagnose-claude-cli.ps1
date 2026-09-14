# ============================================================================
#  AI Account Manager : why won't the Claude sign-in terminal work?
#
#  Run on the machine that shows:
#     claude : The term 'claude' is not recognized as the name of a cmdlet...
#
#  Paste into PowerShell:
#     irm https://raw.githubusercontent.com/alijabbar04/ai-account-manager/main/scripts/diagnose-claude-cli.ps1 | iex
#
#  Or run it from a checkout:
#     .\scripts\diagnose-claude-cli.ps1
#
#  Read-only: it changes nothing and needs no admin rights. It prints a
#  diagnosis and the exact fix for whichever cause it finds.
# ============================================================================
$ErrorActionPreference = "Continue"

function Line($label, $value) { "{0,-34} {1}" -f $label, $value }

Write-Host "=== AI Account Manager : Claude CLI diagnosis ===" -ForegroundColor Cyan
Write-Host ""

# --- 1. Is the app installed, and which version? --------------------------
$appExe = Join-Path $env:LOCALAPPDATA "Programs\AI Account Manager\AI Account Manager.exe"
$oldExe = Join-Path $env:LOCALAPPDATA "Programs\Claude Account Manager\Claude Account Manager.exe"
$appVersion = if (Test-Path $appExe) { (Get-Item $appExe).VersionInfo.ProductVersion } else { $null }

Line "App installed" $(if ($appVersion) { "yes, v$appVersion" } else { "NOT FOUND" })
if (Test-Path $oldExe) {
    Line "Old pre-rename install" "PRESENT - uninstall it once the new one works"
}

# Versions before 1.7.1 shelled out to a bare 'claude' and could not recover.
$fixedBuild = $false
if ($appVersion) {
    $v = [version]($appVersion -replace '^(\d+\.\d+\.\d+).*$', '$1')
    $fixedBuild = $v -ge [version]"1.7.1"
    Line "Resolves claude.exe itself" $(if ($fixedBuild) { "yes (1.7.1+)" } else { "NO - this build needs claude on PATH" })
}
Write-Host ""

# --- 2. Is Claude Code installed at all? ----------------------------------
$candidates = @(
    (Join-Path $env:USERPROFILE ".local\bin\claude.exe"),
    (Join-Path $env:USERPROFILE ".claude\local\claude.exe"),
    (Join-Path $env:USERPROFILE ".bun\bin\claude.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\claude\claude.exe"),
    (Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\claude.exe"),
    (Join-Path $env:APPDATA "npm\claude.cmd"),
    (Join-Path $env:ProgramFiles "Claude\claude.exe")
)
# @() matters: a single match would otherwise be a string, and $found[0] would
# index its first character rather than the path.
$found = @($candidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) })
$onPath = (Get-Command claude -ErrorAction SilentlyContinue).Source

Line "claude on PATH" $(if ($onPath) { $onPath } else { "NO" })
Line "claude.exe found on disk" $(if ($found) { $found[0] } else { "NO" })
if ($found) {
    $ver = & $found[0] --version 2>&1 | Select-Object -First 1
    Line "  version" $ver
}
Write-Host ""

# --- 3. PATH health -------------------------------------------------------
$userPath = (Get-ItemProperty "HKCU:\Environment" -Name Path -ErrorAction SilentlyContinue).Path
if ($userPath) {
    $entries = @($userPath -split ';' | Where-Object { $_ })
    $dead = @($entries | Where-Object { -not (Test-Path -LiteralPath $_) })
    Line "User PATH size" ("{0:N0} chars, {1} entries" -f $userPath.Length, $entries.Count)
    Line "  dead entries" $dead.Count
    if ($userPath.Length -gt 4000) {
        Write-Host "  WARNING: an oversized PATH causes intermittent 'not recognized' errors." -ForegroundColor Yellow
    }
    $hasLocalBin = $entries -contains (Join-Path $env:USERPROFILE ".local\bin")
    Line "  includes ~\.local\bin" $hasLocalBin
}
Line "CLAUDE_CLI_PATH set" $(if ($env:CLAUDE_CLI_PATH) { $env:CLAUDE_CLI_PATH } else { "no" })
Write-Host ""

# --- 4. Verdict -----------------------------------------------------------
Write-Host "=== Diagnosis ===" -ForegroundColor Cyan
if (-not $found -and -not $onPath) {
    Write-Host "Claude Code is not installed on this machine." -ForegroundColor Red
    Write-Host "  Fix: install it from https://claude.com/claude-code,"
    Write-Host "       then fully quit the app (check the system tray) and reopen it."
}
elseif (-not $fixedBuild) {
    Write-Host "Claude Code IS installed, but this build of the app needs it on PATH." -ForegroundColor Yellow
    Write-Host "  Best fix:  install AI Account Manager 1.7.1 or newer, which resolves"
    Write-Host "             claude.exe by absolute path and no longer depends on PATH."
    Write-Host "  Meanwhile: fully quit the app - including the tray icon - and reopen it."
    Write-Host "             A running process keeps the environment it started with, so"
    Write-Host "             it cannot see a PATH entry added after it launched."
}
elseif (-not $onPath) {
    Write-Host "Claude Code is installed and the app can find it without PATH." -ForegroundColor Green
    Write-Host "  If sign-in still fails, fully quit the app (including the tray) and reopen."
}
else {
    Write-Host "Everything needed is present and resolvable." -ForegroundColor Green
    Write-Host "  If sign-in still fails, quit the app fully and reopen, then re-run this."
}

if ($found -and -not $env:CLAUDE_CLI_PATH) {
    Write-Host ""
    Write-Host "Optional belt-and-braces - pin the path for good:" -ForegroundColor DarkGray
    Write-Host "  [Environment]::SetEnvironmentVariable('CLAUDE_CLI_PATH','$($found[0])','User')" -ForegroundColor DarkGray
    Write-Host "  ...then reopen the app." -ForegroundColor DarkGray
}
