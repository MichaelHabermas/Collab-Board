#Requires -Version 5.1
<#
.SYNOPSIS
    PM Interview - Create interview workspace for user research.
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

Write-Header "PM Interview Workspace Setup"

$LbiDir = Get-LbiDir
$InterviewDir = Join-Path $LbiDir "specs/$Feature/interviews"

if (-not (Test-Path $InterviewDir)) {
    New-Item -ItemType Directory -Path $InterviewDir -Force | Out-Null
}

$guideContent = @"
# Interview Guide

**Feature:** $Feature
**Target:** 10-15 interviews
**Duration:** 30-45 minutes each

---

## Interview Goals

1. Validate problem existence and severity
2. Understand current workarounds
3. Identify willingness to pay/change behavior

---

## Interview Script

### Opening (5 min)
- Thank them for their time
- Explain purpose (learning, not selling)

### Problem Exploration (15-20 min)
1. Tell me about the last time you experienced [problem]
2. How did you handle it?
3. What was frustrating about that?
4. How often does this happen?

### Validation (5 min)
1. How important is solving this? (1-10)
2. What would you pay for a solution?

### Closing (5 min)
- Any questions for me?
- Can I follow up if needed?
"@

Set-Content -Path (Join-Path $InterviewDir "interview-guide.md") -Value $guideContent -Encoding UTF8

$notesTemplate = @"
# Interview Notes

**Participant:** [Name/ID]
**Date:** [YYYY-MM-DD]
**Duration:** [X] minutes

---

## Key Quotes

> "[Direct quote]"

---

## Problem Observations

- Severity (1-10): [X]
- Frequency: [Daily/Weekly/Monthly]

## Insights

- Surprising: [What you didn't expect]
- Confirms: [What matched expectations]
"@

Set-Content -Path (Join-Path $InterviewDir "interview-notes-template.md") -Value $notesTemplate -Encoding UTF8

$synthesisContent = @"
# Interview Synthesis

**Feature:** $Feature
**Interviews Completed:** [X] / 10

---

## Summary

| Metric | Value |
|--------|-------|
| Total interviews | [X] |
| Average severity | [X.X] |
| Would pay | [X%] |

---

## Key Themes

1. [Theme 1]
2. [Theme 2]

---

## Validation Status

**Problem Validated:** [YES / NO / PARTIAL]
"@

Set-Content -Path (Join-Path $InterviewDir "synthesis.md") -Value $synthesisContent -Encoding UTF8

Write-Success "Created: interview-guide.md"
Write-Success "Created: interview-notes-template.md"
Write-Success "Created: synthesis.md"

Write-Host ""
Write-Success "PM Interview workspace initialized!"
Write-Info "Feature: $Feature"
Write-Info "Workspace: $InterviewDir"
