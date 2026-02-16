#Requires -Version 5.1
<#
.SYNOPSIS
    Validate Slice Consistency - Check PR slice consistency.
#>
param([string]$Feature = "")

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

Write-Header "PR Slice Consistency Validation"

$LbiDir = Get-LbiDir

if (-not $Feature) {
    $specsDir = Join-Path $LbiDir "specs"
    if (Test-Path $specsDir) {
        $Feature = (Get-ChildItem $specsDir -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1).Name
    }
}

if (-not $Feature) {
    Write-Host "[ERROR] Feature name required" -ForegroundColor Red
    exit 1
}

$PlanFile = Join-Path $LbiDir "specs/$Feature/plan.md"
$Issues = 0

Write-Info "Validating slice consistency for: $Feature"

if (-not (Test-Path $PlanFile)) {
    Write-Warning "Plan file not found"
    exit 1
}

$content = Get-Content $PlanFile -Raw

if ($content -match "## PR Slices|### Slice") {
    Write-Success "  Slice definitions found in plan"
} else {
    Write-Warning "  No slice definitions found"
    $Issues++
}

Write-Host ""
Write-Host "## Validation Summary"
Write-Host ""

if ($Issues -eq 0) {
    Write-Success "All slice consistency checks passed!"
} else {
    Write-Warning "$Issues issue(s) found"
    exit 1
}
