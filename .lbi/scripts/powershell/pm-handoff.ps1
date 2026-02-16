#Requires -Version 5.1
<#
.SYNOPSIS
    PM Handoff - Engineering handoff package.
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

Write-Header "PM Engineering Handoff"

$LbiDir = Get-LbiDir
$FeatureDir = Join-Path $LbiDir "specs/$Feature"
$HandoffFile = Join-Path $FeatureDir "handoff.md"

# Check prerequisites
$Ready = $true
Write-Info "Checking handoff prerequisites..."

function Test-HandoffFile {
    param([string]$Name, [string]$Path)
    if (Test-Path $Path) {
        Write-Success "  $Name"
        return $true
    } else {
        Write-Warning "  $Name (missing)"
        return $false
    }
}

if (-not (Test-HandoffFile "PRD" (Join-Path $FeatureDir "prd.md"))) { $Ready = $false }
if (-not (Test-HandoffFile "User Stories" (Join-Path $FeatureDir "stories/index.md"))) { $Ready = $false }
if (-not (Test-HandoffFile "Alignment" (Join-Path $FeatureDir "alignment.md"))) { $Ready = $false }

Write-Host ""

if (-not (Test-Path $FeatureDir)) {
    New-Item -ItemType Directory -Path $FeatureDir -Force | Out-Null
}

$handoffContent = @"
# Engineering Handoff

**Feature:** $Feature
**Handoff Date:** $(Get-Date -Format "yyyy-MM-dd")
**Product Manager:** [Name]
**Engineering Lead:** [Name]

---

## Handoff Checklist

### PM Deliverables
- [ ] PRD complete and approved
- [ ] User stories written
- [ ] Stakeholder alignment complete

### Engineering Ready
- [ ] Technical feasibility confirmed
- [ ] Team capacity allocated

---

## Artifact Links

| Artifact | Location | Status |
|----------|----------|--------|
| PRD | ./prd.md | [Status] |
| User Stories | ./stories/index.md | [Status] |
| Alignment | ./alignment.md | [Status] |

---

## Key Context

### Why We're Building This
[Summary]

### Who It's For
[Target personas]

### Success Criteria
[Metrics]

---

## Handoff Sign-Off

| Role | Name | Date |
|------|------|------|
| Product Manager | | Handed off |
| Engineering Lead | | Received |

---

## Next Steps

Engineering: Run /lbi.request to start SDD workflow
"@

Set-Content -Path $HandoffFile -Value $handoffContent -Encoding UTF8

Write-Success "Created: handoff.md"

Write-Host ""
if ($Ready) {
    Write-Success "All prerequisites met - ready for handoff!"
} else {
    Write-Warning "Some prerequisites missing - review before handoff"
}

Write-Info "Feature: $Feature"
Write-Info "Handoff file: $HandoffFile"
