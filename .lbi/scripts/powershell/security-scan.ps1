#Requires -Version 5.1
<#
.SYNOPSIS
    Comprehensive security vulnerability scanning.
.DESCRIPTION
    Supports multiple security scanning tools for various project types.
.PARAMETER TargetPath
    The path to scan. Defaults to current directory.
.PARAMETER SeverityThreshold
    Minimum severity to report (critical, high, medium, low). Default is high.
.PARAMETER OutputFormat
    Output format (text, json). Default is text.
#>

param(
    [string]$TargetPath = ".",
    [ValidateSet("critical", "high", "medium", "low")]
    [string]$SeverityThreshold = "high",
    [ValidateSet("text", "json")]
    [string]$OutputFormat = "text"
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Script-level variables
$Script:VulnerabilitiesFound = 0
$Script:ScannersRun = 0

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

Write-Header "Security Vulnerability Scan"

$ProjectRoot = Get-ProjectRoot
Write-Info "Scanning path: $TargetPath"
Write-Info "Severity threshold: $SeverityThreshold"

function Invoke-DependencyScan {
    Write-Subheader "Dependency Vulnerability Scan"
    
    # Python dependencies
    $pyprojectPath = Join-Path $ProjectRoot "pyproject.toml"
    $requirementsPath = Join-Path $ProjectRoot "requirements.txt"
    if ((Test-Path $pyprojectPath) -or (Test-Path $requirementsPath)) {
        if (Test-CommandExists "pip-audit") {
            Write-Info "Running pip-audit..."
            & pip-audit 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "pip-audit: No vulnerabilities found"
                $Script:ScannersRun++
            } else {
                Write-Warning "pip-audit found vulnerabilities"
                $Script:VulnerabilitiesFound++
                $Script:ScannersRun++
            }
        } elseif (Test-CommandExists "safety") {
            Write-Info "Running safety check..."
            & safety check 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "safety: No vulnerabilities found"
                $Script:ScannersRun++
            } else {
                Write-Warning "safety found vulnerabilities"
                $Script:VulnerabilitiesFound++
                $Script:ScannersRun++
            }
        }
    }
    
    # Node.js dependencies
    $packageLockPath = Join-Path $ProjectRoot "package-lock.json"
    $yarnLockPath = Join-Path $ProjectRoot "yarn.lock"
    if ((Test-Path $packageLockPath) -or (Test-Path $yarnLockPath)) {
        Write-Info "Running npm audit..."
        & npm audit --audit-level=$SeverityThreshold 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "npm audit: No high severity vulnerabilities"
            $Script:ScannersRun++
        } else {
            Write-Warning "npm audit found vulnerabilities"
            $Script:VulnerabilitiesFound++
            $Script:ScannersRun++
        }
    }
    
    # Go dependencies
    $goModPath = Join-Path $ProjectRoot "go.mod"
    if (Test-Path $goModPath) {
        if (Test-CommandExists "govulncheck") {
            Write-Info "Running govulncheck..."
            & govulncheck ./... 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "govulncheck: No vulnerabilities found"
                $Script:ScannersRun++
            } else {
                Write-Warning "govulncheck found vulnerabilities"
                $Script:VulnerabilitiesFound++
                $Script:ScannersRun++
            }
        }
    }
}

function Invoke-SecretsScan {
    Write-Subheader "Secrets Detection"
    
    if (Test-CommandExists "detect-secrets") {
        Write-Info "Running detect-secrets..."
        $output = & detect-secrets scan $TargetPath 2>&1
        if ($output -match '"results": \{\}') {
            Write-Success "detect-secrets: No secrets found"
            $Script:ScannersRun++
        } else {
            Write-Warning "detect-secrets found potential secrets"
            $Script:VulnerabilitiesFound++
            $Script:ScannersRun++
        }
    } elseif (Test-CommandExists "gitleaks") {
        Write-Info "Running gitleaks..."
        & gitleaks detect --source=$TargetPath --no-git 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "gitleaks: No secrets found"
            $Script:ScannersRun++
        } else {
            Write-Warning "gitleaks found potential secrets"
            $Script:VulnerabilitiesFound++
            $Script:ScannersRun++
        }
    } else {
        Write-Info "No secrets scanner available (recommend: detect-secrets, gitleaks)"
    }
}

