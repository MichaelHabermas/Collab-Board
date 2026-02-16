#Requires -Version 5.1
<#
.SYNOPSIS
    DevSpace Detection - Detect cloud development environment.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Header { param([string]$Title) Write-Host "`n=== $Title ===`n" }
}

Write-Header "DevSpace Environment Detection"

$DetectedEnv = "none"
$DetectedDetails = ""

# Check for DevSpace
if ($env:DEVSPACE -or (Test-Path "devspace.yaml")) {
    $DetectedEnv = "devspace"
    $DetectedDetails = "DevSpace development environment"
    Write-Success "DevSpace configuration found"
}

# Check for GitHub Codespaces
if ($env:CODESPACES -or $env:GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
    $DetectedEnv = "codespaces"
    $DetectedDetails = "GitHub Codespaces"
    Write-Success "GitHub Codespaces environment detected"
}

# Check for Gitpod
if ($env:GITPOD_WORKSPACE_ID -or (Test-Path ".gitpod.yml")) {
    $DetectedEnv = "gitpod"
    $DetectedDetails = "Gitpod cloud IDE"
    Write-Success "Gitpod environment detected"
}

# Check for VS Code Remote
if ($env:VSCODE_REMOTE_CONTAINERS_SESSION) {
    $DetectedEnv = "vscode-remote"
    $DetectedDetails = "VS Code Remote Containers"
    Write-Success "VS Code Remote Containers detected"
}

Write-Host ""
Write-Host "## Detection Results"
Write-Host ""
Write-Host "Environment: $DetectedEnv"
Write-Host "Details: $(if ($DetectedDetails) { $DetectedDetails } else { 'Local development' })"
Write-Host ""

if ($DetectedEnv -ne "none") {
    Write-Success "Cloud development environment detected!"
} else {
    Write-Info "Local development environment (no cloud IDE detected)"
}
