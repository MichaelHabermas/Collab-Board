#Requires -Version 5.1
<#
.SYNOPSIS
    Validate Quickfix - Check if change qualifies for quickfix workflow.
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

Write-Header "Quickfix Validation"

# Check if in git repo
try {
    $null = & git rev-parse --is-inside-work-tree 2>$null
} catch {
    Write-Host "Not in a git repository" -ForegroundColor Red
    exit 1
}

# Count changed files
$stagedFiles = & git diff --cached --name-only 2>$null | Measure-Object | Select-Object -ExpandProperty Count
$unstagedFiles = & git diff --name-only 2>$null | Measure-Object | Select-Object -ExpandProperty Count
$totalFiles = $stagedFiles + $unstagedFiles

# Count lines changed
$numstat = & git diff --cached --numstat 2>$null
$linesAdded = 0
$linesRemoved = 0
if ($numstat) {
    $numstat | ForEach-Object {
        $parts = $_ -split '\t'
        if ($parts[0] -match '^\d+$') { $linesAdded += [int]$parts[0] }
        if ($parts[1] -match '^\d+$') { $linesRemoved += [int]$parts[1] }
    }
}
$totalLines = $linesAdded + $linesRemoved

Write-Host "## Change Analysis"
Write-Host ""
Write-Host "Files changed: $totalFiles"
Write-Host "Lines added: $linesAdded"
Write-Host "Lines removed: $linesRemoved"
Write-Host "Total line changes: $totalLines"
Write-Host ""

# Quickfix criteria
$maxFiles = 2
$maxLines = 50

$qualifies = $true
$reasons = @()

if ($totalFiles -gt $maxFiles) {
    $qualifies = $false
    $reasons += "Too many files ($totalFiles > $maxFiles)"
}

if ($totalLines -gt $maxLines) {
    $qualifies = $false
    $reasons += "Too many lines changed ($totalLines > $maxLines)"
}

Write-Host "## Quickfix Eligibility"
Write-Host ""

if ($qualifies) {
    Write-Success "QUALIFIES for quickfix workflow!"
    Write-Host ""
    Write-Host "Criteria met:"
    Write-Host "- Files: $totalFiles <= $maxFiles"
    Write-Host "- Lines: $totalLines <= $maxLines"
    Write-Host ""
    Write-Info "You can use /lbi.quickfix for this change"
} else {
    Write-Warning "Does NOT qualify for quickfix workflow"
    Write-Host ""
    Write-Host "Reasons:"
    $reasons | ForEach-Object { Write-Host "- $_" }
    Write-Host ""
    Write-Info "Use the full /lbi.request workflow instead"
    exit 1
}
