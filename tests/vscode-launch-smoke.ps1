$ErrorActionPreference = "Stop"

# Resolve VS Code the way a contributor's machine actually has it: a per-user
# install first, then a machine-wide one, then whatever is on PATH.
$candidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\Microsoft VS Code\Code.exe"),
    (Join-Path $env:ProgramFiles "Microsoft VS Code\Code.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Microsoft VS Code\Code.exe")
)
$code = $candidates |
    Where-Object { $_ -and (Test-Path -LiteralPath $_) } |
    Select-Object -First 1
if (-not $code) {
    # No ?. here - this has to parse under Windows PowerShell 5.1 too.
    $onPath = Get-Command code.cmd -ErrorAction SilentlyContinue
    if ($onPath) { $code = $onPath.Source }
}
if (-not $code) {
    throw "VS Code was not found. Install it, or put 'code' on PATH, then re-run."
}
Write-Output "VSCodePath=$code"

function Get-CodeWindowProcesses {
    @(Get-Process Code -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 })
}

function Start-CodeWindow([string]$folder) {
    $startInfo = [Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $code
    $startInfo.UseShellExecute = $false
    $startInfo.WorkingDirectory = [Environment]::GetFolderPath("UserProfile")
    $startInfo.ArgumentList.Add("--new-window")
    if ($folder) {
        $startInfo.ArgumentList.Add($folder)
    }
    $null = $startInfo.Environment.Remove("ELECTRON_RUN_AS_NODE")
    $null = $startInfo.Environment.Remove("NODE_OPTIONS")
    $process = [Diagnostics.Process]::Start($startInfo)
    if (-not $process.HasExited) {
        $process.WaitForExit(10000) | Out-Null
    }
    Start-Sleep -Seconds 5
}

$before = @(Get-CodeWindowProcesses | Select-Object -ExpandProperty Id)
Start-CodeWindow ""
$newFolderless = @(
    Get-CodeWindowProcesses | Where-Object { $_.Id -notin $before }
)
Write-Output "FolderlessNewWindows=$($newFolderless.Count)"
$newFolderless | Select-Object Id, MainWindowTitle, Responding | Format-Table -AutoSize

$smokeRoot = Join-Path $env:TEMP "aam-vscode-launch-smoke-$PID"
$project = Join-Path $smokeRoot "AAM smoke & O'Brien – 東京"
$resolvedTemp = [IO.Path]::GetFullPath($env:TEMP)
$resolvedSmoke = [IO.Path]::GetFullPath($smokeRoot)
if (-not $resolvedSmoke.StartsWith(
        $resolvedTemp + [IO.Path]::DirectorySeparatorChar,
        [StringComparison]::OrdinalIgnoreCase
    )) {
    throw "Temporary smoke path escaped the temporary directory."
}
New-Item -ItemType Directory -Path $project -Force | Out-Null

$beforeProject = @(Get-CodeWindowProcesses | Select-Object -ExpandProperty Id)
Start-CodeWindow $project
$newProject = @(
    Get-CodeWindowProcesses | Where-Object { $_.Id -notin $beforeProject }
)
Write-Output "ProjectNewWindows=$($newProject.Count)"
Write-Output "ProjectPath=$project"
$newProject | Select-Object Id, MainWindowTitle, Responding | Format-Table -AutoSize

$createdIds = @($newFolderless.Id) + @($newProject.Id)
foreach ($processId in $createdIds | Select-Object -Unique) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        $process.CloseMainWindow() | Out-Null
    }
}
Start-Sleep -Seconds 5
Write-Output "CreatedWindowsRemaining=$(@(Get-Process -Id $createdIds -ErrorAction SilentlyContinue).Count)"

if (Test-Path -LiteralPath $resolvedSmoke) {
    Remove-Item -LiteralPath $resolvedSmoke -Recurse -Force
}
Write-Output "TempRemoved=$(-not (Test-Path -LiteralPath $resolvedSmoke))"
