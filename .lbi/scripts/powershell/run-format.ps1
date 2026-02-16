#Requires -Version 5.1
<#
.SYNOPSIS
    Run code formatters for the project.
.DESCRIPTION
    Supports multiple formatters and languages (Python, Node, Go, Rust, PHP).
    Use -CheckOnly to verify formatting without making changes.
.PARAMETER TargetPath
    The path to format. Defaults to current directory.
.PARAMETER CheckOnly
    If specified, only check formatting without making changes.
#>

param(
    [string]$TargetPath = ".",
    [switch]$CheckOnly
)

# Strict mode for better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Script-level variables
$Script:Formatted = 0
$Script:Failures = 0

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

Write-Header "Running Code Formatters"

$ProjectRoot = Get-ProjectRoot

function Invoke-PythonFormatters {
    Write-Subheader "Python Formatters"
    
    # Try ruff first (fast, modern)
    if (Test-CommandExists "ruff") {
        Write-Info "Running ruff format..."
        if ($CheckOnly) {
            $result = & ruff format --check $TargetPath 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "ruff format check passed!"
            } else {
                Write-Warning "ruff format found issues (run without -CheckOnly to fix)"
                $Script:Failures++
            }
        } else {
            & ruff format $TargetPath
            if ($LASTEXITCODE -eq 0) {
                Write-Success "ruff format completed!"
                $Script:Formatted++
            } else {
                Write-Warning "ruff format encountered issues"
                $Script:Failures++
            }
        }
        
        # Also run ruff fix
        Write-Info "Running ruff fix..."
        if ($CheckOnly) {
            $result = & ruff check $TargetPath 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "ruff check passed!"
            } else {
                Write-Warning "ruff check found issues"
            }
        } else {
            & ruff check --fix $TargetPath 2>&1 | Out-Null
            Write-Success "ruff fix completed!"
        }
    }
    
    # Fall back to black if ruff not available
    if (-not (Test-CommandExists "ruff") -and (Test-CommandExists "black")) {
        Write-Info "Running black..."
        if ($CheckOnly) {
            & black --check $TargetPath 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "black check passed!"
            } else {
                Write-Warning "black found formatting issues"
                $Script:Failures++
            }
        } else {
            & black $TargetPath
            if ($LASTEXITCODE -eq 0) {
                Write-Success "black formatting completed!"
                $Script:Formatted++
            } else {
                Write-Warning "black encountered issues"
                $Script:Failures++
            }
        }
    }
    
    # isort for import sorting
    if (Test-CommandExists "isort") {
        Write-Info "Running isort..."
        if ($CheckOnly) {
            & isort --check-only $TargetPath 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "isort check passed!"
            } else {
                Write-Warning "isort found issues"
            }
        } else {
            & isort $TargetPath 2>&1 | Out-Null
            Write-Success "isort completed!"
        }
    }
}

function Invoke-NodeFormatters {
    Write-Subheader "Node.js Formatters"
    
    # Try prettier first
    if (Test-CommandExists "prettier") {
        Write-Info "Running prettier..."
        if ($CheckOnly) {
            & prettier --check $TargetPath 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "prettier check passed!"
            } else {
                Write-Warning "prettier found formatting issues"
                $Script:Failures++
            }
        } else {
            & prettier --write $TargetPath 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "prettier formatting completed!"
                $Script:Formatted++
            } else {
                Write-Warning "prettier encountered issues"
                $Script:Failures++
            }
        }
    } elseif (Test-Path (Join-Path $ProjectRoot "package.json")) {
        $packageJson = Get-Content (Join-Path $ProjectRoot "package.json") -Raw
        if ($packageJson -match '"format"') {
            Write-Info "Running npm run format..."
            if ($CheckOnly -and $packageJson -match '"format:check"') {
                & npm run format:check 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "npm format:check passed!"
                } else {
                    Write-Warning "npm format:check found issues"
                    $Script:Failures++
                }
            } elseif (-not $CheckOnly) {
                & npm run format 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "npm format completed!"
                    $Script:Formatted++
                } else {
                    Write-Warning "npm format encountered issues"
                    $Script:Failures++
                }
            }
        }
    }
    
    # ESLint fix
    if ((Test-CommandExists "eslint") -and -not $CheckOnly) {
        Write-Info "Running eslint --fix..."
        & eslint --fix $TargetPath 2>&1 | Out-Null
        Write-Success "eslint fix completed!"
    }
}

