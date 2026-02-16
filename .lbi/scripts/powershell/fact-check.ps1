#Requires -Version 5.1
<#
.SYNOPSIS
    Fact-checking context extraction.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
    function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
    function Get-ProjectRoot { (Get-Location).Path }
    function Get-LbiDir { Join-Path (Get-ProjectRoot) ".lbi" }
}

Write-Header "Fact-Checking Context Extraction"

$ProjectRoot = Get-ProjectRoot
$LbiDir = Get-LbiDir
$OutputFile = Join-Path $LbiDir "facts.md"

if (-not (Test-Path $LbiDir)) {
    New-Item -ItemType Directory -Path $LbiDir -Force | Out-Null
}

Write-Info "Extracting facts from: $ProjectRoot"

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$content = @"
# Extracted Facts for Verification

Generated: $timestamp

## Version Information
"@

$pyproject = Join-Path $ProjectRoot "pyproject.toml"
if (Test-Path $pyproject) {
    $content += "`n### Python Package`n"
    $version = Select-String -Path $pyproject -Pattern '^version\s*=' | Select-Object -First 1
    if ($version) { $content += $version.Line }
}

$packageJson = Join-Path $ProjectRoot "package.json"
if (Test-Path $packageJson) {
    $content += "`n### Node Package`n"
    $pkg = Get-Content $packageJson -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($pkg.version) { $content += "version: $($pkg.version)" }
}

$content += @"

## Dependencies to Verify

Check dependency versions against official documentation.
"@

Set-Content -Path $OutputFile -Value $content -Encoding UTF8
Write-Success "Facts extracted to: $OutputFile"
