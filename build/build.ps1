# ============================================================================
#  AI Account Manager : one-command installer build
#  Run from anywhere:   .\build\build.ps1
#  Output:              <repo>\release\AIAccountManager-Setup-<version>.exe
#
#  Prerequisite: .\setup.ps1 has been run once.
#
#  This runs the same pipeline as 'npm run dist' (typecheck -> build main +
#  renderer -> electron-builder --win) but first kills any running copy of the
#  app, which is the single most common reason a build fails or a Playwright
#  run reports "browser closed": the app takes a single-instance lock.
# ============================================================================
$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent

Write-Host "=== Building AI Account Manager ===" -ForegroundColor Cyan

# --- 0. Sanity: dependencies installed? -----------------------------------
if (-not (Test-Path (Join-Path $repo "node_modules"))) {
    Write-Host "node_modules is missing - run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

# --- 1. Close any running instance ----------------------------------------
# electron-builder cannot overwrite files that are locked by a running app,
# and the single-instance lock makes a freshly built copy quit on launch.
$running = Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -in @("AI Account Manager", "Claude Account Manager", "electron") }
if ($running) {
    Write-Host "Closing $($running.Count) running instance(s) first..." -ForegroundColor Yellow
    $running | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# --- 2. Read the version so we can report the artifact name ---------------
$pkg = Get-Content (Join-Path $repo "package.json") -Raw | ConvertFrom-Json
$version = $pkg.version
Write-Host "Version: $version"

# --- 3. Build -------------------------------------------------------------
# 'npm run dist' = typecheck && build:main && build:renderer && electron-builder
Push-Location $repo
try {
    Write-Host "`nRunning typecheck, build and electron-builder..." -ForegroundColor Cyan
    Write-Host "(first run downloads electron-builder's NSIS tooling - be patient)`n"
    npm run dist
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nBuild failed - see the output above." -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

# --- 4. Report ------------------------------------------------------------
$exe = Join-Path $repo "release\AIAccountManager-Setup-$version.exe"
if (Test-Path $exe) {
    $mb = [math]::Round((Get-Item $exe).Length / 1MB, 1)
    Write-Host "`nDONE: $exe ($mb MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Before shipping it:" -ForegroundColor Yellow
    Write-Host "  1. Install it and launch once - a packaged build can fail on"
    Write-Host "     things a dev run never shows (extraResources, guide viewer)."
    Write-Host "  2. Attach it to a GitHub Release; never commit it to the repo."
} else {
    Write-Host "`nBuild finished but the installer was not found at:" -ForegroundColor Red
    Write-Host "  $exe" -ForegroundColor Red
    Write-Host "Check release\ for what electron-builder actually produced." -ForegroundColor Red
    exit 1
}
