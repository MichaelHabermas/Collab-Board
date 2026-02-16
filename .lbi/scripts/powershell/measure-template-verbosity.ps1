#Requires -Version 5.1
<#
.SYNOPSIS
    Measure Template Verbosity - Analyze template sizes.
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

Write-Header "Template Verbosity Analysis"

$LbiDir = Get-LbiDir
$TemplatesDir = Join-Path $LbiDir "templates"

if (-not (Test-Path $TemplatesDir)) {
    $TemplatesDir = "templates"
}

if (-not (Test-Path $TemplatesDir)) {
    Write-Warning "No templates directory found"
    exit 1
}

$TotalLines = 0
$TotalFiles = 0
$VerboseFiles = 0
$VerboseThreshold = 200

Write-Host ""
Write-Host "| Template | Lines | Status |"
Write-Host "|----------|-------|--------|"

Get-ChildItem $TemplatesDir -Filter "*.md" -Recurse | ForEach-Object {
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    $TotalLines += $lines
    $TotalFiles++
    
    if ($lines -gt $VerboseThreshold) {
        $status = "Verbose"
        $VerboseFiles++
    } else {
        $status = "OK"
    }
    
    Write-Host ("| {0,-30} | {1,5} | {2,-8} |" -f $_.Name, $lines, $status)
}

Write-Host ""
Write-Host "## Summary"
Write-Host ""
Write-Host "Total templates: $TotalFiles"
Write-Host "Total lines: $TotalLines"
Write-Host "Verbose templates: $VerboseFiles"
Write-Host ""

if ($VerboseFiles -gt 0) {
    Write-Warning "$VerboseFiles template(s) may be too verbose"
} else {
    Write-Success "All templates within limits"
}
