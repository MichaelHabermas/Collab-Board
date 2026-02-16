#Requires -Version 5.1
<#
.SYNOPSIS
    Run integration tests for the project.
.DESCRIPTION
    Supports multiple test frameworks with environment setup.
.PARAMETER TargetPath
    The path to test. Defaults to tests/integration.
.PARAMETER Verbose
    If specified, enables verbose output.
.PARAMETER Parallel
    If specified, enables parallel test execution.
#>

param(
    [string]$TargetPath = "tests/integration",
    [switch]$VerboseOutput,
    [switch]$Parallel
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Script-level variables
$Script:Failures = 0
$Script:TestsRun = 0

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

Write-Header "Running Integration Tests"

$ProjectRoot = Get-ProjectRoot

function Initialize-Environment {
    Write-Info "Setting up test environment..."
    
    # Load .env.test if it exists
    $envTestPath = Join-Path $ProjectRoot ".env.test"
    if (Test-Path $envTestPath) {
        Write-Info "Loading .env.test"
        Get-Content $envTestPath | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    
    # Load .env.integration if it exists
    $envIntPath = Join-Path $ProjectRoot ".env.integration"
    if (Test-Path $envIntPath) {
        Write-Info "Loading .env.integration"
        Get-Content $envIntPath | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    
    # Set common test environment variables
    if (-not $env:TEST_ENV) { $env:TEST_ENV = "integration" }
    if (-not $env:CI) { $env:CI = "false" }
}

function Invoke-PythonIntegrationTests {
    Write-Subheader "Python Integration Tests"
    
    # Find integration test directory
    $testDir = $null
    foreach ($dir in @("tests/integration", "integration_tests", "test/integration")) {
        $fullPath = Join-Path $ProjectRoot $dir
        if (Test-Path $fullPath) {
            $testDir = $dir
            break
        }
    }
    
    if (-not $testDir) {
        Write-Info "No integration test directory found, checking for integration markers..."
        $testDir = "tests"
    }
    
    if (Test-CommandExists "pytest") {
        Write-Info "Running pytest for integration tests..."
        $pytestArgs = @($testDir)
        
        if ($testDir -eq "tests") {
            $pytestArgs += @("-m", "integration")
        }
        
        if ($VerboseOutput) {
            $pytestArgs += "-v"
        }
        
        & pytest @pytestArgs 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Python integration tests passed!"
            $Script:TestsRun++
        } else {
            Write-Warning "Python integration tests failed"
            $Script:Failures++
            $Script:TestsRun++
        }
    } else {
        Write-Warning "pytest not found"
        Write-Info "Install with: pip install pytest"
    }
}

function Invoke-NodeIntegrationTests {
    Write-Subheader "Node.js Integration Tests"
    
    $packageJsonPath = Join-Path $ProjectRoot "package.json"
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath -Raw
        
        if ($packageJson -match '"test:integration"') {
            Write-Info "Running npm run test:integration..."
            & npm run test:integration 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Node.js integration tests passed!"
                $Script:TestsRun++
            } else {
                Write-Warning "Node.js integration tests failed"
                $Script:Failures++
                $Script:TestsRun++
            }
        } elseif ($packageJson -match '"test:e2e"') {
            Write-Info "Running npm run test:e2e..."
            & npm run test:e2e 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Node.js e2e tests passed!"
                $Script:TestsRun++
            } else {
                Write-Warning "Node.js e2e tests failed"
                $Script:Failures++
                $Script:TestsRun++
            }
        } else {
            $intTestDir = Join-Path $ProjectRoot "tests/integration"
            $intTestDir2 = Join-Path $ProjectRoot "__tests__/integration"
            if ((Test-Path $intTestDir) -or (Test-Path $intTestDir2)) {
                Write-Info "Running jest for integration tests..."
                & npx jest --testPathPattern="integration" 2>&1 | Out-Host
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Jest integration tests passed!"
                    $Script:TestsRun++
                } else {
                    Write-Warning "Jest integration tests failed"
                    $Script:Failures++
                    $Script:TestsRun++
                }
            } else {
                Write-Info "No integration test configuration found"
            }
        }
    }
}

