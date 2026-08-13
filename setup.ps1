# ============================================================================
#  AI Account Manager : one-command developer setup
#
#  Run from the repo root:   .\setup.ps1
#
#  What it does:
#    1. checks you have Node.js 20+ (22 recommended) and npm on PATH
#    2. checks for a .NET 8+ SDK used to build the Windows automation helper
#    3. installs dependencies
#    4. runs the JavaScript and native helper test suites
#
#  It never asks for, stores, or transmits any credential. This app has no API
#  key of its own: you sign in through Claude Code's own browser OAuth flow,
#  and any provider API keys you add are encrypted locally with Windows DPAPI.
#
#  Optional switch:  .\setup.ps1 -SkipTests    (dependencies only)
# ============================================================================
param([switch]$SkipTests)

$ErrorActionPreference = "Stop"

Write-Host "=== AI Account Manager setup ===" -ForegroundColor Cyan

# --- 1. Node and npm ------------------------------------------------------
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js was not found on PATH." -ForegroundColor Red
    Write-Host "Install the LTS build from https://nodejs.org (22.x recommended),"
    Write-Host "then close this window, open a new one, and re-run this script."
    exit 1
}

$nodeVer = (node --version).TrimStart("v")
$nodeMajor = [int]($nodeVer.Split(".")[0])
Write-Host "Found Node.js $nodeVer"
if ($nodeMajor -lt 20) {
    Write-Host "Node.js 20 or newer is required (22 is what CI uses). Found $nodeVer." -ForegroundColor Red
    exit 1
}
Write-Host "Found npm $(npm --version)"

# --- 2. .NET SDK ----------------------------------------------------------
$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnet) {
    Write-Host ".NET SDK was not found on PATH." -ForegroundColor Red
    Write-Host "Install the .NET 8 SDK (or newer) from https://dotnet.microsoft.com/download"
    Write-Host "then open a new PowerShell window and re-run this script."
    exit 1
}
$supportedSdk = dotnet --list-sdks |
    ForEach-Object { if ($_ -match '^(\d+)\.') { [int]$Matches[1] } } |
    Where-Object { $_ -ge 8 } |
    Select-Object -First 1
if (-not $supportedSdk) {
    Write-Host ".NET SDK 8 or newer is required for the automation helper." -ForegroundColor Red
    exit 1
}
Write-Host "Found .NET SDK $supportedSdk.x or newer"

# --- 3. Dependencies ------------------------------------------------------
# There is no package-lock.json in this distribution, so 'npm ci' cannot be
# used - 'npm install' resolves against the ranges in package.json.
Write-Host "`n[1/4] Toolchains ready." -ForegroundColor Cyan
Write-Host "`n[2/4] Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependency install failed - see the npm output above." -ForegroundColor Red
    exit $LASTEXITCODE
}

# --- 4. Electron binary ---------------------------------------------------
# Electron downloads a ~150 MB binary in a postinstall step. Corporate proxies
# block it silently, leaving an install that looks complete until a build fails.
Write-Host "`n[3/4] Checking the Electron binary..." -ForegroundColor Cyan
$electronExe = Join-Path $PSScriptRoot "node_modules\electron\dist\electron.exe"
if (Test-Path $electronExe) {
    Write-Host "Electron binary present." -ForegroundColor Green
} else {
    Write-Host "Electron binary missing - retrying the postinstall download..." -ForegroundColor Yellow
    node (Join-Path $PSScriptRoot "node_modules\electron\install.js")
    if (Test-Path $electronExe) {
        Write-Host "Electron binary downloaded." -ForegroundColor Green
    } else {
        Write-Host "Still missing - you are probably behind a proxy that blocks the" -ForegroundColor Red
        Write-Host "GitHub release download. Set HTTPS_PROXY and re-run." -ForegroundColor Red
        exit 1
    }
}

# --- 5. Tests -------------------------------------------------------------
# 'npm test' runs the unit tests AND scripts/verify-runtime.cjs, which asserts
# that required IPC channels, Codex discovery paths, preload bridges and UI
# strings are still present in the runtime. It is the safety net that makes
# hand-editing the bundles workable - do not skip it habitually.
if ($SkipTests) {
    Write-Host "`n[4/4] Skipping tests (-SkipTests)." -ForegroundColor Yellow
} else {
    Write-Host "`n[4/4] Running JavaScript, native helper, harness, and runtime tests..." -ForegroundColor Cyan
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tests failed - the checkout has a problem, or local edits" -ForegroundColor Red
        Write-Host "removed something the runtime verification requires." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "All tests passed." -ForegroundColor Green
}

# --- Done -----------------------------------------------------------------
Write-Host "`nDone. Useful commands:" -ForegroundColor Green
Write-Host "    npm test               unit tests + runtime verification"
Write-Host "    npm run build:dir      unpacked build into release\win-unpacked"
Write-Host "    npm run automation:soak  measure helper idle CPU, memory and handles"
Write-Host "    .\build\build.ps1      build the NSIS installer"
Write-Host "    npm run format         Prettier across app, scripts, tests, .github"
Write-Host ""
Write-Host "IMPORTANT: this project's source of record is the FORMATTED RUNTIME" -ForegroundColor Yellow
Write-Host "in app\ - there is no TypeScript build step. Edit app\dist-electron\" -ForegroundColor Yellow
Write-Host "main.cjs and app\dist\assets\*.js directly, and run 'npm test' after." -ForegroundColor Yellow
Write-Host ""
Write-Host "Runtime prerequisite: Claude Code on your PATH ('claude --version')." -ForegroundColor Yellow
Write-Host "Close any running copy of the app before building - it takes a" -ForegroundColor Yellow
Write-Host "single-instance lock and a second copy exits immediately." -ForegroundColor Yellow
