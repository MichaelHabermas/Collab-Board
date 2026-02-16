#Requires -Version 5.1
<#
.SYNOPSIS
    Get Feature Mode - Detect feature development mode.
#>
param(
    [string]$Feature = "",
    [string]$OutputFormat = "text"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Get-LbiDir { Join-Path (Get-Location) ".lbi" }
}

$LbiDir = Get-LbiDir
$Mode = "full"

# Check for quickfix marker
if ($Feature) {
    $FeatureDir = Join-Path $LbiDir "specs/$Feature"
    
    if (Test-Path (Join-Path $FeatureDir "quickfix.md")) {
        $Mode = "quickfix"
    } elseif (Test-Path (Join-Path $FeatureDir "request.md")) {
        $content = Get-Content (Join-Path $FeatureDir "request.md") -Raw
        if ($content -match "quickfix|quick fix|trivial|typo|hotfix") {
            $Mode = "quickfix"
        } elseif ($content -match "lite|lightweight|minimal") {
            $Mode = "lite"
        }
    }
}

# Check git diff for scope
if ($Mode -eq "full") {
    $stagedFiles = (& git diff --cached --name-only 2>$null | Measure-Object).Count
    if ($stagedFiles -le 2) {
        $Mode = "quickfix"
    } elseif ($stagedFiles -le 5) {
        $Mode = "lite"
    }
}

switch ($OutputFormat) {
    "json" {
        @{
            mode = $Mode
            feature = if ($Feature) { $Feature } else { "unknown" }
        } | ConvertTo-Json
    }
    "verbose" {
        Write-Info "Feature Mode Detection"
        Write-Host ""
        Write-Host "Mode: $Mode"
        Write-Host "Feature: $(if ($Feature) { $Feature } else { 'not specified' })"
    }
    default {
        Write-Host $Mode
    }
}