function Invoke-GoIntegrationTests {
    Write-Subheader "Go Integration Tests"
    
    Write-Info "Running go test with integration tag..."
    $goArgs = @("-tags", "integration", "./...")
    
    if ($VerboseOutput) {
        $goArgs = @("-v") + $goArgs
    }
    
    & go test @goArgs 2>&1 | Out-Host
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Go integration tests passed!"
        $Script:TestsRun++
    } else {
        Write-Info "No integration tests found or tests failed"
    }
}

function Invoke-RustIntegrationTests {
    Write-Subheader "Rust Integration Tests"
    
    if (Test-CommandExists "cargo") {
        $testsDir = Join-Path $ProjectRoot "tests"
        if (Test-Path $testsDir) {
            Write-Info "Running cargo test for integration tests..."
            $cargoArgs = @("test", "--test", "*")
            
            if (-not $VerboseOutput) {
                $cargoArgs += "--quiet"
            }
            
            & cargo @cargoArgs 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Rust integration tests passed!"
                $Script:TestsRun++
            } else {
                Write-Warning "Rust integration tests failed"
                $Script:Failures++
                $Script:TestsRun++
            }
        } else {
            Write-Info "No integration test directory found"
        }
    } else {
        Write-Warning "cargo not found"
    }
}

function Invoke-JavaIntegrationTests {
    Write-Subheader "Java Integration Tests"
    
    # Maven projects
    $pomPath = Join-Path $ProjectRoot "pom.xml"
    if (Test-Path $pomPath) {
        if (Test-CommandExists "mvn") {
            Write-Info "Running Maven integration tests..."
            & mvn -q verify -DskipUnitTests 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Maven integration tests passed!"
                $Script:TestsRun++
            } else {
                Write-Warning "Maven integration tests failed"
                $Script:Failures++
                $Script:TestsRun++
            }
        }
    }
    
    # Gradle projects
    $buildGradlePath = Join-Path $ProjectRoot "build.gradle"
    $buildGradleKtsPath = Join-Path $ProjectRoot "build.gradle.kts"
    if ((Test-Path $buildGradlePath) -or (Test-Path $buildGradleKtsPath)) {
        $gradlewPath = Join-Path $ProjectRoot "gradlew.bat"
        $gradleCmd = if (Test-Path $gradlewPath) { $gradlewPath } else { "gradle" }
        
        if ((Test-Path $gradleCmd) -or (Test-CommandExists "gradle")) {
            Write-Info "Running Gradle integration tests..."
            & $gradleCmd integrationTest --console=plain 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Gradle integration tests passed!"
                $Script:TestsRun++
            } else {
                & $gradleCmd test --console=plain 2>&1 | Out-Host
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Gradle tests passed!"
                    $Script:TestsRun++
                } else {
                    Write-Warning "Gradle tests failed"
                    $Script:Failures++
                    $Script:TestsRun++
                }
            }
        }
    }
}

# Main execution
Initialize-Environment

$FoundTests = $false

# Python projects
if ((Test-Path (Join-Path $ProjectRoot "pyproject.toml")) -or (Test-Path (Join-Path $ProjectRoot "setup.py"))) {
    Invoke-PythonIntegrationTests
    $FoundTests = $true
}

# Node.js projects
if (Test-Path (Join-Path $ProjectRoot "package.json")) {
    Invoke-NodeIntegrationTests
    $FoundTests = $true
}

# Go projects
if (Test-Path (Join-Path $ProjectRoot "go.mod")) {
    Invoke-GoIntegrationTests
    $FoundTests = $true
}

# Rust projects
if (Test-Path (Join-Path $ProjectRoot "Cargo.toml")) {
    Invoke-RustIntegrationTests
    $FoundTests = $true
}

# Java projects
if ((Test-Path (Join-Path $ProjectRoot "pom.xml")) -or (Test-Path (Join-Path $ProjectRoot "build.gradle")) -or (Test-Path (Join-Path $ProjectRoot "build.gradle.kts"))) {
    Invoke-JavaIntegrationTests
    $FoundTests = $true
}

if (-not $FoundTests) {
    Write-Warning "No integration test framework detected"
    Write-Info "Supported: pytest, jest/mocha, go test, cargo test, JUnit"
    exit 0
}

Write-Host ""
if ($Script:TestsRun -eq 0) {
    Write-Warning "No integration tests were run"
    exit 0
} elseif ($Script:Failures -eq 0) {
    Write-Success "All integration tests passed! ($Script:TestsRun test suite(s) ran)"
} else {
    Write-Error "Integration tests completed with $Script:Failures failure(s)"
    exit 1
}
