#Requires -Version 5.1
<#
.SYNOPSIS
    Create Design - Generate design document template.
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

Write-Header "Create Design Document"

$LbiDir = Get-LbiDir
$FeatureDir = Join-Path $LbiDir "specs/$Feature"
$DesignFile = Join-Path $FeatureDir "design.md"

if (-not (Test-Path $FeatureDir)) {
    New-Item -ItemType Directory -Path $FeatureDir -Force | Out-Null
}

$designContent = @"
# Design Document: $Feature

**Author:** [Your name]
**Date:** $(Get-Date -Format "yyyy-MM-dd")
**Status:** Draft

---

## Overview

### Problem Statement
[What problem does this solve?]

### Goals
1. [Goal 1]
2. [Goal 2]

### Non-Goals
- [What this design explicitly does NOT address]

---

## Design

### High-Level Approach
[Overall strategy]

### Key Components

#### Component 1: [Name]
- **Purpose:** [What it does]
- **Interface:** [How others interact]

---

## Alternatives Considered

### Alternative 1: [Name]
- **Why not chosen:** [Reasoning]

---

## Implementation Plan

### Phase 1
- [ ] Task 1
- [ ] Task 2

---

## Risks

| Risk | Mitigation |
|------|------------|
| [Risk 1] | [Plan] |
"@

Set-Content -Path $DesignFile -Value $designContent -Encoding UTF8

Write-Success "Created: design.md"
Write-Info "Feature: $Feature"
Write-Info "Design file: $DesignFile"
