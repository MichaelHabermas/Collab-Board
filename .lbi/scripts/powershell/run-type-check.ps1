#Requires -Version 5.1
<#
.SYNOPSIS
    Run static type analysis for the project.
.DESCRIPTION
    Supports multiple type checkers and languages (Python, TypeScript, Go, Rust, PHP, Java).
.PARAMETER TargetPath
    The path to type check. Defaults to current directory.
.PARAMETER Strict
    If specified, enables strict mode for type checkers that support it.
#>

param(
    [string]$TargetPath = ".",
    [switch]$Strict
)

# Strict mode for better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Script-level variables
$Script:Failures = 0
$Script:CheckersRun = 0

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
}

Write-Header "Running Static Type Analysis"

$ProjectRoot = Get-ProjectRoot

function Invoke-PythonTypeCheck {
    Write-Subheader "Python Type Check"
    
    # Try mypy first
    if (Test-CommandExists "mypy") {
        Write-Info "Running mypy..."
        $mypyArgs = @($TargetPath)
        if ($Strict) {
            $mypyArgs = @("--strict", $TargetPath)
        }
        
        & mypy @mypyArgs 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "mypy passed!"
            $Script:CheckersRun++
        } else {
            Write-Warning "mypy found type issues"
            $Script:Failures++
            $Script:CheckersRun++
        }
    } elseif (Test-CommandExists "pyright") {
        Write-Info "Running pyright..."
        & pyright $TargetPath 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "pyright passed!"
            $Script:CheckersRun++
        } else {
            Write-Warning "pyright found type issues"
            $Script:Failures++
            $Script:CheckersRun++
        }
    } else {
        Write-Warning "No Python type checker found (mypy or pyright)"
        Write-Info "Install with: pip install mypy"
    }
}

function Invoke-TypeScriptTypeCheck {
    Write-Subheader "TypeScript Type Check"
    
    # Check if this is a TypeScript project
    $tsconfigPath = Join-Path $ProjectRoot "tsconfig.json"
    $packageJsonPath = Join-Path $ProjectRoot "package.json"
    
    if (-not (Test-Path $tsconfigPath)) {
        if (Test-Path $packageJsonPath) {
            $packageJson = Get-Content $packageJsonPath -Raw
            if ($packageJson -notmatch '"typescript"') {
                Write-Info "No TypeScript configuration found, skipping"
                return
            }
        } else {
            return
        }
    }
    
    # Try npm scripts first
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath -Raw
        if ($packageJson -match '"type-check"') {
            Write-Info "Running npm run type-check..."
            & npm run type-check 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "npm type-check passed!"
                $Script:CheckersRun++
                return
            } else {
                Write-Warning "npm type-check found issues"
                $Script:Failures++
                $Script:CheckersRun++
                return
            }
        }
    }
    
    # Fall back to tsc
    if ((Test-CommandExists "tsc") -or (Test-CommandExists "npx")) {
        Write-Info "Running tsc --noEmit..."
        if (Test-CommandExists "tsc") {
            & tsc --noEmit 2>&1 | Out-Host
        } else {
            & npx tsc --noEmit --skipLibCheck 2>&1 | Out-Host
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "tsc type check passed!"
            $Script:CheckersRun++
        } else {
            Write-Warning "tsc found type issues"
            $Script:Failures++
            $Script:CheckersRun++
        }
    } else {
        Write-Warning "TypeScript compiler not found"
        Write-Info "Install with: npm install -g typescript"
    }
}

function Invoke-GoTypeCheck {
    Write-Subheader "Go Type Check"
    
    Write-Info "Running go vet..."
    & go vet ./... 2>&1 | Out-Host
    if ($LASTEXITCODE -eq 0) {
        Write-Success "go vet passed!"
        $Script:CheckersRun++
    } else {
        Write-Warning "go vet found issues"
        $Script:Failures++
        $Script:CheckersRun++
    }
    
    # Also run staticcheck if available
    if (Test-CommandExists "staticcheck") {
        Write-Info "Running staticcheck..."
        & staticcheck ./... 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "staticcheck passed!"
        } else {
            Write-Warning "staticcheck found issues"
            $Script:Failures++
        }
    }
}

function Invoke-RustTypeCheck {
    Write-Subheader "Rust Type Check"
    
    if (Test-CommandExists "cargo") {
        Write-Info "Running cargo check..."
        & cargo check --quiet 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "cargo check passed!"
            $Script:CheckersRun++
        } else {
            Write-Warning "cargo check found issues"
            $Script:Failures++
            $Script:CheckersRun++
        }
    } else {
        Write-Warning "cargo not found"
    }
}

