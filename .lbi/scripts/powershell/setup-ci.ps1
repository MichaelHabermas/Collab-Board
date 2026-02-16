#Requires -Version 5.1
<#
.SYNOPSIS
    Setup GitHub Actions CI workflow scaffolding.
.DESCRIPTION
    Creates basic CI configuration based on project type.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

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

Write-Header "Setting up GitHub Actions CI"

$ProjectRoot = Get-ProjectRoot
$WorkflowsDir = Join-Path $ProjectRoot ".github/workflows"

# Detect project type
function Get-ProjectType {
    if (Test-Path (Join-Path $ProjectRoot "pyproject.toml")) { return "python" }
    if (Test-Path (Join-Path $ProjectRoot "package.json")) { return "node" }
    if (Test-Path (Join-Path $ProjectRoot "go.mod")) { return "go" }
    if (Test-Path (Join-Path $ProjectRoot "Cargo.toml")) { return "rust" }
    return "generic"
}

$ProjectType = Get-ProjectType
Write-Info "Detected project type: $ProjectType"

# Create workflows directory
if (-not (Test-Path $WorkflowsDir)) {
    New-Item -ItemType Directory -Path $WorkflowsDir -Force | Out-Null
}

$WorkflowFile = Join-Path $WorkflowsDir "ci.yml"

if (Test-Path $WorkflowFile) {
    Write-Warning "CI workflow already exists: $WorkflowFile"
} else {
    $content = switch ($ProjectType) {
        "python" { @"
name: CI
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -e ".[dev]"
      - run: ruff check .
      - run: pytest tests/ -v
"@ }
        "node" { @"
name: CI
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
"@ }
        default { @"
name: CI
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Add your build commands here"
"@ }
    }
    
    Set-Content -Path $WorkflowFile -Value $content -Encoding UTF8
    Write-Success "Created CI workflow: $WorkflowFile"
}

Write-Host ""
Write-Success "CI setup complete!"
Write-Info "Customize the workflow at: $WorkflowFile"
