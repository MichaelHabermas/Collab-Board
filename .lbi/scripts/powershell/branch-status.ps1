#Requires -Version 5.1
<#
.SYNOPSIS
    Branch status script.
.DESCRIPTION
    Shows detailed git branch information.
#>

$ErrorActionPreference = "Stop"

# Import common functions
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$ScriptDir\common.ps1"

Write-Header "Git Branch Status"

$ProjectRoot = Get-ProjectRoot
Set-Location $ProjectRoot

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

# Current branch
$CurrentBranch = & git rev-parse --abbrev-ref HEAD 2>$null
Write-Info "Current branch: $CurrentBranch"

# Remote tracking branch
try {
    $Tracking = & git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null
} catch {
    $Tracking = $null
}

if ($Tracking) {
    Write-Info "Tracking: $Tracking"
    
    # Ahead/behind counts
    try {
        $Ahead = (& git rev-list --count "@{u}..HEAD" 2>$null) -as [int]
        $Behind = (& git rev-list --count "HEAD..@{u}" 2>$null) -as [int]
    } catch {
        $Ahead = 0
        $Behind = 0
    }
    
    if ($Ahead -gt 0) {
        Write-Warning "Ahead of remote by $Ahead commit(s)"
    }
    if ($Behind -gt 0) {
        Write-Warning "Behind remote by $Behind commit(s)"
    }
    if ($Ahead -eq 0 -and $Behind -eq 0) {
        Write-Success "Branch is up to date with remote"
    }
} else {
    Write-Warning "No remote tracking branch configured"
    $Ahead = 0
    $Behind = 0
}

Write-Host ""
Write-Subheader "Working Directory Status"

# Staged changes
$StagedFiles = & git diff --cached --name-only 2>$null
$Staged = if ($StagedFiles) { ($StagedFiles | Measure-Object).Count } else { 0 }
if ($Staged -gt 0) {
    Write-Info "Staged files: $Staged"
    $StagedFiles | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }
    if ($Staged -gt 10) {
        Write-Host "  ... and $($Staged - 10) more"
    }
}

# Unstaged changes
$UnstagedFiles = & git diff --name-only 2>$null
$Unstaged = if ($UnstagedFiles) { ($UnstagedFiles | Measure-Object).Count } else { 0 }
if ($Unstaged -gt 0) {
    Write-Warning "Modified files (unstaged): $Unstaged"
    $UnstagedFiles | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }
    if ($Unstaged -gt 10) {
        Write-Host "  ... and $($Unstaged - 10) more"
    }
}

# Untracked files
$UntrackedFiles = & git ls-files --others --exclude-standard 2>$null
$Untracked = if ($UntrackedFiles) { ($UntrackedFiles | Measure-Object).Count } else { 0 }
if ($Untracked -gt 0) {
    Write-Warning "Untracked files: $Untracked"
    $UntrackedFiles | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }
    if ($Untracked -gt 10) {
        Write-Host "  ... and $($Untracked - 10) more"
    }
}

if ($Staged -eq 0 -and $Unstaged -eq 0 -and $Untracked -eq 0) {
    Write-Success "Working directory is clean"
}

Write-Host ""
Write-Subheader "Recent Commits"

& git log --oneline -5 2>$null

Write-Host ""
Write-Subheader "Local Branches"

& git branch -v 2>$null | Select-Object -First 10

# Summary
Write-Host ""
$IsClean = Test-GitClean
if ($IsClean -and $Ahead -eq 0) {
    Write-Success "Branch is ready for work"
} else {
    if ($Ahead -gt 0) {
        Write-Warning "Consider pushing your commits"
    }
    if ($Behind -gt 0) {
        Write-Warning "Consider pulling latest changes"
    }
    if (-not $IsClean) {
        Write-Warning "Commit or stash your changes"
    }
}