function Invoke-PhpTypeCheck {
    Write-Subheader "PHP Type Check"
    
    if (Test-CommandExists "phpstan") {
        Write-Info "Running phpstan..."
        & phpstan analyse $TargetPath 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "phpstan passed!"
            $Script:CheckersRun++
        } else {
            Write-Warning "phpstan found issues"
            $Script:Failures++
            $Script:CheckersRun++
        }
    } elseif (Test-CommandExists "psalm") {
        Write-Info "Running psalm..."
        & psalm $TargetPath 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "psalm passed!"
            $Script:CheckersRun++
        } else {
            Write-Warning "psalm found issues"
            $Script:Failures++
            $Script:CheckersRun++
        }
    } else {
        Write-Warning "No PHP type checker found (phpstan or psalm)"
        Write-Info "Install with: composer require --dev phpstan/phpstan"
    }
}

function Invoke-JavaTypeCheck {
    Write-Subheader "Java Type Check"
    
    # Maven projects
    $pomPath = Join-Path $ProjectRoot "pom.xml"
    if (Test-Path $pomPath) {
        if (Test-CommandExists "mvn") {
            Write-Info "Running mvn compile..."
            & mvn -q compile -DskipTests 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Maven compile passed!"
                $Script:CheckersRun++
            } else {
                Write-Warning "Maven compile found issues"
                $Script:Failures++
                $Script:CheckersRun++
            }
        } else {
            Write-Warning "Maven not found"
        }
    }
    
    # Gradle projects
    $buildGradlePath = Join-Path $ProjectRoot "build.gradle"
    $buildGradleKtsPath = Join-Path $ProjectRoot "build.gradle.kts"
    if ((Test-Path $buildGradlePath) -or (Test-Path $buildGradleKtsPath)) {
        $gradlewPath = Join-Path $ProjectRoot "gradlew.bat"
        if (Test-Path $gradlewPath) {
            Write-Info "Running gradlew compileJava..."
            & $gradlewPath compileJava --console=plain 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Gradle compile passed!"
                $Script:CheckersRun++
            } else {
                Write-Warning "Gradle compile found issues"
                $Script:Failures++
                $Script:CheckersRun++
            }
        } elseif (Test-CommandExists "gradle") {
            Write-Info "Running gradle compileJava..."
            & gradle compileJava --console=plain 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Gradle compile passed!"
                $Script:CheckersRun++
            } else {
                Write-Warning "Gradle compile found issues"
                $Script:Failures++
                $Script:CheckersRun++
            }
        } else {
            Write-Warning "Gradle not found"
        }
    }
}

# Detect and run type checkers
$FoundChecker = $false

# Python projects
if ((Test-Path (Join-Path $ProjectRoot "pyproject.toml")) -or (Test-Path (Join-Path $ProjectRoot "setup.py"))) {
    Invoke-PythonTypeCheck
    $FoundChecker = $true
}

# TypeScript projects
if ((Test-Path (Join-Path $ProjectRoot "tsconfig.json")) -or (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    Invoke-TypeScriptTypeCheck
    $FoundChecker = $true
}

# Go projects
if (Test-Path (Join-Path $ProjectRoot "go.mod")) {
    Invoke-GoTypeCheck
    $FoundChecker = $true
}

# Rust projects
if (Test-Path (Join-Path $ProjectRoot "Cargo.toml")) {
    Invoke-RustTypeCheck
    $FoundChecker = $true
}

# PHP projects
if (Test-Path (Join-Path $ProjectRoot "composer.json")) {
    Invoke-PhpTypeCheck
    $FoundChecker = $true
}

# Java projects
if ((Test-Path (Join-Path $ProjectRoot "pom.xml")) -or (Test-Path (Join-Path $ProjectRoot "build.gradle")) -or (Test-Path (Join-Path $ProjectRoot "build.gradle.kts"))) {
    Invoke-JavaTypeCheck
    $FoundChecker = $true
}

if (-not $FoundChecker) {
    Write-Warning "No type checker detected for this project type"
    Write-Info "Supported: mypy, pyright, tsc, go vet, cargo check, phpstan, psalm"
    exit 0
}

Write-Host ""
if ($Script:CheckersRun -eq 0) {
    Write-Warning "No type checkers were run"
    exit 0
} elseif ($Script:Failures -eq 0) {
    Write-Success "All type checks passed! ($Script:CheckersRun checker(s) ran)"
} else {
    Write-Warning "Type checking completed with $Script:Failures failure(s)"
    exit 1
}
