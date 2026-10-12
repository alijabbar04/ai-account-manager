# Windows PowerShell 5.1; standalone, with no developer toolchain required.
param([switch]$DownloadOnly)
$ErrorActionPreference = 'Stop'

function Invoke-ReleaseDownload {
    param([string]$Uri, $Headers, [string]$OutFile)
    # Retry only idempotent reads; verification still happens after the final download.
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            $parameters = @{ UseBasicParsing = $true; Uri = $Uri; Headers = $Headers; TimeoutSec = 300 }
            if ($OutFile) { $parameters.OutFile = $OutFile }
            return Invoke-WebRequest @parameters
        } catch {
            if ($attempt -eq 3) { throw }
            Write-Host "Download attempt $attempt failed; retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds $attempt
        }
    }
}

function Convert-ReleaseText {
    param($Content)
    # Windows PowerShell 5.1 returns byte[] for GitHub's application/octet-stream assets.
    if ($Content -is [byte[]]) { return [Text.Encoding]::UTF8.GetString($Content) }
    return [string]$Content
}

function Get-OfficialAssetUrl {
    param($Release, [string]$Name)
    $assets = @($Release.assets | Where-Object { $_.name -ceq $Name })
    if ($assets.Count -ne 1 -or $assets[0].size -le 0) { throw "Missing or duplicate release asset: $Name" }
    $expected = "https://github.com/alijabbar04/ai-account-manager/releases/download/$($Release.tag_name)/$Name"
    if ($assets[0].browser_download_url -cne $expected) { throw "Unexpected download URL for $Name" }
    return $expected
}

function Get-InstallerDigest {
    param([string]$Checksums, [string]$Name)
    $entries = @($Checksums -split "`n" | Where-Object { $_.TrimEnd("`r") -match ('^([a-fA-F0-9]{64})  ' + [regex]::Escape($Name) + '$') })
    if ($entries.Count -ne 1) { throw "Missing or duplicate SHA-256 checksum for $Name" }
    return ($entries[0].Substring(0, 64)).ToLowerInvariant()
}

function Assert-InstallerDownload {
    param([string]$File, [string]$Digest, $Manifest, [string]$Version, [string]$Url, [long]$Size)
    if ($Digest -notmatch '^[a-f0-9]{64}$') { throw 'Invalid SHA-256 checksum.' }
    if ($Manifest.version -cne $Version -or $Manifest.downloadUrl -cne $Url -or $Manifest.sha256 -cne $Digest) {
        throw 'Release manifest disagrees with the version, asset URL or checksum.'
    }
    $item = Get-Item -LiteralPath $File
    if ($Size -lt 1MB -or $item.Length -ne $Size) { throw 'Installer download is incomplete or implausibly small.' }
    $actual = (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -cne $Digest) { throw 'SHA-256 verification FAILED. The installer will not be run. Delete the download and retry from the official release.' }
    $stream = [System.IO.File]::OpenRead($File)
    try {
        if ($stream.ReadByte() -ne 77 -or $stream.ReadByte() -ne 90) { throw 'Downloaded asset is not a Windows executable.' }
    } finally { $stream.Dispose() }
    if (-not (Test-ApplicationProductVersion $item.VersionInfo.ProductVersion $Version)) { throw 'Installer product version does not match the release.' }
}

function Test-ApplicationProductVersion {
    param([string]$Actual, [string]$Expected)
    # Windows executable resources may append a zero revision to the npm version.
    return ($Actual -ceq $Expected -or $Actual -ceq "$Expected.0")
}

function Test-InstalledVersion {
    param([string]$Version)
    foreach ($registryRoot in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall')) {
        foreach ($entry in @(Get-ItemProperty "$registryRoot\*" -ErrorAction SilentlyContinue)) {
            if ($entry.DisplayName -eq 'AI Account Manager' -and $entry.DisplayVersion -eq $Version -and $entry.InstallLocation) {
                $exe = Join-Path $entry.InstallLocation 'AI Account Manager.exe'
                if ((Test-Path -LiteralPath $exe) -and (Test-ApplicationProductVersion (Get-Item -LiteralPath $exe).VersionInfo.ProductVersion $Version)) { return $true }
            }
        }
    }
    return $false
}

