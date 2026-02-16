#Requires -Version 5.1
<#
.SYNOPSIS
    Creates a new feature request.
.DESCRIPTION
    Sets up the initial request.md file for a new feature.
.PARAMETER FeatureName
    Name of the feature to create.
.PARAMETER Description
    Optional description for the feature.
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureName,
    
    [Parameter(Mandatory=$false)]
    [string]$Description = ""
)

$ErrorActionPreference = "Stop"

# Import common utilities
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonScript = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonScript) {
    . $CommonScript
} else {
    # Minimal fallback
    function Write-Info { param($Message) Write-Host "[INFO] $Message" }
    function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
    function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Get-ProjectRoot { (Get-Location).Path }
    function Get-LbiDir { Join-Path (Get-ProjectRoot) ".lbi" }
    function ConvertTo-Slug { param($Text) $Text.ToLower() -replace '\s+', '-' -replace '[^a-z0-9-]', '' }
    function Get-Timestamp { [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") }
}

# Setup paths
$ProjectRoot = Get-ProjectRoot
$LbiDir = Get-LbiDir
$FeatureSlug = ConvertTo-Slug $FeatureName
$SpecsDir = Join-Path $LbiDir "specs" $FeatureSlug
$RequestFile = Join-Path $SpecsDir "request.md"

Write-Info "Creating feature request: $FeatureName"
Write-Info "Feature slug: $FeatureSlug"

# Create specs directory
if (-not (Test-Path $SpecsDir)) {
    New-Item -ItemType Directory -Path $SpecsDir -Force | Out-Null
}

# Check if request already exists
if (Test-Path $RequestFile) {
    Write-Warning "Request file already exists: $RequestFile"
    $response = Read-Host "Overwrite existing request? [y/N]"
    if ($response -notmatch '^[yY]') {
        Write-Info "Aborted."
        exit 0
    }
}

# Create description
$DescriptionText = if ($Description) { $Description } else { "Describe what you want to accomplish." }

# Create request.md content
$RequestContent = @"
# Feature Request: $FeatureName

**Created:** $(Get-Timestamp)
**Status:** Draft

## Summary

$DescriptionText

## User Goals

- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Requirements

### Functional Requirements

- 

### Non-Functional Requirements

- 

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Notes

Add any additional context or notes here.

---

*Next step: Run ``lbi specify $FeatureSlug`` to create detailed specifications.*
"@

Set-Content -Path $RequestFile -Value $RequestContent -Encoding UTF8

Write-Success "Created request file: $RequestFile"
Write-Info "Edit the file to add your requirements"
Write-Info "Then run: lbi specify $FeatureSlug"
