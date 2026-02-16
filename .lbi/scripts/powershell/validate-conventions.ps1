#Requires -Version 5.1
<#
.SYNOPSIS
    Validates code conventions.
.DESCRIPTION
    Checks for coding standards compliance.
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
    function Get-ProjectRoot { (Get-Location).Path }
    function Test-CommandExists { param($Command) $null -ne (Get-Command $Command -ErrorAction SilentlyContinue) }
}

Write-Header "Code Conventions Validation"

$ProjectRoot = Get-ProjectRoot
$Script:Failures = 0
$Script:Warnings = 0

Write-Subheader "Checking Project Configuration"

# Check for common config files
$ConfigFiles = @(
    "pyproject.toml",
    ".editorconfig",
    ".gitignore"
)

foreach ($file in $ConfigFiles) {
    $filePath = Join-Path $ProjectRoot $file
    if (Test-Path $filePath) {
        Write-Success "Found: $file"
    } else {
        Write-Info "Optional: $file not found"
    }
}

Write-Subheader "Checking Python Conventions"

$pyprojectPath = Join-Path $ProjectRoot "pyproject.toml"
$setupPath = Join-Path $ProjectRoot "setup.py"

if ((Test-Path $pyprojectPath) -or (Test-Path $setupPath)) {
    Write-Info "Detected Python project"
    
    if (Test-Path $pyprojectPath) {
        $content = Get-Content $pyprojectPath -Raw
        
        # Check for type hints config
        if ($content -match "mypy") {
            Write-Success "Type checking configured in pyproject.toml"
        } else {
            Write-Warning "Type checking (mypy) not configured"
            $Script:Warnings++
        }
        
        # Check for linter config
        if ($content -match "ruff|flake8|pylint") {
            Write-Success "Linter configured in pyproject.toml"
        } else {
            Write-Warning "Linter not configured"
            $Script:Warnings++
        }
        
        # Check for formatter config
        if ($content -match "black|ruff.*format") {
            Write-Success "Formatter configured in pyproject.toml"
        } else {
            Write-Warning "Formatter not configured"
            $Script:Warnings++
        }
    }
}

Write-Subheader "Checking for Common Issues"

# Check for TODO/FIXME comments
$pyFiles = Get-ChildItem -Path $ProjectRoot -Filter "*.py" -Recurse -ErrorAction SilentlyContinue
if ($pyFiles) {
    $todoCount = 0
    foreach ($file in $pyFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $todoCount += ([regex]::Matches($content, "TODO|FIXME")).Count
        }
    }
    
    if ($todoCount -gt 0) {
        Write-Info "Found $todoCount TODO/FIXME comments"
    } else {
        Write-Success "No TODO/FIXME comments found"
    }
}

Write-Subheader "Checking Documentation"

# Check for README
$readmePath = Join-Path $ProjectRoot "README.md"
if (Test-Path $readmePath) {
    Write-Success "README.md exists"
    
    $lineCount = (Get-Content $readmePath).Count
    if ($lineCount -lt 10) {
        Write-Warning "README.md may need more content (only $lineCount lines)"
        $Script:Warnings++
    }
} else {
    Write-Warning "README.md not found"
    $Script:Warnings++
}

# Summary
Write-Host ""
Write-Header "Summary"

if ($Script:Failures -eq 0 -and $Script:Warnings -eq 0) {
    Write-Success "Conventions validation passed!"
    exit 0
} elseif ($Script:Failures -eq 0) {
    Write-Warning "Passed with $($Script:Warnings) warning(s)"
    exit 0
} else {
    Write-Error "Failed with $($Script:Failures) error(s)"
    exit 1
}