function Install-AIAccountManager {
    param([switch]$DownloadOnly)
    # PowerShell 5.1's per-chunk progress rendering can make large downloads very slow.
    $ProgressPreference = 'SilentlyContinue'
    $previousTls = [Net.ServicePointManager]::SecurityProtocol
    $download = $null
    $directory = $null
    $retainDownload = $false
    try {
        if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT -or -not [Environment]::Is64BitOperatingSystem) { throw 'Windows x64 is required.' }
        [Net.ServicePointManager]::SecurityProtocol = $previousTls -bor [Net.SecurityProtocolType]::Tls12
        $headers = @{ 'User-Agent' = 'AI-Account-Manager-Installer'; 'Accept' = 'application/vnd.github+json' }
        $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/alijabbar04/ai-account-manager/releases/latest' -Headers $headers
        if ($release.draft -or $release.prerelease -or $release.tag_name -notmatch '^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$') { throw 'The latest release is not a stable application version.' }
        $version = $release.tag_name.Substring(1)
        $name = "AI-Account-Manager-Setup-$version.exe"
        $url = Get-OfficialAssetUrl $release $name
        $checksumUrl = Get-OfficialAssetUrl $release 'SHA256SUMS.txt'
        $manifestUrl = Get-OfficialAssetUrl $release 'latest.json'
        Write-Host "Downloading latest published stable version $version from alijabbar04/ai-account-manager..."
        $checksums = Convert-ReleaseText (Invoke-ReleaseDownload -Uri $checksumUrl -Headers $headers).Content
        $digest = Get-InstallerDigest $checksums $name
        $manifest = Convert-ReleaseText (Invoke-ReleaseDownload -Uri $manifestUrl -Headers $headers).Content | ConvertFrom-Json
        # All cleanup stays inside the unique directory created by this invocation.
        $directory = Join-Path ([IO.Path]::GetTempPath()) ("AIAccountManager-install-" + [Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $directory | Out-Null
        $download = Join-Path $directory $name
        Invoke-ReleaseDownload -Uri $url -Headers $headers -OutFile $download
        $size = @($release.assets | Where-Object { $_.name -ceq $name })[0].size
        Assert-InstallerDownload $download $digest $manifest $version $url $size
        # Preserve Internet-zone treatment so Windows can apply SmartScreen.
        Set-Content -LiteralPath $download -Stream Zone.Identifier -Value "[ZoneTransfer]`r`nZoneId=3`r`nHostUrl=$url" -Encoding ASCII
        Write-Host "SHA-256 verified for version $version." -ForegroundColor Green
        if ($DownloadOnly) { $retainDownload = $true; Write-Host "Verified download: $download"; return $download }
        # Interactive installer: Defender, SmartScreen and user choices remain active.
        $process = Start-Process -FilePath $download -Wait -PassThru
        if ($process.ExitCode -ne 0) { throw "Installer exited with code $($process.ExitCode)." }
        if (-not (Test-InstalledVersion $version)) { throw 'Installation was cancelled or could not be verified. No successful installation is being reported.' }
        Write-Host "AI Account Manager $version is installed. Open it from the Start menu." -ForegroundColor Green
    } catch {
        if ($download -and (Test-Path -LiteralPath $download)) { Remove-Item -LiteralPath $download -Force }
        throw "AI Account Manager installation failed: $($_.Exception.Message) See https://github.com/alijabbar04/ai-account-manager/releases/latest. For HTTP 403/rate limits or network/proxy errors, retry later or use the manual download instructions."
    } finally {
        [Net.ServicePointManager]::SecurityProtocol = $previousTls
        if (-not $retainDownload) {
            if ($download -and (Test-Path -LiteralPath $download)) { Remove-Item -LiteralPath $download -Force -ErrorAction SilentlyContinue }
            if ($directory -and (Test-Path -LiteralPath $directory)) { Remove-Item -LiteralPath $directory -ErrorAction SilentlyContinue }
        }
    }
}

# Dot-sourcing exposes the functions to regression tests without installing.
if ($MyInvocation.InvocationName -ne '.') { Install-AIAccountManager -DownloadOnly:$DownloadOnly }
