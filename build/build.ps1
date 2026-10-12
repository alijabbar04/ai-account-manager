# ============================================================================
#  AI Account Manager : one-command installer build
#  Run from anywhere:   .\build\build.ps1
#  Output:              <repo>\release\AI-Account-Manager-Setup-<version>.exe
#
#  Prerequisite: .\setup.ps1 has been run once.
#
#  This wraps 'npm run build:win' (tests -> electron-builder --win nsis) and
#  first checks for a running packaged copy from this checkout: electron-builder
#  cannot overwrite locked files, and the app's
#  single-instance lock makes a freshly built copy quit on launch.
#
#  Code signing is automatic when CSC_LINK and CSC_KEY_PASSWORD are set in the
#  environment. Certificates are never stored in this repository.
# ============================================================================
$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent

Write-Host "=== Building AI Account Manager ===" -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $repo "node_modules"))) {
    Write-Host "node_modules is missing - run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Check this checkout's packaged processes only; avoid terminating unrelated Electron apps.
$running = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith((Join-Path $repo 'release\win-unpacked\'), [StringComparison]::OrdinalIgnoreCase) }
if ($running) { throw 'Close the packaged app running from this checkout before rebuilding.' }

# --- Version --------------------------------------------------------------
$pkg = Get-Content (Join-Path $repo "package.json") -Raw | ConvertFrom-Json
$version = $pkg.version
Write-Host "Version: $version"

if ($env:CSC_LINK) {
    Write-Host "Code signing: ENABLED (CSC_LINK is set)" -ForegroundColor Green
} else {
    Write-Host "Code signing: disabled (CSC_LINK not set) - the installer will be unsigned." -ForegroundColor Yellow
}

# --- Build ----------------------------------------------------------------
Push-Location $repo
try {
    node.exe scripts/verify-release.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Application version/lockfile checks failed.' }
    # Prevent a failed build from being mistaken for an older successful artifact.
    $oldInstaller = Join-Path $repo "release\AI-Account-Manager-Setup-$version.exe"
    if (Test-Path -LiteralPath $oldInstaller) { Remove-Item -LiteralPath $oldInstaller -Force }
    Write-Host "`nRunning tests, then electron-builder..." -ForegroundColor Cyan
    Write-Host "(first run downloads electron-builder's NSIS tooling - be patient)`n"
    npm.cmd run build:win
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nBuild failed - see the output above." -ForegroundColor Red
        Write-Host "If it was the runtime verification that failed, an edit to app\ removed" -ForegroundColor Red
        Write-Host "something scripts\verify-runtime.cjs requires." -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

# --- Report ---------------------------------------------------------------
$exe = Join-Path $repo "release\AI-Account-Manager-Setup-$version.exe"
if (Test-Path $exe) {
    & (Join-Path $repo 'scripts\verify-installer.ps1') -Installer $exe -Version $version
    if ($LASTEXITCODE -ne 0) { throw 'Windows installer version verification failed.' }
    & powershell.exe -NoProfile -NonInteractive -File (Join-Path $repo 'tests\install-smoke.ps1') -Installer $exe
    if ($LASTEXITCODE -ne 0) { throw 'Standalone installer smoke checks failed.' }
    $mb = [math]::Round((Get-Item $exe).Length / 1MB, 1)
    Write-Host "`nDONE: $exe ($mb MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Before shipping it:" -ForegroundColor Yellow
    Write-Host "  1. Install and launch it once - a packaged build can fail on things"
    Write-Host "     a dev run never exercises (extraResources, the PDF guide viewer)."
    Write-Host "  2. Attach it to a GitHub Release; never commit it."
    Write-Host "  3. For the update channel, generate the manifest:"
    Write-Host "     npm run release:manifest -- 'release\AI-Account-Manager-Setup-$version.exe'"
} else {
    Write-Host "`nBuild finished but the installer was not found at:" -ForegroundColor Red
    Write-Host "  $exe" -ForegroundColor Red
    Write-Host "Check release\ for what electron-builder actually produced." -ForegroundColor Red
    exit 1
}
