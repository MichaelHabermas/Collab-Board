#Requires -Version 5.1
<#
.SYNOPSIS
    Verify Ignore Files - Validate .gitignore and similar.
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

Write-Header "Ignore Files Verification"

$Issues = 0

Write-Info "Checking .gitignore..."

if (Test-Path ".gitignore") {
    Write-Success "  .gitignore exists"
    
    $content = Get-Content ".gitignore" -Raw
    $requiredPatterns = @(".env", "*.pyc", "__pycache__", "node_modules")
    
    foreach ($pattern in $requiredPatterns) {
        if ($content -match [regex]::Escape($pattern)) {
            Write-Success "    $pattern"
        } else {
            Write-Warning "    Missing: $pattern"
            $Issues++
        }
    }
} else {
    Write-Host "[ERROR] .gitignore not found" -ForegroundColor Red
    $Issues++
}

Write-Info "Checking .dockerignore..."
if ((Test-Path "Dockerfile") -or (Test-Path "docker-compose.yml")) {
    if (Test-Path ".dockerignore") {
        Write-Success "  .dockerignore exists"
    } else {
        Write-Warning "  .dockerignore missing"
        $Issues++
    }
}

Write-Host ""
Write-Host "## Summary"
Write-Host ""

if ($Issues -eq 0) {
    Write-Success "All ignore file checks passed!"
} else {
    Write-Warning "$Issues issue(s) found"
    exit 1
}
