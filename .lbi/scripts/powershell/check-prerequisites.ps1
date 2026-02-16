#Requires -Version 5.1
<#
.SYNOPSIS
    Check prerequisites for SDD workflow commands.
.DESCRIPTION
    Validates required files exist before proceeding with workflow commands.
.PARAMETER Command
    The workflow command to check prerequisites for.
.PARAMETER Feature
    The feature name to check.
.PARAMETER Strict
    If specified, treat warnings as errors.
#>

param(
    [string]$Command,
    [string]$Feature,
    [switch]$Strict
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Script-level variables
$Script:Failures = 0
$Script:Warnings = 0

# Import common utilities if available
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) {
    . $CommonPath
} else {
    function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
    function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }
    function Write-Header { param([string]$Title) Write-Host "`n═══════════════════════════════════════`n  $Title`n═══════════════════════════════════════`n" }
    function Write-Subheader { param([string]$Title) Write-Host "`n--- $Title ---`n" }
    function Test-CommandExists { param([string]$Command) $null -ne (Get-Command $Command -ErrorAction SilentlyContinue) }
    function Get-ProjectRoot { (Get-Location).Path }
    function Get-LbiDir { Join-Path (Get-ProjectRoot) ".lbi" }
}

Write-Header "Checking Prerequisites"

$ProjectRoot = Get-ProjectRoot
$LbiDir = Get-LbiDir

# Workflow dependencies
$CommandDependencies = @{
    "specify" = @("request.md")
    "clarify" = @("request.md", "spec.md")
    "plan" = @("request.md", "spec.md")
    "tasks" = @("request.md", "spec.md", "plan.md")
    "analyze" = @("request.md", "spec.md", "plan.md", "tasks.md")
    "implement" = @("request.md", "spec.md", "plan.md", "tasks.md")
    "tests" = @("request.md", "spec.md", "plan.md", "tasks.md")
    "review" = @("request.md", "spec.md", "plan.md", "tasks.md")
    "push" = @("request.md", "spec.md", "plan.md", "tasks.md")
}

function Test-LbiInitialized {
    Write-Subheader "LBI Project Check"
    
    if (-not (Test-Path $LbiDir)) {
        Write-Error "LBI not initialized. Run 'lbi init' first."
        $Script:Failures++
        return $false
    }
    
    $manifestPath = Join-Path $LbiDir "manifest.json"
    if (-not (Test-Path $manifestPath)) {
        Write-Warning "No manifest.json found. Project may not be properly initialized."
        $Script:Warnings++
    } else {
        Write-Success "LBI project initialized"
    }
    
    return $true
}

function Test-RequiredTools {
    Write-Subheader "Required Tools"
    
    $tools = @("git")
    
    foreach ($tool in $tools) {
        if (Test-CommandExists $tool) {
            Write-Success "$tool is available"
        } else {
            Write-Error "$tool is not installed"
            $Script:Failures++
        }
    }
}

function Test-RecommendedTools {
    Write-Subheader "Recommended Tools"
    
    $recommendedTools = @()
    
    if (Test-Path (Join-Path $ProjectRoot "pyproject.toml")) {
        $recommendedTools += @("ruff", "black", "mypy", "pytest")
    }
    
    if (Test-Path (Join-Path $ProjectRoot "package.json")) {
        $recommendedTools += @("npm", "prettier", "eslint")
    }
    
    if (Test-Path (Join-Path $ProjectRoot "go.mod")) {
        $recommendedTools += @("go", "golangci-lint")
    }
    
    foreach ($tool in $recommendedTools) {
        if (Test-CommandExists $tool) {
            Write-Success "$tool is available"
        } else {
            Write-Warning "$tool is not installed (recommended)"
            $Script:Warnings++
        }
    }
}

