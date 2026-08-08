# ============================================================================
#  AI Account Manager : one-command developer setup
#
#  Run from the repo root:   .\setup.ps1
#
#  What it does:
#    1. checks you have Node.js 20+ and npm 10+ on PATH
#    2. installs the exact dependency tree from package-lock.json (npm ci)
#    3. repairs the Electron binary if the postinstall download was skipped
#    4. type-checks the project so you know the checkout is sound
#
#  It never asks for, stores, or transmits any credential. This app has no
#  API key of its own - you sign in through Claude Code's own browser OAuth
#  flow, and any provider API keys you add are encrypted locally with Windows
#  DPAPI and never leave your machine.
#
#  Optional switches:
#    .\setup.ps1 -SkipTypecheck    dependencies only, no type check
#    .\setup.ps1 -Install          use 'npm install' instead of 'npm ci'
#                                  (only if you are deliberately changing deps)
# ============================================================================
param(
    [switch]$SkipTypecheck,
    [switch]$Install
)

$ErrorActionPreference = "Stop"

Write-Host "=== AI Account Manager setup ===" -ForegroundColor Cyan

# --- 1. Node and npm ------------------------------------------------------
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js was not found on PATH." -ForegroundColor Red
    Write-Host "Install the LTS build from https://nodejs.org (24.x recommended),"
    Write-Host "then close this window, open a new one, and re-run this script."
    exit 1
}

$nodeVer = (node --version).TrimStart("v")
$nodeMajor = [int]($nodeVer.Split(".")[0])
Write-Host "Found Node.js $nodeVer"
if ($nodeMajor -lt 20) {
    Write-Host "Node.js 20 or newer is required (24 recommended). Found $nodeVer." -ForegroundColor Red
    exit 1
}

$npmVer = (npm --version)
Write-Host "Found npm $npmVer"
if ([int]($npmVer.Split(".")[0]) -lt 10) {
    Write-Host "npm 10 or newer is required. Found $npmVer." -ForegroundColor Red
    Write-Host "Update it with:  npm install -g npm@latest"
    exit 1
}

# --- 2. Dependencies ------------------------------------------------------
# 'npm ci' installs exactly what package-lock.json pins and wipes any stale
# node_modules first - which is what you want for a reproducible checkout.
# 'npm install' is only correct when you are deliberately changing dependencies.
if ($Install) {
    Write-Host "`n[1/3] Installing dependencies (npm install)..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "`n[1/3] Installing dependencies (npm ci, from package-lock.json)..." -ForegroundColor Cyan
    npm ci
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependency install failed - see the npm output above." -ForegroundColor Red
    exit $LASTEXITCODE
}

# --- 3. Electron binary ---------------------------------------------------
# Electron downloads its ~150 MB binary in a postinstall step. Some corporate
# networks and proxies block it silently, leaving an install that looks fine
# until 'npm start' does nothing at all.
Write-Host "`n[2/3] Checking the Electron binary..." -ForegroundColor Cyan
$electronExe = Join-Path $PSScriptRoot "node_modules\electron\dist\electron.exe"
if (Test-Path $electronExe) {
    Write-Host "Electron binary present." -ForegroundColor Green
} else {
    Write-Host "Electron binary missing - the postinstall download was skipped." -ForegroundColor Yellow
    Write-Host "Retrying it now..."
    node (Join-Path $PSScriptRoot "node_modules\electron\install.js")
    if (Test-Path $electronExe) {
        Write-Host "Electron binary downloaded." -ForegroundColor Green
    } else {
        Write-Host "Still missing. You are probably behind a proxy that blocks the" -ForegroundColor Red
        Write-Host "GitHub release download. Set HTTPS_PROXY and re-run this script." -ForegroundColor Red
        exit 1
    }
}

# --- 4. Type check --------------------------------------------------------
if ($SkipTypecheck) {
    Write-Host "`n[3/3] Skipping type check (-SkipTypecheck)." -ForegroundColor Yellow
} else {
    Write-Host "`n[3/3] Type-checking (main, preload and renderer)..." -ForegroundColor Cyan
    npm run typecheck
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Type check failed - the checkout has a problem, or you have" -ForegroundColor Red
        Write-Host "local edits that do not compile." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "Type check passed." -ForegroundColor Green
}

# --- Done -----------------------------------------------------------------
Write-Host "`nDone. Useful commands:" -ForegroundColor Green
Write-Host "    npm start            build and launch the app"
Write-Host "    npm test             unit tests (no Electron needed)"
Write-Host "    npm run verify       end-to-end account dashboard test"
Write-Host "    npm run verify:api   end-to-end API analytics test (mock data)"
Write-Host "    .\build\build.ps1    build the installer"
Write-Host ""
Write-Host "Runtime prerequisite: Claude Code on your PATH ('claude --version')." -ForegroundColor Yellow
Write-Host "Close any running copy of the app before 'npm start' or a build -" -ForegroundColor Yellow
Write-Host "it takes a single-instance lock and a second copy exits immediately." -ForegroundColor Yellow
