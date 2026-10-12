param([Parameter(Mandatory = $true)][string]$Installer, [Parameter(Mandatory = $true)][string]$Version)
$ErrorActionPreference = 'Stop'
try {
    $file = Get-Item -LiteralPath $Installer
    if ($file.Length -lt 1MB) { throw 'Installer is implausibly small.' }
    $actual = $file.VersionInfo.ProductVersion
    if ($actual -ne $Version) { throw "Installer ProductVersion '$actual' does not match '$Version'." }
    Write-Host "Verified Windows installer version $actual ($($file.Length) bytes)."
} catch {
    Write-Error $_
    exit 1
}
