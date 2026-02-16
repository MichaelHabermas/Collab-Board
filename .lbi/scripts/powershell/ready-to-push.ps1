#Requires -Version 5.1
<#
.SYNOPSIS
    Check if the project is ready to push.
.DESCRIPTION
    Runs validation checks before allowing push.
#>

$ErrorActionPreference = "Continue"

# Import common utilities
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonScript = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonScript) {
    . $CommonScript
} else {
    function Write-Info { param($Message) Write-Host "[INFO] $Message" }
    function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
    function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Write-Header { param($Title) Write-Host "`n=== $Title ===`n" }
    function Write-Subheader { param($Title) Write-Host "`n--- $Title ---`n" }
    function Test-CommandExists { param($Command) $null -ne (Get-Command $Command -ErrorAction SilentlyContinue) }
}

# Track failures
$Script:Failures = 0
$Script:Warnings = 0

function Add-Failure {
    param($Message)
    Write-Error $Message
    $Script:Failures++
}

function Add-Warning {
    param($Message)
    Write-Warning $Message
    $Script:Warnings++
}

Write-Header "Ready to Push Checks"

# Check 1: Git status
Write-Subheader "Git Status"
if (Test-CommandExists "git") {
    try {
        $null = & git rev-parse --is-inside-work-tree 2>$null
        $status = & git status --porcelain
        if ([string]::IsNullOrEmpty($status)) {
            Write-Success "Working directory is clean"
        } else {
            Add-Warning "Uncommitted changes detected"
            & git status --short
        }
    } catch {
        Add-Warning "Not in a git repository"
    }
} else {
    Add-Warning "Git not found"
}

# Check 2: Tests (if test script exists)
Write-Subheader "Tests"
$TestScript = Join-Path $ScriptDir "run-tests.ps1"
if (Test-Path $TestScript) {
    Write-Info "Running tests..."
    try {
        & $TestScript *>$null
        Write-Success "Tests passed"
    } catch {
        Add-Failure "Tests failed"
    }
} else {
    Write-Info "No test script found, skipping tests"
}

# Check 3: Linting (if lint script exists)
Write-Subheader "Linting"
$LintScript = Join-Path $ScriptDir "run-lint.ps1"
if (Test-Path $LintScript) {
    Write-Info "Running linter..."
    try {
        & $LintScript *>$null
        Write-Success "Linting passed"
    } catch {
        Add-Failure "Linting failed"
    }
} else {
    # Try common linters directly
    if (Test-CommandExists "ruff") {
        Write-Info "Running ruff..."
        try {
            & ruff check . *>$null
            Write-Success "Ruff check passed"
        } catch {
            Add-Warning "Ruff found issues"
        }
    } elseif (Test-CommandExists "flake8") {
        Write-Info "Running flake8..."
        try {
            & flake8 . *>$null
            Write-Success "Flake8 passed"
        } catch {
            Add-Warning "Flake8 found issues"
        }
    } else {
        Write-Info "No linter found, skipping lint check"
    }
}

# Check 4: Type checking (if mypy available)
Write-Subheader "Type Checking"
if (Test-CommandExists "mypy") {
    Write-Info "Running mypy..."
    try {
        & mypy . *>$null
        Write-Success "Type checking passed"
    } catch {
        Add-Warning "Type checking found issues"
    }
} else {
    Write-Info "Mypy not found, skipping type check"
}

# Check 5: Security scan (if available)
Write-Subheader "Security"
if (Test-CommandExists "bandit") {
    Write-Info "Running bandit..."
    try {
        & bandit -r . -q *>$null
        Write-Success "Security scan passed"
    } catch {
        Add-Warning "Security scan found issues"
    }
} else {
    Write-Info "Bandit not found, skipping security scan"
}

# Summary
Write-Host ""
Write-Header "Summary"

if ($Script:Failures -eq 0 -and $Script:Warnings -eq 0) {
    Write-Success "All checks passed! Ready to push."
    exit 0
} elseif ($Script:Failures -eq 0) {
    Write-Warning "Passed with $($Script:Warnings) warning(s)"
    Write-Info "You may want to address warnings before pushing."
    exit 0
} else {
    Write-Error "Failed with $($Script:Failures) error(s) and $($Script:Warnings) warning(s)"
    Write-Info "Please fix the errors before pushing."
    exit 1
}
