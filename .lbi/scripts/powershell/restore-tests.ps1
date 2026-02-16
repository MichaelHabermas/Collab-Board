#Requires -Version 5.1
<#
.SYNOPSIS
    Restore tests from backup.
#>

function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }

Write-Header "Restore Tests"

$LbiDir = ".lbi"
$BackupDir = Join-Path $LbiDir ".backup"

if (-not (Test-Path $BackupDir)) {
    Write-Error "No backups found in $BackupDir"
    exit 1
}

Write-Info "Available backups:"
Get-ChildItem $BackupDir -Directory | ForEach-Object { Write-Host $_.Name }

Write-Host ""
Write-Info "To restore tests from a backup:"
Write-Host "1. Identify the backup you want to restore from"
Write-Host "2. Copy test files: Copy-Item -Recurse $BackupDir\<backup>\tests .\tests"
Write-Host "3. Review restored tests for compatibility"
Write-Host ""

Write-Warning "Manual restore required to prevent accidental overwrites"
Write-Success "Backup information displayed"
