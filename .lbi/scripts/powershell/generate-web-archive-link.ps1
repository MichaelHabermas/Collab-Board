#Requires -Version 5.1
<#
.SYNOPSIS
    Generate Web Archive Link - Create web.archive.org links.
#>
param(
    [Parameter(Mandatory=$true)][string]$Url,
    [switch]$Save
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
}

if (-not ($Url -match "^https?://")) {
    Write-Host "[ERROR] Invalid URL format" -ForegroundColor Red
    exit 1
}

$encodedUrl = [System.Uri]::EscapeUriString($Url)

$searchUrl = "https://web.archive.org/web/*/$encodedUrl"
$latestUrl = "https://web.archive.org/web/2/$encodedUrl"
$saveUrl = "https://web.archive.org/save/$encodedUrl"

Write-Host ""
Write-Host "## Web Archive Links"
Write-Host ""
Write-Host "Original URL: $Url"
Write-Host ""
Write-Host "Archive Search:"
Write-Host "  $searchUrl"
Write-Host ""
Write-Host "Latest Archive:"
Write-Host "  $latestUrl"
Write-Host ""

if ($Save) {
    Write-Host "Save URL:"
    Write-Host "  $saveUrl"
    Write-Host ""
}

Write-Host "## Markdown Citation"
Write-Host ""
Write-Host "[Archived Link]($latestUrl)"

Write-Success "Archive links generated!"
