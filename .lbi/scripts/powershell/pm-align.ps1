#Requires -Version 5.1
<#
.SYNOPSIS
    PM Align - Stakeholder alignment checkpoint.
#>
param([Parameter(Mandatory=$true)][string]$Feature)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Header { param([string]$Title) Write-Host "`n=== $Title ===`n" }
    function Get-LbiDir { Join-Path (Get-Location) ".lbi" }
}

Write-Header "PM Stakeholder Alignment"

$LbiDir = Get-LbiDir
$FeatureDir = Join-Path $LbiDir "specs/$Feature"
$AlignmentFile = Join-Path $FeatureDir "alignment.md"

if (-not (Test-Path $FeatureDir)) {
    New-Item -ItemType Directory -Path $FeatureDir -Force | Out-Null
}

$alignmentContent = @"
# Stakeholder Alignment

**Feature:** $Feature
**Date:** $(Get-Date -Format "yyyy-MM-dd")
**Status:** Pending Alignment

---

## Alignment Meeting

**Date:** [Meeting date]
**Attendees:**
- [Name 1] - [Role]
- [Name 2] - [Role]

---

## Key Decisions Needed

### Decision 1: [Topic]
**Options:**
1. [Option A]
2. [Option B]

**Recommendation:** [Your recommendation]
**Decision:** [ ] Approved [ ] Rejected [ ] Deferred

---

## Scope Alignment

### Confirmed In Scope
- [Item 1]

### Confirmed Out of Scope
- [Item 1]

---

## Sign-Off

| Stakeholder | Role | Date |
|-------------|------|------|
| | Product Manager | |
| | Engineering Lead | |
| | Executive Sponsor | |

---

## Next Steps

After alignment: Run /lbi.pm.handoff
"@

Set-Content -Path $AlignmentFile -Value $alignmentContent -Encoding UTF8

Write-Success "Created: alignment.md"

Write-Host ""
Write-Success "Alignment document created!"
Write-Info "Feature: $Feature"
Write-Info "Alignment file: $AlignmentFile"
