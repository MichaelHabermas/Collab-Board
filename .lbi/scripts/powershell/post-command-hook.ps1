#Requires -Version 5.1
<#
.SYNOPSIS
    Post-Command Hook - Execute post-command hooks.
#>
param(
    [Parameter(Mandatory=$true)][string]$Command,
    [int]$ExitCode = 0,
    [string]$Feature = ""
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Get-LbiDir { Join-Path (Get-Location) ".lbi" }
}

$LbiDir = Get-LbiDir
$HooksDir = Join-Path $LbiDir "hooks"

Write-Info "Running post-command hooks for: $Command"

# Execute command-specific hook
$HookFile = Join-Path $HooksDir "post-$Command.ps1"
if (Test-Path $HookFile) {
    Write-Info "Executing: $HookFile"
    try {
        & $HookFile -ExitCode $ExitCode -Feature $Feature
        Write-Success "Hook completed: post-$Command"
    } catch {
        Write-Warning "Hook failed: post-$Command"
    }
}

# Execute global hook
$GlobalHook = Join-Path $HooksDir "post-command.ps1"
if (Test-Path $GlobalHook) {
    Write-Info "Executing global hook"
    $env:LBI_COMMAND = $Command
    $env:LBI_EXIT_CODE = $ExitCode
    $env:LBI_FEATURE = $Feature
    
    try {
        & $GlobalHook
        Write-Success "Global hook completed"
    } catch {
        Write-Warning "Global hook failed"
    }
}

Write-Success "Post-command hooks completed for: $Command"
