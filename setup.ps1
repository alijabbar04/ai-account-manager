# Developer setup for Windows PowerShell 5.1. End users should use scripts/install.ps1.
param([switch]$SkipTests)
$ErrorActionPreference = 'Stop'

function Invoke-CheckedNative {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command $($Arguments -join ' ') failed (exit $LASTEXITCODE)." }
}

Push-Location $PSScriptRoot
try {
    Write-Host '=== AI Account Manager developer setup ===' -ForegroundColor Cyan
    if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw 'Node.js is missing from PATH. Install Node.js 22 LTS (22.12 or newer), then open a new terminal.' }
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm.cmd is missing from PATH. Repair the Node.js installation and open a new terminal.' }
    $nodeVersion = (& node.exe --version).TrimStart('v')
    if ($LASTEXITCODE -ne 0 -or [version]$nodeVersion -lt [version]'22.12.0') { throw "Node.js 22.12+ is required by the locked build toolchain. Found $nodeVersion." }
    Write-Host "Node.js $nodeVersion; npm $(& npm.cmd --version)"
    if ($LASTEXITCODE -ne 0) { throw 'npm could not be started.' }
    if (-not (Get-Command dotnet.exe -ErrorAction SilentlyContinue)) { throw '.NET SDK 8+ is missing. Install the SDK (not just the runtime) from https://dotnet.microsoft.com/download.' }
    $sdks = & dotnet.exe --list-sdks
    if ($LASTEXITCODE -ne 0) { throw 'Could not list .NET SDKs.' }
    if (-not ($sdks | Where-Object { $_ -match '^(\d+)\.' -and [int]$Matches[1] -ge 8 })) { throw '.NET SDK 8+ is required; a .NET runtime alone cannot build the automation helper.' }
    if (-not (Test-Path -LiteralPath 'package-lock.json')) { throw 'package-lock.json is missing. Restore the tracked lockfile from Git; setup will not generate a new dependency tree.' }
    Invoke-CheckedNative node.exe @('scripts/verify-release.cjs')
    $lockHash = (Get-FileHash -LiteralPath 'package-lock.json' -Algorithm SHA256).Hash
    Write-Host '[1/3] Installing the exact locked dependencies...' -ForegroundColor Cyan
    # Use npm.cmd to avoid npm.ps1 execution-policy restrictions. Never retry with npm install.
    Invoke-CheckedNative npm.cmd @('ci')
    Invoke-CheckedNative node.exe @('scripts/verify-dependencies.cjs')
    if ((Get-FileHash -LiteralPath 'package-lock.json' -Algorithm SHA256).Hash -ne $lockHash) { throw 'The dependency install changed package-lock.json.' }
    Write-Host '[2/3] Verifying the Electron executable...' -ForegroundColor Cyan
    Invoke-CheckedNative node.exe @('scripts/ensure-electron.cjs')
    if ($SkipTests) {
        Write-Host '[3/3] Tests explicitly skipped; this checkout has not been validated.' -ForegroundColor Yellow
        Write-Host 'Dependencies ready. Run npm.cmd test before building or shipping.' -ForegroundColor Green
    } else {
        Write-Host '[3/3] Running JavaScript, runtime, native helper and harness checks...' -ForegroundColor Cyan
        Invoke-CheckedNative npm.cmd @('test')
        Write-Host 'Developer setup and tests completed successfully. Start with npm.cmd start.' -ForegroundColor Green
    }
    Write-Host 'Build the installer with .\build\build.ps1. Provider tools can be checked separately with .\scripts\install-prerequisites.ps1 -CheckOnly.'
} catch {
    Write-Host "Setup FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'ETARGET: update to a reviewed fixed checkout; do not replace every version string or regenerate the lockfile blindly.'
    Write-Host 'EPERM/EBUSY: close this checkout''s app, build processes and terminals holding files, then retry. Check free space and security-software logs; keep protection enabled.'
    Write-Host 'Network/proxy errors: check connectivity and your approved HTTPS_PROXY settings; do not disable TLS validation.'
    Write-Host 'Execution policy: review downloaded scripts, then use Unblock-File .\setup.ps1. If local policy permits, Set-ExecutionPolicy -Scope Process RemoteSigned affects this terminal only. Managed policy may require your administrator.'
    Write-Host 'No successful setup is being reported. See the command output and npm debug-log path above.'
    exit 1
} finally {
    Pop-Location
}
