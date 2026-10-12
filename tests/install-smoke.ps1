# Exercise the standalone installer with the actual built EXE and mocked GitHub/network/process calls.
# No application is installed and no user's account data is read or written.
param([Parameter(Mandatory = $true)][string]$Installer)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
. (Join-Path $root 'scripts\install.ps1')
$script:sourceInstaller = (Get-Item -LiteralPath $Installer).FullName
$script:version = (Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version
function Get-ItemProperty { param($Path, $ErrorAction)
    return @{ DisplayName = 'AI Account Manager'; DisplayVersion = $script:version; InstallLocation = (Join-Path $root 'release\win-unpacked') }
}
if (-not (Test-InstalledVersion $script:version)) { throw 'Actual built application ProductVersion was rejected by installation detection.' }
Remove-Item Function:\Get-ItemProperty
if (-not (Test-ApplicationProductVersion "$script:version.0" $script:version)) { throw 'Windows zero-revision product version was rejected.' }
if (Test-ApplicationProductVersion "$script:version.1" $script:version) { throw 'A different product revision was accepted.' }
if (Test-ApplicationProductVersion ($script:version + '0') $script:version) { throw 'A mismatched product version was accepted.' }
$script:digest = (Get-FileHash -LiteralPath $Installer -Algorithm SHA256).Hash.ToLowerInvariant()
$script:name = "AI-Account-Manager-Setup-$script:version.exe"
$script:url = "https://github.com/alijabbar04/ai-account-manager/releases/download/v$script:version/$script:name"
$script:launches = 0
$script:tamper = $false
$script:installed = $true
$script:checksum = "$script:digest  $script:name"
$script:release = @{ tag_name = "v$script:version"; draft = $false; prerelease = $false; assets = @(
    @{ name = $script:name; size = (Get-Item $Installer).Length; browser_download_url = $script:url },
    @{ name = 'SHA256SUMS.txt'; size = 100; browser_download_url = "https://github.com/alijabbar04/ai-account-manager/releases/download/v$script:version/SHA256SUMS.txt" },
    @{ name = 'latest.json'; size = 300; browser_download_url = "https://github.com/alijabbar04/ai-account-manager/releases/download/v$script:version/latest.json" }
) }
function Invoke-RestMethod { param($Uri, $Headers)
    if ($Uri -eq 'https://api.github.com/repos/alijabbar04/ai-account-manager/releases/latest') { return $script:release }
    return @{ version = $script:version; sha256 = $script:digest; downloadUrl = $script:url }
}
function Invoke-WebRequest { param([switch]$UseBasicParsing, $Uri, $Headers, $OutFile, $TimeoutSec)
    if ($Uri -like '*/latest.json') { return @{ Content = [Text.Encoding]::UTF8.GetBytes((@{ version = $script:version; sha256 = $script:digest; downloadUrl = $script:url } | ConvertTo-Json)) } }
    if (-not $OutFile) { return @{ Content = [Text.Encoding]::UTF8.GetBytes($script:checksum) } }
    Copy-Item -LiteralPath $script:sourceInstaller -Destination $OutFile
    if ($script:tamper) {
        $bytes = [IO.File]::ReadAllBytes($OutFile); $bytes[1024] = $bytes[1024] -bxor 1; [IO.File]::WriteAllBytes($OutFile, $bytes)
    }
}
function Start-Process { param($FilePath, [switch]$Wait, [switch]$PassThru)
    $script:launches++
    if ((Get-Content -LiteralPath $FilePath -Stream Zone.Identifier -Raw) -notmatch 'ZoneId=3') { throw 'Internet zone was not preserved.' }
    return @{ ExitCode = 0 }
}
function Test-InstalledVersion { param($Version) return $script:installed }
function Must-Fail { param([scriptblock]$Action)
    $failed = $false; try { & $Action } catch { $failed = $true; Write-Host "Expected rejection: $($_.Exception.Message)" }
    if (-not $failed) { throw 'Expected failure was reported as success.' }
}
$script:messages = @()
function Write-Host { param($Object, $ForegroundColor) $script:messages += [string]$Object }

$download = Install-AIAccountManager -DownloadOnly
if (-not (Test-Path -LiteralPath $download) -or $script:launches -ne 0) { throw 'Download-only smoke test failed.' }
Remove-Item -LiteralPath $download -Force
Install-AIAccountManager
if ($script:launches -ne 1) { throw 'Verified installer was not launched.' }
$script:tamper = $true
$script:messages = @()
Must-Fail { Install-AIAccountManager }
if ($script:launches -ne 1 -or ($script:messages -match '^SHA-256 verified|is installed')) { throw 'Tampered installer was executed or reported successful.' }
$script:tamper = $false
$script:checksum = "$script:checksum`n$script:checksum"
Must-Fail { Install-AIAccountManager }
if ($script:launches -ne 1) { throw 'Duplicate checksums allowed launch.' }
$script:checksum = "$script:digest  $script:name"
$script:installed = $false
$script:messages = @()
Must-Fail { Install-AIAccountManager }
if ($script:messages -match 'is installed') { throw 'Cancelled installation was reported successful.' }
Write-Output 'Windows PowerShell 5.1 installer smoke checks passed (mocked network/process; actual built EXE).'