function Invoke-PythonSecurityScan {
    Write-Subheader "Python Security Scan"
    
    if (Test-CommandExists "bandit") {
        Write-Info "Running bandit..."
        $banditArgs = @("-r", $TargetPath, "-f", "txt", "-q")
        
        if ($SeverityThreshold -eq "critical") {
            $banditArgs += "-ll"
        } elseif ($SeverityThreshold -eq "high") {
            $banditArgs += "-l"
        }
        
        & bandit @banditArgs 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "bandit: No security issues found"
            $Script:ScannersRun++
        } else {
            Write-Warning "bandit found security issues"
            $Script:VulnerabilitiesFound++
            $Script:ScannersRun++
        }
    } else {
        Write-Info "bandit not installed (recommend: pip install bandit)"
    }
}

function Invoke-ContainerSecurityScan {
    Write-Subheader "Container Security Scan"
    
    if (Test-CommandExists "trivy") {
        Write-Info "Running trivy filesystem scan..."
        $trivyArgs = @("fs", $TargetPath, "--severity", "HIGH,CRITICAL")
        
        if ($OutputFormat -eq "json") {
            $trivyArgs += @("-f", "json")
        }
        
        & trivy @trivyArgs 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "trivy: No high/critical vulnerabilities found"
            $Script:ScannersRun++
        } else {
            Write-Warning "trivy found vulnerabilities"
            $Script:VulnerabilitiesFound++
            $Script:ScannersRun++
        }
    }
    
    $dockerfilePath = Join-Path $ProjectRoot "Dockerfile"
    if (Test-Path $dockerfilePath) {
        if (Test-CommandExists "hadolint") {
            Write-Info "Running hadolint on Dockerfile..."
            & hadolint $dockerfilePath 2>&1 | Out-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Success "hadolint: No issues found"
                $Script:ScannersRun++
            } else {
                Write-Warning "hadolint found issues"
                $Script:VulnerabilitiesFound++
                $Script:ScannersRun++
            }
        }
    }
}

function Invoke-GenericSecurityScan {
    Write-Subheader "Generic Security Scan"
    
    if (Test-CommandExists "semgrep") {
        Write-Info "Running semgrep..."
        $semgrepArgs = @("scan", "--config", "auto", $TargetPath)
        
        if ($OutputFormat -eq "json") {
            $semgrepArgs += "--json"
        }
        
        & semgrep @semgrepArgs 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Success "semgrep: No issues found"
            $Script:ScannersRun++
        } else {
            Write-Warning "semgrep found issues"
            $Script:VulnerabilitiesFound++
            $Script:ScannersRun++
        }
    }
}

# Run scans
$FoundScanner = $false

Invoke-DependencyScan
Invoke-SecretsScan

# Python projects
$pyprojectPath = Join-Path $ProjectRoot "pyproject.toml"
$setupPath = Join-Path $ProjectRoot "setup.py"
if ((Test-Path $pyprojectPath) -or (Test-Path $setupPath)) {
    Invoke-PythonSecurityScan
    $FoundScanner = $true
}

# Container security
$dockerfilePath = Join-Path $ProjectRoot "Dockerfile"
$dockerComposePath = Join-Path $ProjectRoot "docker-compose.yml"
if ((Test-Path $dockerfilePath) -or (Test-Path $dockerComposePath)) {
    Invoke-ContainerSecurityScan
    $FoundScanner = $true
}

Invoke-GenericSecurityScan

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host "  Security Scan Summary"
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host ""
Write-Info "Scanners run: $Script:ScannersRun"
Write-Info "Issues found: $Script:VulnerabilitiesFound"

if ($Script:ScannersRun -eq 0) {
    Write-Warning "No security scanners were run"
    Write-Info "Install recommended tools: bandit, pip-audit, trivy, semgrep, detect-secrets"
    exit 0
} elseif ($Script:VulnerabilitiesFound -eq 0) {
    Write-Success "Security scan completed - No vulnerabilities found!"
} else {
    Write-Error "Security scan completed - $Script:VulnerabilitiesFound issue(s) found"
    exit 1
}
