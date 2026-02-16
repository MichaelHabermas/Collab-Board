#Requires -Version 5.1
<#
.SYNOPSIS
    Create new feature script.
.DESCRIPTION
    Scaffolds a new feature directory structure.
.PARAMETER FeatureName
    Name of the feature to create.
.PARAMETER Description
    Optional description of the feature.
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$FeatureName,
    
    [Parameter(Position=1)]
    [string]$Description = "No description provided"
)

$ErrorActionPreference = "Stop"

# Import common functions
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$ScriptDir\common.ps1"

Write-Header "Create New Feature"

# Slugify the feature name
$FeatureSlug = ConvertTo-Slug $FeatureName

Assert-LbiProject

$LbiDir = Get-LbiDir
$SpecsDir = Join-Path $LbiDir "specs"
$FeatureDir = Join-Path $SpecsDir $FeatureSlug

Write-Info "Creating feature: $FeatureSlug"

# Check if feature already exists
if (Test-Path $FeatureDir) {
    Write-Error "Feature '$FeatureSlug' already exists at $FeatureDir"
    exit 1
}

# Create feature directory
Confirm-Directory $FeatureDir

# Create request.md
$RequestFile = Join-Path $FeatureDir "request.md"
$Timestamp = Get-Timestamp
$RequestContent = @"
# Feature Request: $FeatureName

## Summary
$Description

## User Goals
- [ ] Goal 1: [What the user wants to achieve]
- [ ] Goal 2: [Expected outcome]
- [ ] Goal 3: [Success criteria]

## Context
[Background information and motivation for this feature]

## Scope
- **In Scope**: [What this feature includes]
- **Out of Scope**: [What this feature explicitly excludes]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---
Created: $Timestamp
"@
Set-Content -Path $RequestFile -Value $RequestContent -Encoding UTF8
Write-Success "Created: request.md"

# Create spec.md placeholder
$SpecFile = Join-Path $FeatureDir "spec.md"
$SpecContent = @"
# Specification: $FeatureName

## Technical Requirements
[Run /lbi.specify to generate detailed specifications]

---
Created: $Timestamp
Status: Pending
"@
Set-Content -Path $SpecFile -Value $SpecContent -Encoding UTF8
Write-Success "Created: spec.md (placeholder)"

# Create plan.md placeholder
$PlanFile = Join-Path $FeatureDir "plan.md"
$PlanContent = @"
# Implementation Plan: $FeatureName

## Approach
[Run /lbi.plan to generate implementation plan]

---
Created: $Timestamp
Status: Pending
"@
Set-Content -Path $PlanFile -Value $PlanContent -Encoding UTF8
Write-Success "Created: plan.md (placeholder)"

Write-Host ""
Write-Success "Feature '$FeatureSlug' created successfully!"
Write-Host ""
Write-Info "Feature directory: $FeatureDir"
Write-Info "Next step: Edit request.md and run /lbi.specify"

# Create git branch if in git repo
if (Test-CommandExists "git") {
    try {
        $insideGit = & git rev-parse --is-inside-work-tree 2>$null
        if ($insideGit) {
            Write-Host ""
            Write-Info "To create a git branch for this feature:"
            Write-Host "  git checkout -b feature/$FeatureSlug"
        }
    } catch {}
}
