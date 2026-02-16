#Requires -Version 5.1
<#
.SYNOPSIS
    Review test results.
#>

function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }

Write-Header "Test Review"

$LbiDir = ".lbi"
$ReportDir = Join-Path $LbiDir "qa-reports"
if (-not (Test-Path $ReportDir)) { New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ReportFile = Join-Path $ReportDir "test-review-$timestamp.md"

$content = @"
# Test Review Report

Generated: $((Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"))

## Test Results Summary

_Run tests and paste results here_

## Coverage Analysis

_Add coverage data_

## Issues Found

_Document any failing tests_

## Recommendations

_Add recommendations_
"@

Set-Content -Path $ReportFile -Value $content -Encoding UTF8
Write-Success "Review report created: $ReportFile"
