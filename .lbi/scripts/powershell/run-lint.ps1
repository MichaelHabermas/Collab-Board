#Requires -Version 5.1
<#
.SYNOPSIS
    Runs linters for the project.
.DESCRIPTION
    Supports multiple linters and languages.
.PARAMETER Fix
    Automatically fix issues where possible.
.PARAMETER TargetPath
    Path to lint. Defaults to current directory.
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$Fix,
    
    [Parameter(Mandatory=$false)]
    [string]$TargetPath = "."
)

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

Write-Header "Running Linters"

$ProjectRoot = Get-ProjectRoot
$Script:Failures = 0
$Script:FoundLinter = $false

function Run-PythonLinters {
    Write-Subheader "Python Linters"
    
    # Try ruff first
    if (Test-CommandExists "ruff") {
        Write-Info "Running ruff check..."
        $ruffArgs = @("check", $TargetPath)
        if ($Fix) {
            $ruffArgs += "--fix"
        }
        
        try {
            & ruff @ruffArgs
            Write-Success "ruff check passed!"
        } catch {
            Write-Warning "ruff found issues"
            $Script:Failures++
        }
        
        # Ruff format
        Write-Info "Running ruff format check..."
        try {
            & ruff format --check $TargetPath 2>$null
            Write-Success "ruff format check passed!"
        } catch {
            Write-Warning "ruff format found issues"
            if ($Fix) {
                Write-Info "Formatting with ruff..."
                & ruff format $TargetPath
            }
        }
    } else {
        # Fall back to flake8 + black
        if (Test-CommandExists "flake8") {
            Write-Info "Running flake8..."
            try {
                & flake8 $TargetPath
                Write-Success "flake8 passed!"
            } catch {
                Write-Warning "flake8 found issues"
                $Script:Failures++
            }
        }
        
        if (Test-CommandExists "black") {
            Write-Info "Running black check..."
            try {
                & black --check $TargetPath 2>$null
                Write-Success "black check passed!"
            } catch {
                Write-Warning "black found formatting issues"
                if ($Fix) {
                    Write-Info "Formatting with black..."
                    & black $TargetPath
                }
            }
        }
    }
    
    # Type checking
    if (Test-CommandExists "mypy") {
        Write-Info "Running mypy..."
        try {
            & mypy $TargetPath
            Write-Success "mypy passed!"
        } catch {
            Write-Warning "mypy found type issues"
            $Script:Failures++
        }
    }
}

function Run-NodeLinters {
    Write-Subheader "Node.js Linters"
    
    if (Test-CommandExists "eslint") {
        Write-Info "Running eslint..."
        $eslintArgs = @($TargetPath)
        if ($Fix) {
            $eslintArgs += "--fix"
        }
        
        try {
            & eslint @eslintArgs
            Write-Success "eslint passed!"
        } catch {
            Write-Warning "eslint found issues"
            $Script:Failures++
        }
    } else {
        $pkgJson = Join-Path $ProjectRoot "package.json"
        if (Test-Path $pkgJson) {
            $content = Get-Content $pkgJson -Raw
            if ($content -match '"lint"') {
                Write-Info "Running npm run lint..."
                try {
                    & npm run lint
                    Write-Success "npm lint passed!"
                } catch {
                    Write-Warning "npm lint found issues"
                    $Script:Failures++
                }
            }
        }
    }
}

function Run-GoLinters {
    Write-Subheader "Go Linters"
    
    if (Test-CommandExists "golangci-lint") {
        Write-Info "Running golangci-lint..."
        $args = @("run")
        if ($Fix) {
            $args += "--fix"
        }
        
        try {
            & golangci-lint @args
            Write-Success "golangci-lint passed!"
        } catch {
            Write-Warning "golangci-lint found issues"
            $Script:Failures++
        }
    } else {
        Write-Info "Running go vet..."
        try {
            & go vet ./...
            Write-Success "go vet passed!"
        } catch {
            Write-Warning "go vet found issues"
            $Script:Failures++
        }
    }
}

function Run-RustLinters {
    Write-Subheader "Rust Linters"
    
    Write-Info "Running cargo clippy..."
    try {
        & cargo clippy -- -D warnings
        Write-Success "clippy passed!"
    } catch {
        Write-Warning "clippy found issues"
        $Script:Failures++
    }
    
    Write-Info "Running cargo fmt check..."
    try {
        & cargo fmt -- --check
        Write-Success "cargo fmt check passed!"
    } catch {
        Write-Warning "cargo fmt found formatting issues"
        if ($Fix) {
            Write-Info "Formatting with cargo fmt..."
            & cargo fmt
        }
    }
}

# Detect and run linters
$pyprojectPath = Join-Path $ProjectRoot "pyproject.toml"
$setupPath = Join-Path $ProjectRoot "setup.py"
$packagePath = Join-Path $ProjectRoot "package.json"
$goModPath = Join-Path $ProjectRoot "go.mod"
$cargoPath = Join-Path $ProjectRoot "Cargo.toml"

if ((Test-Path $pyprojectPath) -or (Test-Path $setupPath)) {
    Run-PythonLinters
    $Script:FoundLinter = $true
}

if (Test-Path $packagePath) {
    Run-NodeLinters
    $Script:FoundLinter = $true
}

if (Test-Path $goModPath) {
    Run-GoLinters
    $Script:FoundLinter = $true
}

if (Test-Path $cargoPath) {
    Run-RustLinters
    $Script:FoundLinter = $true
}

if (-not $Script:FoundLinter) {
    Write-Warning "No linter detected"
    Write-Info "Supported: ruff, black, flake8, eslint, golangci-lint, clippy"
    exit 0
}

Write-Host ""
if ($Script:Failures -eq 0) {
    Write-Success "All linters passed!"
} else {
    Write-Warning "Linting completed with $($Script:Failures) issue(s)"
    exit 1
}
