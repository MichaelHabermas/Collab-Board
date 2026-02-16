#Requires -Version 5.1
<#
.SYNOPSIS
    Validates architecture documentation.
.DESCRIPTION
    Checks for required architecture files and structure.
#>

$ErrorActionPreference = "Continue"

# Import common utilities
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonScript = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonScript) {
    . $CommonScript
} else {
    function Write-Info { param($Message) Write-Host "[INFO] $Message" }
    function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
    function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Write-Header { param($Title) Write-Host "`n=== $Title ===`n" }
    function Write-Subheader { param($Title) Write-Host "`n--- $Title ---`n" }
    function Get-LbiDir { Join-Path (Get-Location).Path ".lbi" }
}

Write-Header "Architecture Validation"

$LbiDir = Get-LbiDir
$ArchDir = Join-Path $LbiDir "architecture"
$Script:Failures = 0
$Script:Warnings = 0

# Check if architecture directory exists
if (-not (Test-Path $ArchDir)) {
    Write-Warning "Architecture directory not found: $ArchDir"
    Write-Info "Run 'lbi architecture' to create architecture documentation"
    exit 0
}

Write-Subheader "Checking Required Files"

$RequiredFiles = @(
    "overview.md",
    "data-architecture.md",
    "component-architecture.md"
)

foreach ($file in $RequiredFiles) {
    $filePath = Join-Path $ArchDir $file
    if (Test-Path $filePath) {
        Write-Success "Found: $file"
    } else {
        Write-Warning "Missing: $file"
        $Script:Warnings++
    }
}

Write-Subheader "Checking File Content"

# Check overview.md
$overviewPath = Join-Path $ArchDir "overview.md"
if (Test-Path $overviewPath) {
    $content = Get-Content $overviewPath -Raw
    if ($content -match "## System Overview") {
        Write-Success "overview.md has System Overview section"
    } else {
        Write-Warning "overview.md missing 'System Overview' section"
        $Script:Warnings++
    }
}

# Check data-architecture.md
$dataArchPath = Join-Path $ArchDir "data-architecture.md"
if (Test-Path $dataArchPath) {
    $content = Get-Content $dataArchPath -Raw
    if ($content -match "## Data Model" -or $content -match "## Entity Catalog") {
        Write-Success "data-architecture.md has data model documentation"
    } else {
        Write-Warning "data-architecture.md may be missing data model documentation"
        $Script:Warnings++
    }
}

# Check component-architecture.md
$compArchPath = Join-Path $ArchDir "component-architecture.md"
if (Test-Path $compArchPath) {
    $content = Get-Content $compArchPath -Raw
    if ($content -match "## Component") {
        Write-Success "component-architecture.md has component documentation"
    } else {
        Write-Warning "component-architecture.md may be missing component documentation"
        $Script:Warnings++
    }
}

# Summary
Write-Host ""
Write-Header "Summary"

if ($Script:Failures -eq 0 -and $Script:Warnings -eq 0) {
    Write-Success "Architecture validation passed!"
    exit 0
} elseif ($Script:Failures -eq 0) {
    Write-Warning "Passed with $($Script:Warnings) warning(s)"
    exit 0
} else {
    Write-Error "Failed with $($Script:Failures) error(s)"
    exit 1
}
