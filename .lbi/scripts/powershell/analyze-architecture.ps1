#Requires -Version 5.1
<#
.SYNOPSIS
    Analyze architecture and generate documentation.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
    function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
    function Get-ProjectRoot { (Get-Location).Path }
    function Get-LbiDir { Join-Path (Get-ProjectRoot) ".lbi" }
}

Write-Header "Architecture Analysis"

$ProjectRoot = Get-ProjectRoot
$LbiDir = Get-LbiDir
$ArchDir = Join-Path $LbiDir "docs/technical/architecture"
$OutputFile = Join-Path $ArchDir "analysis.md"

if (-not (Test-Path $ArchDir)) {
    New-Item -ItemType Directory -Path $ArchDir -Force | Out-Null
}

Write-Info "Analyzing: $ProjectRoot"

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$dirs = Get-ChildItem $ProjectRoot -Directory -Depth 2 | Where-Object { $_.FullName -notmatch "node_modules|\.git|__pycache__" } | Select-Object -First 20

$content = @"
# Architecture Analysis

Generated: $timestamp

## Project Structure

``````
$($dirs.FullName -join "`n")
``````

## Key Components

See project root for entry points and configuration files.
"@

Set-Content -Path $OutputFile -Value $content -Encoding UTF8
Write-Success "Analysis saved to: $OutputFile"
