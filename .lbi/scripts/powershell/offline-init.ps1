#Requires -Version 5.1
<#
.SYNOPSIS
    Offline initialization support.
.DESCRIPTION
    Initialize LBI project without network access.
#>

Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
    function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
    function Get-ProjectRoot { (Get-Location).Path }
}

Write-Header "Offline LBI Initialization"

$ProjectRoot = Get-ProjectRoot
$LbiDir = Join-Path $ProjectRoot ".lbi"
$CacheDir = if ($env:LBI_CACHE_DIR) { $env:LBI_CACHE_DIR } else { Join-Path $env:USERPROFILE ".cache/lbi" }

Write-Info "Project root: $ProjectRoot"
Write-Info "Cache directory: $CacheDir"

function Find-CachedTemplates {
    $templatesDir = Join-Path $CacheDir "templates"
    if (Test-Path $templatesDir) {
        $latest = Get-ChildItem $templatesDir -Directory | Sort-Object Name | Select-Object -Last 1
        if ($latest) {
            return $latest.FullName
        }
    }
    return $null
}

function Copy-FromCache {
    param([string]$CachePath)
    
    Write-Info "Using cached templates from: $CachePath"
    
    if (-not (Test-Path $LbiDir)) {
        New-Item -ItemType Directory -Path $LbiDir -Force | Out-Null
    }
    
    foreach ($dir in @("templates", "config", "memory")) {
        $sourceDir = Join-Path $CachePath $dir
        if (Test-Path $sourceDir) {
            Copy-Item -Path $sourceDir -Destination $LbiDir -Recurse -Force
            Write-Success "Copied: $dir"
        }
    }
    
    $manifestPath = Join-Path $CachePath "manifest.json"
    if (Test-Path $manifestPath) {
        Copy-Item -Path $manifestPath -Destination $LbiDir
        Write-Success "Copied: manifest.json"
    }
}

function New-MinimalStructure {
    Write-Warning "No cached templates found, creating minimal structure"
    
    $dirs = @("specs", "config", "memory")
    foreach ($dir in $dirs) {
        $path = Join-Path $LbiDir $dir
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        }
    }
    
    # Create manifest
    $manifest = @{
        version = "0.0.0-offline"
        agent = "cursor"
        offline = $true
        created_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json
    Set-Content -Path (Join-Path $LbiDir "manifest.json") -Value $manifest -Encoding UTF8
    Write-Success "Created minimal manifest"
    
    # Create constitution
    $constitution = @"
# Project Constitution

## Coding Standards
- Follow language-specific best practices
- Write clear, documented code
- Include tests for new features
"@
    Set-Content -Path (Join-Path $LbiDir "memory/constitution.md") -Value $constitution -Encoding UTF8
    Write-Success "Created minimal constitution"
    
    # Create settings
    $settings = @"
# LBI Settings
version: "0.0.0-offline"
offline_mode: true
"@
    Set-Content -Path (Join-Path $LbiDir "config/settings.yaml") -Value $settings -Encoding UTF8
    Write-Success "Created minimal settings"
}

# Main logic
if (Test-Path $LbiDir) {
    Write-Warning "LBI directory already exists"
    $response = Read-Host "Reinitialize? [y/N]"
    if ($response -match '^[yY]') {
        Remove-Item -Path $LbiDir -Recurse -Force
    } else {
        exit 0
    }
}

$cachePath = Find-CachedTemplates
if ($cachePath) {
    Copy-FromCache -CachePath $cachePath
} else {
    New-MinimalStructure
}

Write-Host ""
Write-Success "Offline initialization complete!"
Write-Info "Run 'lbi upgrade' when online to get latest templates"
