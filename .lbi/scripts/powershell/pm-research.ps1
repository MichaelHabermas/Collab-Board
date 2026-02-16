#Requires -Version 5.1
<#
.SYNOPSIS
    PM Research - Create research workspace for market/competitive analysis.
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

Write-Header "PM Research Workspace Setup"

$LbiDir = Get-LbiDir
$ResearchDir = Join-Path $LbiDir "specs/$Feature/research"

if (-not (Test-Path $ResearchDir)) {
    New-Item -ItemType Directory -Path $ResearchDir -Force | Out-Null
}

$marketContent = @"
# Market Research

**Feature:** $Feature
**Date:** $(Get-Date -Format "yyyy-MM-dd")

---

## Market Sizing

### TAM (Total Addressable Market)
- Market size: `$[X]B
- Source: [Citation]

### SAM (Serviceable Addressable Market)
- Segment size: `$[X]M
- Our target: [Specific segment]

### SOM (Serviceable Obtainable Market)
- Realistic target: `$[X]M

---

## Target Segments

### Primary Segment
- Description: [Who they are]
- Size: [Number]
- Willingness to pay: [Range]
"@

Set-Content -Path (Join-Path $ResearchDir "market-research.md") -Value $marketContent -Encoding UTF8

$competitiveContent = @"
# Competitive Analysis

## Competitor Overview

| Competitor | Position | Strengths | Weaknesses |
|------------|----------|-----------|------------|
| [Name 1] | [Leader] | [List] | [List] |
| [Name 2] | [Challenger] | [List] | [List] |

---

## Competitive Gaps

### Gaps We Can Fill
1. [Gap 1]
2. [Gap 2]
"@

Set-Content -Path (Join-Path $ResearchDir "competitive-analysis.md") -Value $competitiveContent -Encoding UTF8

$synthesisContent = @"
# Research Synthesis

## Key Findings

- Market Opportunity: [Summary]
- Competitive Position: [Where we fit]
- Key Differentiator: [What sets us apart]

## Recommendation

**Go/No-Go:** [GO / NO-GO / NEEDS MORE DATA]
"@

Set-Content -Path (Join-Path $ResearchDir "synthesis.md") -Value $synthesisContent -Encoding UTF8

$metadata = @{
    feature = $Feature
    created_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    command = "/lbi.pm.research"
    phase = "research"
    status = "in_progress"
} | ConvertTo-Json

Set-Content -Path (Join-Path $ResearchDir "metadata.json") -Value $metadata -Encoding UTF8

Write-Success "Created: market-research.md"
Write-Success "Created: competitive-analysis.md"
Write-Success "Created: synthesis.md"
Write-Success "Created: metadata.json"

Write-Host ""
Write-Success "PM Research workspace initialized!"
Write-Info "Feature: $Feature"
Write-Info "Workspace: $ResearchDir"
