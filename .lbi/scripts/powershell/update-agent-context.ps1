#Requires -Version 5.1
<#
.SYNOPSIS
    Update Agent Context - Refresh AI agent context files.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Write-Header { param([string]$Title) Write-Host "`n=== $Title ===`n" }
    function Get-LbiDir { Join-Path (Get-Location) ".lbi" }
}

Write-Header "Update Agent Context"

$LbiDir = Get-LbiDir

# Detect agent context file
$AgentFile = $null
@("CLAUDE.md", "AGENTS.md", ".claude/README.md") | ForEach-Object {
    if ((Test-Path $_) -and -not $AgentFile) {
        $AgentFile = $_
    }
}

if (-not $AgentFile) {
    Write-Warning "No agent context file found"
    Write-Info "Creating AGENTS.md..."
    $AgentFile = "AGENTS.md"
}

Write-Info "Agent context file: $AgentFile"

# Detect language
$Language = "Unknown"
if (Test-Path "pyproject.toml") { $Language = "Python" }
elseif (Test-Path "package.json") { $Language = "JavaScript/TypeScript" }
elseif (Test-Path "go.mod") { $Language = "Go" }
elseif (Test-Path "Cargo.toml") { $Language = "Rust" }

# Count files
$TotalFiles = (Get-ChildItem -Recurse -Include "*.py","*.js","*.ts","*.go" -ErrorAction SilentlyContinue | Measure-Object).Count

$contextSection = @"

## Project Context (Auto-generated)

- **Language**: $Language
- **Source Files**: $TotalFiles
- **Last Updated**: $(Get-Date -Format "yyyy-MM-dd")

### LBI Configuration
- LBI Directory: $LbiDir
"@

if (Test-Path $AgentFile) {
    $content = Get-Content $AgentFile -Raw
    if ($content -match "## Project Context") {
        Write-Info "Updating existing context section..."
    } else {
        Add-Content -Path $AgentFile -Value $contextSection
    }
} else {
    $fullContent = @"
# AI Agent Operating Guide

This document provides context for AI coding agents.
$contextSection

## Working with this Codebase

[Add project-specific guidance here]
"@
    Set-Content -Path $AgentFile -Value $fullContent -Encoding UTF8
}

Write-Success "Agent context updated: $AgentFile"
Write-Info "Language: $Language"
Write-Info "Source files: $TotalFiles"
