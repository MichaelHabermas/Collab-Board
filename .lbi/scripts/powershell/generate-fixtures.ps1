#Requires -Version 5.1
<#
.SYNOPSIS
    Generate test fixtures script.
.DESCRIPTION
    Creates test fixture files for testing.
.PARAMETER OutputDir
    Directory to create fixtures in. Defaults to "fixtures".
#>

param(
    [Parameter(Position=0)]
    [string]$OutputDir = "fixtures"
)

$ErrorActionPreference = "Stop"

# Import common functions
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$ScriptDir\common.ps1"

Write-Header "Generate Test Fixtures"

Assert-LbiProject

$ProjectRoot = Get-ProjectRoot
$FixturesDir = Join-Path $ProjectRoot $OutputDir

Write-Info "Generating fixtures in: $FixturesDir"

Confirm-Directory $FixturesDir

# Generate sample JSON fixture
$JsonFile = Join-Path $FixturesDir "sample.json"
$JsonContent = @'
{
  "id": 1,
  "name": "Test Item",
  "description": "A sample test fixture",
  "active": true,
  "tags": ["test", "fixture", "sample"],
  "metadata": {
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  },
  "items": [
    {"id": 1, "value": "Item 1"},
    {"id": 2, "value": "Item 2"},
    {"id": 3, "value": "Item 3"}
  ]
}
'@
Set-Content -Path $JsonFile -Value $JsonContent -Encoding UTF8
Write-Success "Created: sample.json"

# Generate sample YAML fixture
$YamlFile = Join-Path $FixturesDir "sample.yaml"
$YamlContent = @'
# Sample YAML fixture
id: 1
name: Test Item
description: A sample test fixture
active: true
tags:
  - test
  - fixture
  - sample
metadata:
  created_at: "2024-01-01T00:00:00Z"
  updated_at: "2024-01-01T00:00:00Z"
  version: "1.0.0"
items:
  - id: 1
    value: Item 1
  - id: 2
    value: Item 2
  - id: 3
    value: Item 3
'@
Set-Content -Path $YamlFile -Value $YamlContent -Encoding UTF8
Write-Success "Created: sample.yaml"

# Generate sample CSV fixture
$CsvFile = Join-Path $FixturesDir "sample.csv"
$CsvContent = @'
id,name,email,active,created_at
1,John Doe,john@example.com,true,2024-01-01T00:00:00Z
2,Jane Smith,jane@example.com,true,2024-01-02T00:00:00Z
3,Bob Wilson,bob@example.com,false,2024-01-03T00:00:00Z
4,Alice Brown,alice@example.com,true,2024-01-04T00:00:00Z
5,Charlie Davis,charlie@example.com,true,2024-01-05T00:00:00Z
'@
Set-Content -Path $CsvFile -Value $CsvContent -Encoding UTF8
Write-Success "Created: sample.csv"

# Generate sample XML fixture
$XmlFile = Join-Path $FixturesDir "sample.xml"
$XmlContent = @'
<?xml version="1.0" encoding="UTF-8"?>
<items>
  <item id="1">
    <name>Test Item 1</name>
    <description>First test item</description>
    <active>true</active>
  </item>
  <item id="2">
    <name>Test Item 2</name>
    <description>Second test item</description>
    <active>true</active>
  </item>
  <item id="3">
    <name>Test Item 3</name>
    <description>Third test item</description>
    <active>false</active>
  </item>
</items>
'@
Set-Content -Path $XmlFile -Value $XmlContent -Encoding UTF8
Write-Success "Created: sample.xml"

# Generate sample text fixture
$TxtFile = Join-Path $FixturesDir "sample.txt"
$TxtContent = @'
Line 1: This is a sample text fixture.
Line 2: It contains multiple lines of text.
Line 3: Useful for testing text processing.
Line 4: Each line can be parsed separately.
Line 5: End of sample fixture.
'@
Set-Content -Path $TxtFile -Value $TxtContent -Encoding UTF8
Write-Success "Created: sample.txt"

# Generate conftest.py for Python projects
$PyProjectPath = Join-Path $ProjectRoot "pyproject.toml"
$SetupPyPath = Join-Path $ProjectRoot "setup.py"
if ((Test-Path $PyProjectPath) -or (Test-Path $SetupPyPath)) {
    $ConftestFile = Join-Path $FixturesDir "conftest.py"
    $ConftestContent = @'
"""
Pytest fixtures for testing.
"""

import json
import pytest
from pathlib import Path


@pytest.fixture
def fixtures_dir():
    """Get the fixtures directory path."""
    return Path(__file__).parent


@pytest.fixture
def sample_json(fixtures_dir):
    """Load sample.json fixture."""
    with open(fixtures_dir / "sample.json") as f:
        return json.load(f)


@pytest.fixture
def sample_csv_path(fixtures_dir):
    """Get path to sample.csv fixture."""
    return fixtures_dir / "sample.csv"
'@
    Set-Content -Path $ConftestFile -Value $ConftestContent -Encoding UTF8
    Write-Success "Created: conftest.py (Python fixtures)"
}

Write-Host ""
Write-Success "Fixtures generated successfully!"
Write-Info "Location: $FixturesDir"
