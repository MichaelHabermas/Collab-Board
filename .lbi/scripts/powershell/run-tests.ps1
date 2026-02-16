#Requires -Version 5.1
<#
.SYNOPSIS
    Runs tests for the project.
.DESCRIPTION
    Supports multiple test frameworks and languages.
.PARAMETER Verbose
    Enable verbose output.
.PARAMETER Coverage
    Enable code coverage.
.PARAMETER TestPath
    Optional path to specific tests.
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$Coverage,
    
    [Parameter(Mandatory=$false)]
    [string]$TestPath = ""
)

$ErrorActionPreference = "Stop"

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

Write-Header "Running Tests"

$ProjectRoot = Get-ProjectRoot
$Script:FoundTests = $false

function Run-PythonTests {
    Write-Subheader "Python Tests (pytest)"
    
    $args = @()
    
    if ($Verbose) {
        $args += "-v"
    }
    
    if ($Coverage) {
        $args += "--cov"
    }
    
    if ($TestPath) {
        $args += $TestPath
    }
    
    $cmd = "pytest $($args -join ' ')"
    Write-Info "Running: $cmd"
    
    try {
        & pytest @args
        Write-Success "Python tests passed!"
    } catch {
        Write-Error "Python tests failed!"
        exit 1
    }
}

function Run-NodeTests {
    Write-Subheader "Node.js Tests"
    
    $pkgJson = Join-Path $ProjectRoot "package.json"
    $content = Get-Content $pkgJson -Raw
    
    if ($content -match '"test"') {
        Write-Info "Running: npm test"
        try {
            & npm test
            Write-Success "Node.js tests passed!"
        } catch {
            Write-Error "Node.js tests failed!"
            exit 1
        }
    } else {
        Write-Info "No test script found in package.json"
    }
}

function Run-GoTests {
    Write-Subheader "Go Tests"
    
    $args = @("test")
    
    if ($Verbose) {
        $args += "-v"
    }
    
    if ($Coverage) {
        $args += "-cover"
    }
    
    $args += "./..."
    
    $cmd = "go $($args -join ' ')"
    Write-Info "Running: $cmd"
    
    try {
        & go @args
        Write-Success "Go tests passed!"
    } catch {
        Write-Error "Go tests failed!"
        exit 1
    }
}

function Run-RustTests {
    Write-Subheader "Rust Tests"
    
    Write-Info "Running: cargo test"
    
    try {
        & cargo test
        Write-Success "Rust tests passed!"
    } catch {
        Write-Error "Rust tests failed!"
        exit 1
    }
}

# Detect and run tests
$pyprojectPath = Join-Path $ProjectRoot "pyproject.toml"
$setupPath = Join-Path $ProjectRoot "setup.py"
$packagePath = Join-Path $ProjectRoot "package.json"
$goModPath = Join-Path $ProjectRoot "go.mod"
$cargoPath = Join-Path $ProjectRoot "Cargo.toml"

if ((Test-Path $pyprojectPath) -or (Test-Path $setupPath)) {
    if (Test-CommandExists "pytest") {
        Run-PythonTests
        $Script:FoundTests = $true
    }
}

if (Test-Path $packagePath) {
    if (Test-CommandExists "npm") {
        Run-NodeTests
        $Script:FoundTests = $true
    }
}

if (Test-Path $goModPath) {
    if (Test-CommandExists "go") {
        Run-GoTests
        $Script:FoundTests = $true
    }
}

if (Test-Path $cargoPath) {
    if (Test-CommandExists "cargo") {
        Run-RustTests
        $Script:FoundTests = $true
    }
}

if (-not $Script:FoundTests) {
    Write-Warning "No test framework detected"
    Write-Info "Supported: pytest, npm test, go test, cargo test"
    exit 0
}

Write-Host ""
Write-Success "All tests completed!"
