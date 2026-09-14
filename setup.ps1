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
# 'npm ci' installs exactly what package-lock.json pins, which is what CI does
# too. It refuses to run if the lockfile and package.json have drifted apart -
# in that case fall back to 'npm install', which updates the lockfile.
Write-Host "`n[1/4] Toolchains ready." -ForegroundColor Cyan
Write-Host "`n[2/4] Installing dependencies..." -ForegroundColor Cyan
if (Test-Path (Join-Path $PSScriptRoot "package-lock.json")) {
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "'npm ci' failed - retrying with 'npm install'." -ForegroundColor Yellow
        Write-Host "If that succeeds, commit the updated package-lock.json." -ForegroundColor Yellow
        npm install
    }
} else {
    npm install
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependency install failed - see the npm output above." -ForegroundColor Red
    exit $LASTEXITCODE
}

# --- 4. Electron binary ---------------------------------------------------
# Electron downloads a ~130 MB binary in a postinstall step, and that step has
# two independent ways to leave you with an install that looks complete until a
# build fails much later:
#
#   1. the download is blocked (corporate proxy), or
#   2. the download succeeds and the EXTRACTION silently does nothing.
#
# (2) is real, not hypothetical: on Node 24, electron 37's postinstall stops
# after the first zip entry, exits 0, and leaves dist\ containing only
# locales\. The zip itself lands in the cache intact, so we can finish the job
# ourselves with Expand-Archive rather than making the contributor debug it.
Write-Host "`n[3/4] Checking the Electron binary..." -ForegroundColor Cyan
$electronDist = Join-Path $PSScriptRoot "node_modules\electron\dist"
$electronExe = Join-Path $electronDist "electron.exe"

if (-not (Test-Path $electronExe)) {
    Write-Host "Electron binary missing - running the postinstall step..." -ForegroundColor Yellow
    node (Join-Path $PSScriptRoot "node_modules\electron\install.js")
}

if (-not (Test-Path $electronExe)) {
    # The postinstall leaves the verified zip in the cache even when unpacking
    # it fails, so look there before concluding anything about the network.
    $electronVersion = (Get-Content (Join-Path $PSScriptRoot "node_modules\electron\package.json") -Raw |
        ConvertFrom-Json).version
    $cacheRoot = if ($env:ELECTRON_CACHE) {
        $env:ELECTRON_CACHE
    } else {
        Join-Path $env:LOCALAPPDATA "electron\Cache"
    }
    $zip = Get-ChildItem -Path $cacheRoot -Recurse -Filter "electron-v$electronVersion-win32-x64.zip" -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($zip) {
        Write-Host "Download succeeded but unpacking did not - extracting $($zip.Name) directly..." -ForegroundColor Yellow
        Remove-Item $electronDist -Recurse -Force -ErrorAction SilentlyContinue
        Expand-Archive -LiteralPath $zip.FullName -DestinationPath $electronDist -Force
        # electron's index.js reads this to locate the binary it just unpacked.
        Set-Content -Path (Join-Path $PSScriptRoot "node_modules\electron\path.txt") -Value "electron.exe" -NoNewline
    }
}

if (Test-Path $electronExe) {
    Write-Host "Electron binary present." -ForegroundColor Green
} else {
    Write-Host "Electron is still not usable." -ForegroundColor Red
    Write-Host "  * No cached zip found: the download was blocked. If you are behind a" -ForegroundColor Red
    Write-Host "    proxy, set HTTPS_PROXY and re-run this script." -ForegroundColor Red
    Write-Host "  * Cached zip found but extraction failed: check free disk space and" -ForegroundColor Red
    Write-Host "    that antivirus is not quarantining electron.exe." -ForegroundColor Red
    exit 1
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
Write-Host "`nSetup complete. Start the app with:" -ForegroundColor Green
Write-Host ""
Write-Host "    npm start" -ForegroundColor White
Write-Host ""
Write-Host "Other useful commands:" -ForegroundColor Green
Write-Host "    npm test                    unit tests + runtime verification"
Write-Host "    npm run verify:safestorage  prove the API key vault survives a rename"
Write-Host "    npm run build:dir           unpacked build into release\win-unpacked"
Write-Host "    npm run automation:soak     measure helper idle CPU, memory and handles"
Write-Host "    .\build\build.ps1           build the NSIS installer"
Write-Host "    npm run format              Prettier across app, scripts, tests, .github"
Write-Host ""
Write-Host "IMPORTANT: this project's source of record is the FORMATTED RUNTIME" -ForegroundColor Yellow
Write-Host "in app\ - there is no TypeScript build step. Edit app\dist-electron\" -ForegroundColor Yellow
Write-Host "main.cjs and app\dist\assets\*.js directly, and run 'npm test' after." -ForegroundColor Yellow
Write-Host ""
Write-Host "Runtime prerequisite: Claude Code on your PATH ('claude --version')." -ForegroundColor Yellow
Write-Host "Close any running copy of the app before building - it takes a" -ForegroundColor Yellow
Write-Host "single-instance lock and a second copy exits immediately." -ForegroundColor Yellow
