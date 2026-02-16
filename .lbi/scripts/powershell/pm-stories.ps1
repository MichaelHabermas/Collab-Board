#Requires -Version 5.1
<#
.SYNOPSIS
    PM Stories - Generate user stories from PRD.
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

Write-Header "PM User Stories Generation"

$LbiDir = Get-LbiDir
$FeatureDir = Join-Path $LbiDir "specs/$Feature"
$StoriesDir = Join-Path $FeatureDir "stories"

if (-not (Test-Path (Join-Path $FeatureDir "prd.md"))) {
    Write-Warning "PRD not found. Recommended: Run /lbi.pm.prd first"
}

if (-not (Test-Path $StoriesDir)) {
    New-Item -ItemType Directory -Path $StoriesDir -Force | Out-Null
}

$indexContent = @"
# User Stories Index

**Feature:** $Feature
**Generated:** $(Get-Date -Format "yyyy-MM-dd")

---

## Story Map

| ID | Title | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| US-001 | [Title] | [P1/P2/P3] | [S/M/L] | Draft |
| US-002 | [Title] | [P1/P2/P3] | [S/M/L] | Draft |

---

## Definition of Ready

A story is ready when:
- [ ] Acceptance criteria are clear
- [ ] Dependencies identified
- [ ] Estimated by team
"@

Set-Content -Path (Join-Path $StoriesDir "index.md") -Value $indexContent -Encoding UTF8

$templateContent = @"
# US-XXX: [Story Title]

**Epic:** $Feature
**Priority:** [P1/P2/P3]
**Estimate:** [S/M/L/XL]

---

## User Story

**As a** [persona/role]
**I want to** [action/capability]
**So that** [benefit/value]

---

## Acceptance Criteria

- [ ] **Given** [precondition]
  **When** [action]
  **Then** [expected result]

---

## Test Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Happy path | [Steps] | [Result] |
| Error case | [Steps] | [Result] |
"@

Set-Content -Path (Join-Path $StoriesDir "story-template.md") -Value $templateContent -Encoding UTF8

Write-Success "Created: stories/index.md"
Write-Success "Created: stories/story-template.md"

Write-Host ""
Write-Success "User stories workspace initialized!"
Write-Info "Feature: $Feature"
Write-Info "Stories directory: $StoriesDir"
