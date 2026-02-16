#Requires -Version 5.1
<#
.SYNOPSIS
    Validate Template Style - Check template consistency.
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

Write-Header "Template Style Validation"

$LbiDir = Get-LbiDir
$TemplatesDir = Join-Path $LbiDir "templates"

if (-not (Test-Path $TemplatesDir)) {
    $TemplatesDir = "templates"
}

if (-not (Test-Path $TemplatesDir)) {
    Write-Warning "No templates directory found"
    exit 1
}

$Errors = 0
$Warnings = 0

Write-Info "Validating template style..."

Get-ChildItem $TemplatesDir -Filter "*.md" -Recurse | ForEach-Object {
    Write-Host ""
    Write-Info "Checking: $($_.Name)"
    
    $content = Get-Content $_.FullName
    $firstLine = $content | Select-Object -First 1
    
    if ($firstLine -match "^# ") {
        Write-Success "  Has title"
    } else {
        Write-Warning "  Missing title"
        $script:Warnings++
    }
    
    # Check for trailing whitespace
    $trailing = $content | Where-Object { $_ -match " +$" }
    if ($trailing) {
        Write-Warning "  Has trailing whitespace"
        $script:Warnings++
    }
}

Write-Host ""
Write-Host "## Validation Summary"
Write-Host ""
Write-Host "Errors: $Errors"
Write-Host "Warnings: $Warnings"
Write-Host ""

if ($Errors -gt 0) {
    Write-Host "[ERROR] Template validation failed" -ForegroundColor Red
    exit 1
} elseif ($Warnings -gt 0) {
    Write-Warning "Template validation passed with warnings"
} else {
    Write-Success "All templates pass style validation!"
}
