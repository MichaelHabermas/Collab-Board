#Requires -Version 5.1
<#
.SYNOPSIS
    PM PRD - Create Product Requirements Document.
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

Write-Header "PM PRD Creation"

$LbiDir = Get-LbiDir
$FeatureDir = Join-Path $LbiDir "specs/$Feature"
$PrdFile = Join-Path $FeatureDir "prd.md"

if (-not (Test-Path $FeatureDir)) {
    New-Item -ItemType Directory -Path $FeatureDir -Force | Out-Null
}

$prdContent = @"
# Product Requirements Document

**Feature:** $Feature
**Author:** [Product Manager]
**Date:** $(Get-Date -Format "yyyy-MM-dd")
**Status:** Draft

---

## Executive Summary

[2-3 sentence overview]

---

## Problem Statement

### The Problem
[Clear description]

### Who Has This Problem
- Primary persona: [Description]
- Secondary persona: [Description]

### Evidence
- [X] interviews with severity > 7/10
- Competitive gap identified

---

## Solution Overview

### Proposed Solution
[High-level description]

### Key Features
1. **[Feature 1]:** [Description]
2. **[Feature 2]:** [Description]

### Out of Scope
- [What we're NOT building]

---

## User Stories

### US-001: [Title]
**As a** [persona]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

## Success Metrics

| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|
| [Metric 1] | [X] | [Y] | [Z weeks] |

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | [H/M/L] | [H/M/L] | [Plan] |

---

## Approval

| Role | Name | Date |
|------|------|------|
| Product Manager | | |
| Engineering Lead | | |
"@

Set-Content -Path $PrdFile -Value $prdContent -Encoding UTF8

Write-Success "Created: prd.md"

Write-Host ""
Write-Success "PRD template created!"
Write-Info "Feature: $Feature"
Write-Info "PRD file: $PrdFile"
Write-Host ""
Write-Info "Next: /lbi.pm.stories to break into user stories"
