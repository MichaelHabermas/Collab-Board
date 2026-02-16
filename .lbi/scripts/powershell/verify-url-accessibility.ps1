#Requires -Version 5.1
<#
.SYNOPSIS
    Verify URL accessibility.
#>

param([int]$Timeout = 5)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
    function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }
    function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
    function Get-ProjectRoot { (Get-Location).Path }
}

Write-Header "URL Accessibility Check"

$ProjectRoot = Get-ProjectRoot
$Failures = 0
$Checked = 0

Write-Info "Scanning for URLs in documentation..."

$mdFiles = Get-ChildItem $ProjectRoot -Filter "*.md" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch "node_modules|\.git" }

foreach ($file in $mdFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    $urls = [regex]::Matches($content, 'https?://[^\s>)]+') | ForEach-Object { $_.Value } | Select-Object -Unique
    
    foreach ($url in $urls) {
        if ($url -match "localhost|127\.0\.0\.1|example\.com") { continue }
        
        $Checked++
        try {
            $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec $Timeout -UseBasicParsing -ErrorAction Stop
            Write-Success "OK: $url"
        } catch {
            Write-Warning "FAIL: $url"
            $Failures++
        }
    }
}

Write-Host ""
Write-Info "URLs checked: $Checked"

if ($Failures -eq 0) {
    Write-Success "All URLs are accessible!"
} else {
    Write-Error "$Failures URL(s) failed accessibility check"
    exit 1
}
