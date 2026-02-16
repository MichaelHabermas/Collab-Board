#Requires -Version 5.1
<#
.SYNOPSIS
    DevSpace Sanity Check - Validate DevSpace configuration.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Write-Header { param([string]$Title) Write-Host "`n=== $Title ===`n" }
}

Write-Header "DevSpace Sanity Check"

$ChecksPassed = 0
$ChecksFailed = 0

function Test-Check {
    param([bool]$Condition, [string]$PassMessage, [string]$FailMessage)
    if ($Condition) {
        Write-Success "  $PassMessage"
        $script:ChecksPassed++
    } else {
        Write-Warning "  $FailMessage"
        $script:ChecksFailed++
    }
}

# Check DevSpace CLI
Write-Info "Checking DevSpace CLI..."
$devspaceExists = Get-Command devspace -ErrorAction SilentlyContinue
Test-Check ($null -ne $devspaceExists) "DevSpace CLI installed" "DevSpace CLI not found"

# Check devspace.yaml
Write-Info "Checking configuration..."
Test-Check (Test-Path "devspace.yaml") "devspace.yaml exists" "devspace.yaml not found"

# Check Docker
Write-Info "Checking Docker..."
$dockerExists = Get-Command docker -ErrorAction SilentlyContinue
Test-Check ($null -ne $dockerExists) "Docker installed" "Docker not installed"

# Check kubectl
Write-Info "Checking Kubernetes..."
$kubectlExists = Get-Command kubectl -ErrorAction SilentlyContinue
if ($kubectlExists) {
    Write-Success "  kubectl installed"
    $ChecksPassed++
} else {
    Write-Info "  kubectl not installed (may not be required)"
}

Write-Host ""
Write-Host "## Summary"
Write-Host ""
Write-Host "Checks passed: $ChecksPassed"
Write-Host "Checks failed: $ChecksFailed"
Write-Host ""

if ($ChecksFailed -eq 0) {
    Write-Success "All sanity checks passed!"
} else {
    Write-Warning "Some checks failed - review above for details"
    exit 1
}
