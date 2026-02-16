#Requires -Version 5.1
<#
.SYNOPSIS
    Persona Lint - Validate persona definitions.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Write-Header { param([string]$Title) Write-Host "`n=== $Title ===`n" }
    function Get-LbiDir { Join-Path (Get-Location) ".lbi" }
}

Write-Header "Persona Definition Lint"

$LbiDir = Get-LbiDir
$PersonasDir = Join-Path $LbiDir "personas"

if (-not (Test-Path $PersonasDir)) {
    Write-Host "[ERROR] Personas directory not found" -ForegroundColor Red
    exit 1
}

$Errors = 0
$Warnings = 0

Write-Info "Checking persona files..."

Get-ChildItem $PersonasDir -Filter "*.yaml" | ForEach-Object {
    Write-Host ""
    Write-Info "Checking: $($_.Name)"
    
    $content = Get-Content $_.FullName -Raw
    
    if ($content -match "^id:") {
        Write-Success "  id: present"
    } else {
        Write-Warning "  id: missing"
        $script:Warnings++
    }
    
    if ($content -match "^description:") {
        Write-Success "  description: present"
    } else {
        Write-Warning "  description: missing"
        $script:Warnings++
    }
    
    if ($content -match "required_sections:") {
        Write-Success "  required_sections: present"
    } else {
        Write-Warning "  required_sections: missing"
        $script:Warnings++
    }
}

Write-Host ""
Write-Host "## Lint Summary"
Write-Host ""
Write-Host "Errors: $Errors"
Write-Host "Warnings: $Warnings"
Write-Host ""

if ($Errors -gt 0) {
    Write-Host "[ERROR] Persona lint failed" -ForegroundColor Red
    exit 1
} elseif ($Warnings -gt 0) {
    Write-Warning "Persona lint passed with $Warnings warning(s)"
} else {
    Write-Success "All persona definitions are valid!"
}
