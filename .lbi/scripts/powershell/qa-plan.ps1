#Requires -Version 5.1
<#
.SYNOPSIS
    QA planning script.
#>
param([string]$Feature)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
    function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
}

Write-Header "QA Test Planning"

$LbiDir = ".lbi"
$featureName = if ($Feature) { $Feature } else { "current" }
$OutputDir = Join-Path $LbiDir "specs/$featureName/qa"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$content = @"
# Test Plan

Generated: $((Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"))

## Scope
$featureName

## Test Types
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests

## Test Cases
_Define test cases based on specifications_
"@

$outputFile = Join-Path $OutputDir "test-plan.md"
Set-Content -Path $outputFile -Value $content -Encoding UTF8
Write-Success "Test plan created: $outputFile"
