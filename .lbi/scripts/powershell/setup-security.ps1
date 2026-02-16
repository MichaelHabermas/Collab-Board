#Requires -Version 5.1
<#
.SYNOPSIS
    Setup security tooling configuration.
.DESCRIPTION
    Creates security scanning workflows and configurations.
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

Write-Header "Setting up Security Tooling"

$ProjectRoot = Get-ProjectRoot
$WorkflowsDir = Join-Path $ProjectRoot ".github/workflows"

if (-not (Test-Path $WorkflowsDir)) {
    New-Item -ItemType Directory -Path $WorkflowsDir -Force | Out-Null
}

# Create security workflow
$SecurityFile = Join-Path $WorkflowsDir "security.yml"
if (-not (Test-Path $SecurityFile)) {
    $content = @"
name: Security Scan
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'HIGH,CRITICAL'
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: `${{ secrets.GITHUB_TOKEN }}
"@
    Set-Content -Path $SecurityFile -Value $content -Encoding UTF8
    Write-Success "Created security workflow: $SecurityFile"
}

# Create pre-commit config
$PrecommitFile = Join-Path $ProjectRoot ".pre-commit-config.yaml"
if (-not (Test-Path $PrecommitFile)) {
    $content = @"
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
"@
    Set-Content -Path $PrecommitFile -Value $content -Encoding UTF8
    Write-Success "Created pre-commit config: $PrecommitFile"
}

Write-Host ""
Write-Success "Security tooling setup complete!"
Write-Info "Review and customize the security configurations as needed"
