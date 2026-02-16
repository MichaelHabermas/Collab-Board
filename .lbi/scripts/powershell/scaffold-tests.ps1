#Requires -Version 5.1
<#
.SYNOPSIS
    Scaffold test files.
#>
param(
    [string]$Module = "example",
    [string]$TestType = "unit"
)

function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }

Write-Header "Scaffolding Test Files"

if (Test-Path "pyproject.toml") {
    $testDir = "tests/$TestType"
    if (-not (Test-Path $testDir)) { New-Item -ItemType Directory -Path $testDir -Force | Out-Null }
    
    $testFile = Join-Path $testDir "test_$Module.py"
    if (-not (Test-Path $testFile)) {
        $content = @"
"""Tests for $Module module."""

import pytest


class Test$([cultureinfo]::CurrentCulture.TextInfo.ToTitleCase($Module)):
    """Tests for $Module."""

    def test_placeholder(self):
        """Placeholder test."""
        assert True
"@
        Set-Content -Path $testFile -Value $content -Encoding UTF8
        Write-Success "Created: $testFile"
    } else {
        Write-Info "Already exists: $testFile"
    }
} elseif (Test-Path "package.json") {
    $testDir = "__tests__/$TestType"
    if (-not (Test-Path $testDir)) { New-Item -ItemType Directory -Path $testDir -Force | Out-Null }
    
    $testFile = Join-Path $testDir "$Module.test.js"
    if (-not (Test-Path $testFile)) {
        $content = @"
describe('$Module', () => {
  test('placeholder', () => {
    expect(true).toBe(true);
  });
});
"@
        Set-Content -Path $testFile -Value $content -Encoding UTF8
        Write-Success "Created: $testFile"
    }
}

Write-Success "Scaffolding complete"
