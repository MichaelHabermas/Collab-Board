#Requires -Version 5.1
<#
.SYNOPSIS
    Guard protected branch script.
.DESCRIPTION
    Prevents direct commits/pushes to protected branches.
#>

$ErrorActionPreference = "Stop"

# Import common functions
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$ScriptDir\common.ps1"

# Protected branches (customize as needed)
$ProtectedBranches = @("main", "master", "develop", "production", "staging")

Write-Header "Protected Branch Guard"

if (-not (Test-CommandExists "git")) {
    Write-Fatal "git is not installed"
}

try {
    $insideGit = & git rev-parse --is-inside-work-tree 2>$null
    if (-not $insideGit) {
        Write-Fatal "Not inside a git repository"
    }
} catch {
    Write-Fatal "Not inside a git repository"
}

$CurrentBranch = & git rev-parse --abbrev-ref HEAD 2>$null
Write-Info "Current branch: $CurrentBranch"

# Check if current branch is protected
$IsProtected = $ProtectedBranches -contains $CurrentBranch

if ($IsProtected) {
    Write-Host ""
    Write-Error "You are on a protected branch: $CurrentBranch"
    Write-Host ""
    Write-Warning "Protected branches should not receive direct commits."
    Write-Warning "Please use feature branches and pull requests instead."
    Write-Host ""
    Write-Info "To create a feature branch:"
    Write-Host "  git checkout -b feature/your-feature-name"
    Write-Host ""
    Write-Info "Protected branches in this project:"
    foreach ($branch in $ProtectedBranches) {
        Write-Host "  - $branch"
    }
    Write-Host ""
    
    # Check if there are uncommitted changes
    if (-not (Test-GitClean)) {
        Write-Warning "You have uncommitted changes!"
        Write-Host ""
        Write-Info "To stash your changes:"
        Write-Host "  git stash"
        Write-Host ""
        Write-Info "Then create a feature branch and apply:"
        Write-Host "  git checkout -b feature/your-feature"
        Write-Host "  git stash pop"
    }
    
    exit 1
} else {
    Write-Success "Branch '$CurrentBranch' is not protected"
    Write-Success "Safe to commit and push"
}