function Invoke-GoFormatters {
    Write-Subheader "Go Formatters"
    
    Write-Info "Running go fmt..."
    if ($CheckOnly) {
        $unformatted = & gofmt -l . 2>&1
        if ([string]::IsNullOrEmpty($unformatted)) {
            Write-Success "go fmt check passed!"
        } else {
            Write-Warning "go fmt found unformatted files:"
            Write-Host $unformatted
            $Script:Failures++
        }
    } else {
        & go fmt ./... 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "go fmt completed!"
            $Script:Formatted++
        } else {
            Write-Warning "go fmt encountered issues"
            $Script:Failures++
        }
    }
    
    # goimports
    if (Test-CommandExists "goimports") {
        Write-Info "Running goimports..."
        if ($CheckOnly) {
            $unimported = & goimports -l . 2>&1
            if ([string]::IsNullOrEmpty($unimported)) {
                Write-Success "goimports check passed!"
            } else {
                Write-Warning "goimports found issues"
            }
        } else {
            & goimports -w . 2>&1 | Out-Null
            Write-Success "goimports completed!"
        }
    }
}

function Invoke-RustFormatters {
    Write-Subheader "Rust Formatters"
    
    if (Test-CommandExists "cargo") {
        Write-Info "Running cargo fmt..."
        if ($CheckOnly) {
            & cargo fmt -- --check 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "cargo fmt check passed!"
            } else {
                Write-Warning "cargo fmt found formatting issues"
                $Script:Failures++
            }
        } else {
            & cargo fmt 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "cargo fmt completed!"
                $Script:Formatted++
            } else {
                Write-Warning "cargo fmt encountered issues"
                $Script:Failures++
            }
        }
    } else {
        Write-Warning "cargo not found, skipping Rust formatting"
    }
}

function Invoke-PhpFormatters {
    Write-Subheader "PHP Formatters"
    
    if (Test-CommandExists "php-cs-fixer") {
        Write-Info "Running php-cs-fixer..."
        if ($CheckOnly) {
            & php-cs-fixer fix --dry-run --diff $TargetPath 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "php-cs-fixer check passed!"
            } else {
                Write-Warning "php-cs-fixer found formatting issues"
                $Script:Failures++
            }
        } else {
            & php-cs-fixer fix $TargetPath 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "php-cs-fixer completed!"
                $Script:Formatted++
            } else {
                Write-Warning "php-cs-fixer encountered issues"
                $Script:Failures++
            }
        }
    } elseif (Test-CommandExists "phpcbf") {
        Write-Info "Running phpcbf..."
        if ($CheckOnly) {
            & phpcs $TargetPath 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "phpcs check passed!"
            } else {
                Write-Warning "phpcs found issues"
                $Script:Failures++
            }
        } else {
            & phpcbf $TargetPath 2>&1 | Out-Null
            Write-Success "phpcbf completed!"
            $Script:Formatted++
        }
    } else {
        Write-Warning "No PHP formatter found (php-cs-fixer or phpcbf)"
    }
}

# Detect and run formatters
$FoundFormatter = $false

# Python projects
if ((Test-Path (Join-Path $ProjectRoot "pyproject.toml")) -or (Test-Path (Join-Path $ProjectRoot "setup.py"))) {
    Invoke-PythonFormatters
    $FoundFormatter = $true
}

# Node.js projects
if (Test-Path (Join-Path $ProjectRoot "package.json")) {
    Invoke-NodeFormatters
    $FoundFormatter = $true
}

# Go projects
if (Test-Path (Join-Path $ProjectRoot "go.mod")) {
    Invoke-GoFormatters
    $FoundFormatter = $true
}

# Rust projects
if (Test-Path (Join-Path $ProjectRoot "Cargo.toml")) {
    Invoke-RustFormatters
    $FoundFormatter = $true
}

# PHP projects
if (Test-Path (Join-Path $ProjectRoot "composer.json")) {
    Invoke-PhpFormatters
    $FoundFormatter = $true
}

if (-not $FoundFormatter) {
    Write-Warning "No formatter detected for this project type"
    Write-Info "Supported: black, ruff, prettier, go fmt, cargo fmt, php-cs-fixer"
    exit 0
}

Write-Host ""
if ($Script:Failures -eq 0) {
    if ($CheckOnly) {
        Write-Success "All format checks passed!"
    } else {
        Write-Success "Formatting completed! ($Script:Formatted formatter(s) ran successfully)"
    }
} else {
    if ($CheckOnly) {
        Write-Warning "Format check completed with $Script:Failures issue(s)"
    } else {
        Write-Warning "Formatting completed with $Script:Failures issue(s)"
    }
    exit 1
}
