#Requires -Version 5.1
<#
.SYNOPSIS
    Format check script.
.DESCRIPTION
    Verifies code formatting without making changes.
#>

$ErrorActionPreference = "Stop"

# Import common functions
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$ScriptDir\common.ps1"

Write-Header "Format Check"

$ProjectRoot = Get-ProjectRoot
Set-Location $ProjectRoot

$Failed = $false

# Python formatting with Ruff
if (Test-CommandExists "ruff") {
    Write-Subheader "Checking Python formatting (ruff)"
    try {
        $result = & ruff format --check . 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Ruff format check passed"
        } else {
            Write-Error "Ruff format check failed"
            $Failed = $true
        }
    } catch {
        Write-Error "Ruff format check failed: $_"
        $Failed = $true
    }
} else {
    Write-Warning "ruff not installed, skipping Ruff format check"
}

# Python formatting with Black
if (Test-CommandExists "black") {
    Write-Subheader "Checking Python formatting (black)"
    try {
        $result = & black --check . 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Black format check passed"
        } else {
            Write-Error "Black format check failed"
            $Failed = $true
        }
    } catch {
        Write-Error "Black format check failed: $_"
        $Failed = $true
    }
} else {
    Write-Warning "black not installed, skipping Black format check"
}

# JavaScript/TypeScript formatting with Prettier
if (Test-CommandExists "prettier") {
    Write-Subheader "Checking JS/TS formatting (prettier)"
    try {
        $result = & prettier --check "**/*.{js,jsx,ts,tsx,json,css,md}" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Prettier format check passed"
        } else {
            Write-Error "Prettier format check failed"
            $Failed = $true
        }
    } catch {
        Write-Error "Prettier format check failed: $_"
        $Failed = $true
    }
} else {
    Write-Warning "prettier not installed, skipping Prettier format check"
}

# Go formatting
if (Test-CommandExists "gofmt") {
    Write-Subheader "Checking Go formatting (gofmt)"
    $goFiles = Get-ChildItem -Path . -Filter "*.go" -Recurse -ErrorAction SilentlyContinue
    if ($goFiles) {
        try {
            $unformatted = & gofmt -l . 2>&1
            if ([string]::IsNullOrEmpty($unformatted)) {
                Write-Success "Go format check passed"
            } else {
                Write-Error "Go format check failed. Unformatted files:"
                Write-Host $unformatted
                $Failed = $true
            }
        } catch {
            Write-Error "Go format check failed: $_"
            $Failed = $true
        }
    } else {
        Write-Info "No Go files found"
    }
} else {
    Write-Warning "gofmt not installed, skipping Go format check"
}

# Rust formatting
if (Test-CommandExists "rustfmt") {
    Write-Subheader "Checking Rust formatting (rustfmt)"
    if (Test-Path "Cargo.toml") {
        try {
            $result = & cargo fmt --check 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Rust format check passed"
            } else {
                Write-Error "Rust format check failed"
                $Failed = $true
            }
        } catch {
            Write-Error "Rust format check failed: $_"
            $Failed = $true
        }
    } else {
        Write-Info "No Cargo.toml found, skipping Rust format check"
    }
} else {
    Write-Warning "rustfmt not installed, skipping Rust format check"
}

Write-Host ""
if (-not $Failed) {
    Write-Success "All format checks passed!"
    exit 0
} else {
    Write-Error "Some format checks failed. Run formatters to fix."
    exit 1
}
