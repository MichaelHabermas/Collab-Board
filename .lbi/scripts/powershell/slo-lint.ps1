#Requires -Version 5.1
<#
.SYNOPSIS
    SLO linting script.
#>

param([string]$SloDir = "./slos")

function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }

Write-Header "SLO Lint"

$Failures = 0

if (-not (Test-Path $SloDir)) {
    Write-Info "No SLO directory found at: $SloDir"
    Write-Info "Create SLOs with YAML files defining targets"
    exit 0
}

Write-Info "Checking SLO definitions in: $SloDir"

$sloFiles = Get-ChildItem $SloDir -Include "*.yaml","*.yml" -ErrorAction SilentlyContinue

foreach ($file in $sloFiles) {
    Write-Info "Validating: $($file.Name)"
    
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'target:' -and $content -match 'window:') {
        Write-Success "$($file.Name): has required fields"
    } else {
        Write-Warning "$($file.Name): missing target or window field"
        $Failures++
    }
}

Write-Host ""
if ($Failures -eq 0) {
    Write-Success "All SLOs are valid!"
} else {
    Write-Warning "$Failures SLO(s) have issues"
}
