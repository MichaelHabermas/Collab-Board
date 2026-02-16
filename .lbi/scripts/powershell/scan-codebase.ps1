#Requires -Version 5.1
<#
.SYNOPSIS
    Scan codebase for repository fingerprinting.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
    function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
    function Get-ProjectRoot { (Get-Location).Path }
}

Write-Header "Codebase Analysis"

$ProjectRoot = Get-ProjectRoot
Write-Info "Scanning: $ProjectRoot"

Write-Host "`n## Languages Detected"
if (Test-Path (Join-Path $ProjectRoot "pyproject.toml")) { Write-Host "- Python" }
if (Test-Path (Join-Path $ProjectRoot "package.json")) { Write-Host "- JavaScript/TypeScript" }
if (Test-Path (Join-Path $ProjectRoot "go.mod")) { Write-Host "- Go" }
if (Test-Path (Join-Path $ProjectRoot "Cargo.toml")) { Write-Host "- Rust" }

Write-Host "`n## Tools Detected"
if (Test-Path (Join-Path $ProjectRoot ".github/workflows")) { Write-Host "- GitHub Actions" }
if (Test-Path (Join-Path $ProjectRoot "Dockerfile")) { Write-Host "- Docker" }
if (Test-Path (Join-Path $ProjectRoot ".lbi")) { Write-Host "- LBI" }

Write-Host "`n## File Statistics"
$totalFiles = (Get-ChildItem $ProjectRoot -Recurse -File -ErrorAction SilentlyContinue).Count
$sourceFiles = (Get-ChildItem $ProjectRoot -Recurse -Include "*.py","*.js","*.ts","*.go" -File -ErrorAction SilentlyContinue).Count
Write-Host "- Total files: $totalFiles"
Write-Host "- Source files: $sourceFiles"

Write-Success "Scan complete!"
