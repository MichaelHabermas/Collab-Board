#Requires -Version 5.1
<#
.SYNOPSIS
    PM Discovery - Create discovery session workspace.
.DESCRIPTION
    Sets up brainstorming workspace with templates for opportunity scoring.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Header { param([string]$Title) Write-Host "`n=== $Title ===`n" }
    function Get-LbiDir { Join-Path (Get-Location) ".lbi" }
}

Write-Header "PM Discovery Session Setup"

$LbiDir = Get-LbiDir
$SessionId = Get-Date -Format "yyyyMMdd-HHmmss"
$DiscoveryDir = Join-Path $LbiDir "specs/pm-discovery/$SessionId"

if (-not (Test-Path $DiscoveryDir)) {
    New-Item -ItemType Directory -Path $DiscoveryDir -Force | Out-Null
}

$discoveryContent = @"
# PM Discovery Session

**Session ID:** $SessionId
**Date:** $(Get-Date -Format "yyyy-MM-dd")
**Product Manager:** [Your name]

---

## Session Goals

**Purpose:** Explore problems, brainstorm opportunities, score and prioritize.
**Target Outcome:** Choose ONE problem to pursue with confidence.

---

## Problem Space Exploration

List 3-5 problems/opportunities you're considering.

### Problem 1: [One-sentence description]

**Who Experiences This:**
- Target personas: [Primary users affected]
- Frequency: [How often they encounter it]
- Severity: [Critical / High / Medium / Low]

**Evidence So Far:**
- Source 1: [Evidence]
- Source 2: [Evidence]

**Business Impact:**
- Revenue: [Lost sales, churn]
- Cost: [Support overhead]
- Strategic: [Competitive disadvantage]

---

## Opportunity Scoring

| Problem | Impact | Effort | Confidence | Strategic | Score |
|---------|--------|--------|------------|-----------|-------|
| Problem 1 | [1-5] | [1-5] | [1-5] | [1-5] | [X.XX] |
| Problem 2 | [1-5] | [1-5] | [1-5] | [1-5] | [X.XX] |
| Problem 3 | [1-5] | [1-5] | [1-5] | [1-5] | [X.XX] |

---

## Next Steps

1. Run ``/lbi.pm.interview`` for user interviews
2. Run ``/lbi.pm.research`` for market analysis
3. Run ``/lbi.pm.validate-problem`` before PRD
"@

Set-Content -Path (Join-Path $DiscoveryDir "discovery.md") -Value $discoveryContent -Encoding UTF8

$matrixContent = @"
# Opportunity Scoring Matrix

## Scoring Framework

### Impact (1-5)
- **5** = Critical business need
- **4** = High impact on key metrics
- **3** = Meaningful improvement

### Effort (1-5)
- **5** = XXL (>6 months)
- **3** = L (1-3 months)
- **1** = S/XS (<2 weeks)

### Confidence (1-5)
- **5** = Very high (validated)
- **3** = Medium (some evidence)
- **1** = Very low (speculation)
"@

Set-Content -Path (Join-Path $DiscoveryDir "opportunity-matrix.md") -Value $matrixContent -Encoding UTF8

$metadata = @{
    session_id = $SessionId
    created_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    command = "/lbi.pm.discover"
    phase = "discovery"
    status = "in_progress"
    next_steps = @("/lbi.pm.interview", "/lbi.pm.research", "/lbi.pm.validate-problem")
} | ConvertTo-Json

Set-Content -Path (Join-Path $DiscoveryDir "session-metadata.json") -Value $metadata -Encoding UTF8

Write-Success "Created: discovery.md"
Write-Success "Created: opportunity-matrix.md"
Write-Success "Created: session-metadata.json"

Write-Host ""
Write-Success "PM Discovery session initialized!"
Write-Host ""
Write-Info "Session ID: $SessionId"
Write-Info "Workspace: $DiscoveryDir"
