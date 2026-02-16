#Requires -Version 5.1
<#
.SYNOPSIS
    PM Validate Problem - Validate problem before proceeding to PRD.
#>
param([Parameter(Mandatory=$true)][string]$Feature)

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

Write-Header "PM Problem Validation"

$LbiDir = Get-LbiDir
$FeatureDir = Join-Path $LbiDir "specs/$Feature"
$ValidationFile = Join-Path $FeatureDir "problem-validation.md"

# Check prerequisites
$ChecksPassed = 0
$ChecksTotal = 0

function Test-Artifact {
    param([string]$Name, [string]$Path)
    $script:ChecksTotal++
    if (Test-Path $Path) {
        Write-Success "  $Name exists"
        $script:ChecksPassed++
        return $true
    } else {
        Write-Warning "  $Name missing"
        return $false
    }
}

Write-Info "Checking evidence artifacts..."
Test-Artifact "Interview synthesis" (Join-Path $FeatureDir "interviews/synthesis.md") | Out-Null
Test-Artifact "Market research" (Join-Path $FeatureDir "research/market-research.md") | Out-Null
Test-Artifact "Competitive analysis" (Join-Path $FeatureDir "research/competitive-analysis.md") | Out-Null
Test-Artifact "Research synthesis" (Join-Path $FeatureDir "research/synthesis.md") | Out-Null

Write-Host ""
Write-Info "Evidence check: $ChecksPassed / $ChecksTotal artifacts found"

if (-not (Test-Path $FeatureDir)) {
    New-Item -ItemType Directory -Path $FeatureDir -Force | Out-Null
}

$validationContent = @"
# Problem Validation

**Feature:** $Feature
**Date:** $(Get-Date -Format "yyyy-MM-dd")

---

## Evidence Summary

Artifacts found: $ChecksPassed / $ChecksTotal

---

## Validation Checklist

### Problem Evidence
- [ ] Problem is clearly defined
- [ ] Target users identified
- [ ] Problem severity validated (> 7/10)

### Market Evidence
- [ ] Market size estimated
- [ ] Competitive landscape mapped

### User Evidence
- [ ] 10+ interviews completed
- [ ] Consistent themes identified

---

## Validation Scores

| Criteria | Score (1-5) |
|----------|-------------|
| Problem clarity | [X] |
| User evidence | [X] |
| Market opportunity | [X] |
| **Total** | [X/15] |

---

## Go/No-Go Decision

**Decision:** [ ] GO  [ ] NO-GO  [ ] NEEDS MORE DATA

**If GO:** Run /lbi.pm.prd next
**If NO-GO:** Document reasoning
**If NEEDS MORE DATA:** List what's missing
"@

Set-Content -Path $ValidationFile -Value $validationContent -Encoding UTF8

Write-Success "Created: problem-validation.md"

Write-Host ""
if ($ChecksPassed -ge 3) {
    Write-Success "Sufficient evidence found for validation"
} else {
    Write-Warning "Limited evidence - consider gathering more data"
}

Write-Info "Validation file: $ValidationFile"
