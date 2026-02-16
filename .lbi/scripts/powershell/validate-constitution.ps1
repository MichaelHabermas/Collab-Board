#Requires -Version 5.1
<#
.SYNOPSIS
    Validates constitution/governance documentation.
.DESCRIPTION
    Checks for required constitution files and rules.
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

Write-Header "Constitution Validation"

$LbiDir = Get-LbiDir
$MemoryDir = Join-Path $LbiDir "memory"
$ConstFile = Join-Path $MemoryDir "constitution.md"
$Script:Failures = 0
$Script:Warnings = 0

# Check if constitution exists
if (-not (Test-Path $ConstFile)) {
    Write-Warning "Constitution file not found: $ConstFile"
    Write-Info "Run 'lbi constitution' to create governance documentation"
    exit 0
}

Write-Subheader "Checking Constitution Structure"

$content = Get-Content $ConstFile -Raw

# Required sections
$RequiredSections = @(
    "Project Identity",
    "Quality Standards",
    "Testing Policy",
    "Code Style"
)

foreach ($section in $RequiredSections) {
    if ($content -match $section) {
        Write-Success "Found section: $section"
    } else {
        Write-Warning "Missing section: $section"
        $Script:Warnings++
    }
}

Write-Subheader "Checking Governance Rules"

# Check for governance rules
if ($content -match "## Rules" -or $content -match "## Guidelines" -or $content -match "## Principles") {
    Write-Success "Constitution has governance rules"
} else {
    Write-Warning "Constitution may be missing explicit rules/guidelines"
    $Script:Warnings++
}

# Check for testing requirements
if ($content -match "test") {
    Write-Success "Constitution mentions testing"
} else {
    Write-Warning "Constitution may not specify testing requirements"
    $Script:Warnings++
}

# Summary
Write-Host ""
Write-Header "Summary"

if ($Script:Failures -eq 0 -and $Script:Warnings -eq 0) {
    Write-Success "Constitution validation passed!"
    exit 0
} elseif ($Script:Failures -eq 0) {
    Write-Warning "Passed with $($Script:Warnings) warning(s)"
    exit 0
} else {
    Write-Error "Failed with $($Script:Failures) error(s)"
    exit 1
}
