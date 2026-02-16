#Requires -Version 5.1
<#
.SYNOPSIS
    Check Architecture Freshness - Validate architecture docs are current.
#>

param([int]$StaleThresholdDays = 30)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Write-Header { param([string]$Title) Write-Host "`n=== $Title ===`n" }
    function Get-LbiDir { Join-Path (Get-Location) ".lbi" }
}

Write-Header "Architecture Freshness Check"

$LbiDir = Get-LbiDir
$ArchDir = Join-Path $LbiDir "docs/technical/architecture"

if (-not (Test-Path $ArchDir)) {
    Write-Warning "Architecture directory not found: $ArchDir"
    Write-Info "Run /lbi.architecture to generate architecture documentation"
    exit 1
}

Write-Host "## Architecture Documents"
Write-Host ""

$StaleCount = 0
$FreshCount = 0

$archFiles = Get-ChildItem $ArchDir -Filter "*.md" -ErrorAction SilentlyContinue

foreach ($file in $archFiles) {
    $ageDays = ((Get-Date) - $file.LastWriteTime).Days
    
    if ($ageDays -gt $StaleThresholdDays) {
        Write-Warning "  STALE: $($file.Name) ($ageDays days old)"
        $StaleCount++
    } else {
        Write-Success "  FRESH: $($file.Name) ($ageDays days old)"
        $FreshCount++
    }
}

Write-Host ""
Write-Host "## Summary"
Write-Host ""
Write-Host "Fresh documents: $FreshCount"
Write-Host "Stale documents: $StaleCount (>$StaleThresholdDays days)"
Write-Host ""

if ($StaleCount -gt 0) {
    Write-Warning "Some architecture documents are stale!"
    Write-Info "Run /lbi.architecture to refresh"
    exit 1
} else {
    Write-Success "All architecture documents are fresh!"
}
