#Requires -Version 5.1
<#
.SYNOPSIS
    Validate code coverage thresholds.
.DESCRIPTION
    Supports multiple languages and coverage tools.
.PARAMETER MinimumCoverage
    Minimum coverage percentage required. Default is 80.
#>

param(
    [int]$MinimumCoverage = 80
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Script-level variables
$Script:Failures = 0
$Script:CoverageChecked = 0

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

Write-Header "Validating Code Coverage"

$ProjectRoot = Get-ProjectRoot
Write-Info "Minimum coverage threshold: ${MinimumCoverage}%"

function Test-PythonCoverage {
    Write-Subheader "Python Coverage"
    
    $coverageFile = Join-Path $ProjectRoot ".coverage"
    $coverageXml = Join-Path $ProjectRoot "coverage.xml"
    
    if ((Test-Path $coverageFile) -or (Test-Path $coverageXml)) {
        if (Test-CommandExists "coverage") {
            Write-Info "Validating coverage with coverage.py..."
            
            $output = & coverage report --fail-under=0 2>&1
            $lastLine = $output | Select-Object -Last 1
            if ($lastLine -match '(\d+)%') {
                $coveragePercent = [int]$matches[1]
                Write-Info "Current coverage: ${coveragePercent}%"
                
                if ($coveragePercent -ge $MinimumCoverage) {
                    Write-Success "Python coverage meets threshold (${coveragePercent}% >= ${MinimumCoverage}%)"
                    $Script:CoverageChecked++
                } else {
                    Write-Error "Python coverage below threshold (${coveragePercent}% < ${MinimumCoverage}%)"
                    $Script:Failures++
                    $Script:CoverageChecked++
                }
            }
        }
    } else {
        if ((Test-CommandExists "pytest") -and (Test-CommandExists "coverage")) {
            Write-Info "Running pytest with coverage..."
            & pytest --cov="$ProjectRoot" --cov-report=term --cov-fail-under=$MinimumCoverage 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Python coverage meets threshold!"
                $Script:CoverageChecked++
            } else {
                Write-Warning "Python coverage below threshold"
                $Script:Failures++
                $Script:CoverageChecked++
            }
        } else {
            Write-Info "No Python coverage data found. Run tests with coverage first."
        }
    }
}

function Test-NodeCoverage {
    Write-Subheader "Node.js Coverage"
    
    $coverageDir = $null
    foreach ($dir in @("coverage", ".nyc_output")) {
        $fullPath = Join-Path $ProjectRoot $dir
        if (Test-Path $fullPath) {
            $coverageDir = $dir
            break
        }
    }
    
    if ($coverageDir) {
        if (Test-CommandExists "nyc") {
            Write-Info "Validating coverage with nyc..."
            & nyc check-coverage --lines $MinimumCoverage --branches $MinimumCoverage --functions $MinimumCoverage 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Node.js coverage meets threshold!"
                $Script:CoverageChecked++
            } else {
                Write-Error "Node.js coverage below threshold"
                $Script:Failures++
                $Script:CoverageChecked++
            }
        } else {
            $summaryPath = Join-Path $ProjectRoot "coverage/coverage-summary.json"
            if (Test-Path $summaryPath) {
                Write-Info "Reading coverage from coverage-summary.json..."
                $summary = Get-Content $summaryPath -Raw | ConvertFrom-Json
                $lineCoverage = $summary.total.lines.pct
                Write-Info "Current line coverage: ${lineCoverage}%"
                
                if ($lineCoverage -ge $MinimumCoverage) {
                    Write-Success "Node.js coverage meets threshold!"
                    $Script:CoverageChecked++
                } else {
                    Write-Error "Node.js coverage below threshold"
                    $Script:Failures++
                    $Script:CoverageChecked++
                }
            }
        }
    } else {
        $packageJsonPath = Join-Path $ProjectRoot "package.json"
        if (Test-Path $packageJsonPath) {
            $packageJson = Get-Content $packageJsonPath -Raw
            if ($packageJson -match '"coverage"') {
                Write-Info "Running npm run coverage..."
                & npm run coverage 2>&1 | Out-Host
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Node.js coverage passed!"
                    $Script:CoverageChecked++
                } else {
                    Write-Warning "Node.js coverage failed"
                    $Script:Failures++
                    $Script:CoverageChecked++
                }
            } else {
                Write-Info "No coverage script found in package.json"
            }
        }
    }
}

function Test-GoCoverage {
    Write-Subheader "Go Coverage"
    
    $coverageOut = Join-Path $ProjectRoot "coverage.out"
    
    if (Test-Path $coverageOut) {
        Write-Info "Validating coverage from coverage.out..."
        $output = & go tool cover -func=$coverageOut 2>&1
        $totalLine = $output | Where-Object { $_ -match 'total:' }
        if ($totalLine -match '(\d+\.?\d*)%') {
            $coveragePercent = [double]$matches[1]
            Write-Info "Current coverage: ${coveragePercent}%"
            
            if ($coveragePercent -ge $MinimumCoverage) {
                Write-Success "Go coverage meets threshold (${coveragePercent}% >= ${MinimumCoverage}%)"
                $Script:CoverageChecked++
            } else {
                Write-Error "Go coverage below threshold (${coveragePercent}% < ${MinimumCoverage}%)"
                $Script:Failures++
                $Script:CoverageChecked++
            }
        }
    } else {
        Write-Info "Running go test with coverage..."
        & go test -coverprofile=coverage.out ./... 2>&1 | Out-Host
        if (Test-Path $coverageOut) {
            $output = & go tool cover -func=$coverageOut 2>&1
            $totalLine = $output | Where-Object { $_ -match 'total:' }
            if ($totalLine -match '(\d+\.?\d*)%') {
                $coveragePercent = [double]$matches[1]
                Write-Info "Current coverage: ${coveragePercent}%"
                
                if ($coveragePercent -ge $MinimumCoverage) {
                    Write-Success "Go coverage meets threshold!"
                    $Script:CoverageChecked++
                } else {
                    Write-Error "Go coverage below threshold"
                    $Script:Failures++
                    $Script:CoverageChecked++
                }
            }
        }
    }
}

# Detect and validate coverage
$FoundCoverage = $false

# Python projects
if ((Test-Path (Join-Path $ProjectRoot "pyproject.toml")) -or (Test-Path (Join-Path $ProjectRoot "setup.py"))) {
    Test-PythonCoverage
    $FoundCoverage = $true
}

# Node.js projects
if (Test-Path (Join-Path $ProjectRoot "package.json")) {
    Test-NodeCoverage
    $FoundCoverage = $true
}

# Go projects
if (Test-Path (Join-Path $ProjectRoot "go.mod")) {
    Test-GoCoverage
    $FoundCoverage = $true
}

if (-not $FoundCoverage) {
    Write-Warning "No coverage tool detected for this project type"
    Write-Info "Supported: pytest-cov, coverage.py, nyc/istanbul, go cover, JaCoCo"
    exit 0
}

Write-Host ""
if ($Script:CoverageChecked -eq 0) {
    Write-Warning "No coverage was validated"
    exit 0
} elseif ($Script:Failures -eq 0) {
    Write-Success "All coverage thresholds met!"
} else {
    Write-Error "Coverage validation failed with $Script:Failures failure(s)"
    exit 1
}
