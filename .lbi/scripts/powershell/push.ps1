#Requires -Version 5.1
<#
.SYNOPSIS
    Push changes with pre-push validation.
.DESCRIPTION
    Runs checks before pushing to ensure code quality.
.PARAMETER Branch
    Branch to push. Defaults to current branch.
.PARAMETER SkipChecks
    Skip pre-push checks.
.PARAMETER Force
    Use force push with lease.
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Branch = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipChecks,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Import common utilities
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonScript = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonScript) {
    . $CommonScript
} else {
    function Write-Info { param($Message) Write-Host "[INFO] $Message" }
    function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
    function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Write-Header { param($Title) Write-Host "`n=== $Title ===`n" }
    function Write-Subheader { param($Title) Write-Host "`n--- $Title ---`n" }
    function Test-CommandExists { param($Command) $null -ne (Get-Command $Command -ErrorAction SilentlyContinue) }
}

Write-Header "Git Push with Validation"

# Check git is available
if (-not (Test-CommandExists "git")) {
    Write-Error "Git is not installed"
    exit 1
}

# Check we're in a git repository
try {
    $null = & git rev-parse --is-inside-work-tree 2>$null
} catch {
    Write-Error "Not in a git repository"
    exit 1
}

# Get current branch if not specified
if ([string]::IsNullOrEmpty($Branch)) {
    $Branch = & git rev-parse --abbrev-ref HEAD
}

Write-Info "Branch: $Branch"

# Check for uncommitted changes
$status = & git status --porcelain
if ($status) {
    Write-Warning "You have uncommitted changes"
    & git status --short
    $response = Read-Host "Continue with push? [y/N]"
    if ($response -notmatch '^[yY]') {
        Write-Info "Aborted."
        exit 0
    }
}

# Run pre-push checks unless skipped
if (-not $SkipChecks) {
    Write-Subheader "Running Pre-Push Checks"
    
    $ReadyScript = Join-Path $ScriptDir "ready-to-push.ps1"
    if (Test-Path $ReadyScript) {
        Write-Info "Running ready-to-push checks..."
        try {
            & $ReadyScript
        } catch {
            Write-Error "Pre-push checks failed"
            $response = Read-Host "Push anyway? [y/N]"
            if ($response -notmatch '^[yY]') {
                Write-Error "Push aborted due to failed checks"
                exit 1
            }
        }
    }
}

# Perform the push
Write-Subheader "Pushing to Remote"

$PushArgs = @()
if ($Force) {
    Write-Warning "Force push enabled"
    $PushArgs += "--force-with-lease"
}

# Check if upstream is set
try {
    $null = & git rev-parse --abbrev-ref "@{u}" 2>$null
    Write-Info "Pushing to tracked upstream..."
    & git push @PushArgs
} catch {
    Write-Info "Setting upstream and pushing..."
    & git push -u origin $Branch @PushArgs
}

Write-Success "Successfully pushed $Branch to remote"

# Show push summary
Write-Host ""
Write-Info "Push Summary:"
Write-Host "  Branch: $Branch"
try {
    $commitCount = (& git log --oneline "origin/$Branch..HEAD" 2>$null | Measure-Object).Count
    Write-Host "  Commits: $commitCount"
} catch {
    Write-Host "  Commits: N/A"
}
Write-Host ""