function Test-CommandPrerequisites {
    param([string]$Cmd)
    
    if ([string]::IsNullOrEmpty($Cmd)) {
        Write-Info "No command specified, checking general prerequisites"
        return
    }
    
    Write-Subheader "Command Prerequisites: $Cmd"
    
    $deps = $CommandDependencies[$Cmd]
    if (-not $deps) {
        Write-Info "No specific prerequisites for command: $Cmd"
        return
    }
    
    # Determine feature directory
    $featureDir = $null
    if (-not [string]::IsNullOrEmpty($Feature)) {
        $featureDir = Join-Path $LbiDir "specs/$Feature"
    } else {
        $specsDir = Join-Path $LbiDir "specs"
        if (Test-Path $specsDir) {
            $latest = Get-ChildItem $specsDir -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($latest) {
                $featureDir = $latest.FullName
            }
        }
    }
    
    if (-not $featureDir -or -not (Test-Path $featureDir)) {
        Write-Warning "No feature directory found. Create one first."
        $Script:Warnings++
        return
    }
    
    Write-Info "Checking feature directory: $featureDir"
    
    foreach ($dep in $deps) {
        $depPath = Join-Path $featureDir $dep
        if (Test-Path $depPath) {
            Write-Success "Found: $dep"
        } else {
            if ($Strict) {
                Write-Error "Missing: $dep"
                $Script:Failures++
            } else {
                Write-Warning "Missing: $dep"
                $Script:Warnings++
            }
        }
    }
}

function Test-Constitution {
    Write-Subheader "Constitution Check"
    
    $constitutionPath = Join-Path $LbiDir "memory/constitution.md"
    
    if (Test-Path $constitutionPath) {
        Write-Success "Constitution file exists"
    } else {
        Write-Warning "No constitution.md found. Run '/lbi constitution' to create one."
        $Script:Warnings++
    }
}

function Test-Architecture {
    Write-Subheader "Architecture Check"
    
    $archDir = Join-Path $LbiDir "docs/technical/architecture"
    
    if (Test-Path $archDir) {
        $archFiles = Get-ChildItem $archDir -Filter "*.md" -ErrorAction SilentlyContinue
        if ($archFiles -and $archFiles.Count -gt 0) {
            Write-Success "Architecture documentation exists ($($archFiles.Count) files)"
        } else {
            Write-Warning "Architecture directory exists but is empty"
            $Script:Warnings++
        }
    } else {
        Write-Info "No architecture documentation yet (optional)"
    }
}

function Test-GitStatus {
    Write-Subheader "Git Status"
    
    if (-not (Test-CommandExists "git")) {
        return
    }
    
    try {
        $insideGit = & git rev-parse --is-inside-work-tree 2>$null
        if (-not $insideGit) {
            Write-Warning "Not in a git repository"
            $Script:Warnings++
            return
        }
    } catch {
        Write-Warning "Not in a git repository"
        $Script:Warnings++
        return
    }
    
    $status = & git status --porcelain 2>$null
    if ([string]::IsNullOrEmpty($status)) {
        Write-Success "No uncommitted changes"
    } else {
        Write-Warning "There are uncommitted changes"
        $Script:Warnings++
    }
    
    $branch = & git rev-parse --abbrev-ref HEAD 2>$null
    Write-Info "Current branch: $branch"
}

# Main execution
if (-not (Test-LbiInitialized)) {
    exit 1
}

Test-RequiredTools
Test-RecommendedTools
Test-CommandPrerequisites -Cmd $Command
Test-Constitution
Test-Architecture
Test-GitStatus

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host "  Summary"
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host ""

if ($Script:Failures -eq 0 -and $Script:Warnings -eq 0) {
    Write-Success "All prerequisites met!"
} elseif ($Script:Failures -eq 0) {
    Write-Warning "Prerequisites met with $Script:Warnings warning(s)"
    exit 0
} else {
    Write-Error "Prerequisites check failed with $Script:Failures error(s) and $Script:Warnings warning(s)"
    exit 1
}
