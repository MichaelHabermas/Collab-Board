#Requires -Version 5.1
<#
.SYNOPSIS
    Setup CI matrix configuration.
.DESCRIPTION
    Creates multi-version and multi-platform CI matrix.
#>

Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
    function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
    function Get-ProjectRoot { (Get-Location).Path }
}

Write-Header "Setting up CI Matrix Configuration"

$ProjectRoot = Get-ProjectRoot
$WorkflowsDir = Join-Path $ProjectRoot ".github/workflows"
$MatrixFile = Join-Path $WorkflowsDir "ci-matrix.yml"

if (-not (Test-Path $WorkflowsDir)) {
    New-Item -ItemType Directory -Path $WorkflowsDir -Force | Out-Null
}

if (Test-Path $MatrixFile) {
    Write-Warning "CI matrix already exists: $MatrixFile"
    exit 0
}

$pyproject = Join-Path $ProjectRoot "pyproject.toml"
$packageJson = Join-Path $ProjectRoot "package.json"

$content = if (Test-Path $pyproject) {
@"
name: CI Matrix
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: `${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        python-version: ['3.10', '3.11', '3.12']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: `${{ matrix.python-version }}
      - run: pip install -e ".[dev]"
      - run: pytest tests/ -v
"@
} elseif (Test-Path $packageJson) {
@"
name: CI Matrix
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: `${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: ['18', '20', '22']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: `${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
"@
} else {
@"
name: CI Matrix
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: `${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v4
      - run: echo "Add your commands here"
"@
}

Set-Content -Path $MatrixFile -Value $content -Encoding UTF8
Write-Success "Created CI matrix workflow: $MatrixFile"
Write-Info "Customize the matrix configuration as needed"
