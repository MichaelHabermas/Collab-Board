#Requires -Version 5.1
<#
.SYNOPSIS
    PR Analysis Helper Functions

.DESCRIPTION
    Provides common functions for PR dependency analysis and conflict prediction.
#>

$ErrorActionPreference = "Stop"

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# -----------------------------------------------------------------------------
# Git Branch Functions
# -----------------------------------------------------------------------------

function Get-FeatureBranches {
    <#
    .SYNOPSIS
        Get list of feature branches
    #>
    param(
        [string]$Pattern = "feature/"
    )
    
    try {
        $branches = git branch --list "*$Pattern*" 2>$null
        if ($branches) {
            $branches | ForEach-Object { $_.Trim().TrimStart("* ") }
        }
    }
    catch {
        return @()
    }
}

function Get-CurrentBranch {
    <#
    .SYNOPSIS
        Get current branch name
    #>
    try {
        git rev-parse --abbrev-ref HEAD 2>$null
    }
    catch {
        return ""
    }
}

function Get-MergeBase {
    <#
    .SYNOPSIS
        Get merge base between two branches
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Branch1,
        [string]$Branch2 = "main"
    )
    
    try {
        git merge-base $Branch1 $Branch2 2>$null
    }
    catch {
        return ""
    }
}

function Get-ChangedFiles {
    <#
    .SYNOPSIS
        Get files changed in a branch relative to base
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Branch,
        [string]$Base = "main"
    )
    
    $mergeBase = Get-MergeBase -Branch1 $Branch -Branch2 $Base
    
    try {
        if ($mergeBase) {
            git diff --name-only "$mergeBase...$Branch" 2>$null
        }
        else {
            git diff --name-only "$Base...$Branch" 2>$null
        }
    }
    catch {
        return @()
    }
}

function Get-FileStats {
    <#
    .SYNOPSIS
        Get detailed file stats for a branch
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Branch,
        [string]$Base = "main"
    )
    
    $mergeBase = Get-MergeBase -Branch1 $Branch -Branch2 $Base
    
    try {
        if ($mergeBase) {
            git diff --numstat "$mergeBase...$Branch" 2>$null
        }
        else {
            git diff --numstat "$Base...$Branch" 2>$null
        }
    }
    catch {
        return @()
    }
}

# -----------------------------------------------------------------------------
# PR Analysis Functions
# -----------------------------------------------------------------------------

function Find-FileOverlaps {
    <#
    .SYNOPSIS
        Find file overlaps between two branches
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Branch1,
        [Parameter(Mandatory)]
        [string]$Branch2,
        [string]$Base = "main"
    )
    
    $files1 = @(Get-ChangedFiles -Branch $Branch1 -Base $Base)
    $files2 = @(Get-ChangedFiles -Branch $Branch2 -Base $Base)
    
    if ($files1.Count -eq 0 -or $files2.Count -eq 0) {
        return @()
    }
    
    $set1 = [System.Collections.Generic.HashSet[string]]::new([string[]]$files1)
    $set1.IntersectWith([string[]]$files2)
    
    return $set1
}

function Test-BranchConflicts {
    <#
    .SYNOPSIS
        Check if branches have potential conflicts
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Branch1,
        [Parameter(Mandatory)]
        [string]$Branch2,
        [string]$Base = "main"
    )
    
    $overlaps = Find-FileOverlaps -Branch1 $Branch1 -Branch2 $Branch2 -Base $Base
    
    return $overlaps.Count -gt 0
}

function Invoke-BranchAnalysis {
    <#
    .SYNOPSIS
        Analyze multiple branches for dependencies
    #>
    param(
        [Parameter(Mandatory)]
        [string[]]$Branches,
        [string]$Base = "main"
    )
    
    Write-LogInfo "Analyzing $($Branches.Count) branches against $Base"
    
    for ($i = 0; $i -lt $Branches.Count; $i++) {
        $branch1 = $Branches[$i]
        for ($j = $i + 1; $j -lt $Branches.Count; $j++) {
            $branch2 = $Branches[$j]
            $overlaps = @(Find-FileOverlaps -Branch1 $branch1 -Branch2 $branch2 -Base $Base)
            
            if ($overlaps.Count -gt 0) {
                Write-LogWarning "$branch1 <-> $branch2 : $($overlaps.Count) shared files"
                $overlaps | Select-Object -First 5 | ForEach-Object {
                    Write-Host "  - $_"
                }
            }
        }
    }
}

function Get-MergeOrder {
    <#
    .SYNOPSIS
        Get recommended merge order
    #>
    param(
        [Parameter(Mandatory)]
        [string[]]$Branches,
        [string]$Base = "main"
    )
    
    $changeCounts = @{}
    
    foreach ($branch in $Branches) {
        $files = @(Get-ChangedFiles -Branch $branch -Base $Base)
        $changeCounts[$branch] = $files.Count
    }
    
    # Sort by change count (ascending)
    $changeCounts.GetEnumerator() | Sort-Object Value | ForEach-Object {
        $_.Key
    }
}

# -----------------------------------------------------------------------------
# Report Functions
# -----------------------------------------------------------------------------

function New-ConflictReport {
    <#
    .SYNOPSIS
        Generate conflict report (markdown)
    #>
    param(
        [Parameter(Mandatory)]
        [string[]]$Branches,
        [string]$Base = "main"
    )
    
    $report = @()
    $report += "# PR Conflict Analysis Report"
    $report += "Generated: $(Get-Date)"
    $report += "Base branch: $Base"
    $report += ""
    $report += "## Branch Summary"
    $report += ""
    
    foreach ($branch in $Branches) {
        $files = @(Get-ChangedFiles -Branch $branch -Base $Base)
        $report += "- **$branch**: $($files.Count) files changed"
    }
    
    $report += ""
    $report += "## Potential Conflicts"
    $report += ""
    
    $hasConflicts = $false
    
    for ($i = 0; $i -lt $Branches.Count; $i++) {
        $branch1 = $Branches[$i]
        for ($j = $i + 1; $j -lt $Branches.Count; $j++) {
            $branch2 = $Branches[$j]
            $overlaps = @(Find-FileOverlaps -Branch1 $branch1 -Branch2 $branch2 -Base $Base)
            
            if ($overlaps.Count -gt 0) {
                $hasConflicts = $true
                $report += "### $branch1 vs $branch2 ($($overlaps.Count) files)"
                $report += ""
                foreach ($file in $overlaps) {
                    $report += "- ``$file``"
                }
                $report += ""
            }
        }
    }
    
    if (-not $hasConflicts) {
        $report += "No potential conflicts detected!"
    }
    
    return $report -join "`n"
}

# -----------------------------------------------------------------------------
# Module Exports
# -----------------------------------------------------------------------------

Export-ModuleMember -Function @(
    'Write-LogInfo',
    'Write-LogSuccess',
    'Write-LogWarning',
    'Write-LogError',
    'Get-FeatureBranches',
    'Get-CurrentBranch',
    'Get-MergeBase',
    'Get-ChangedFiles',
    'Get-FileStats',
    'Find-FileOverlaps',
    'Test-BranchConflicts',
    'Invoke-BranchAnalysis',
    'Get-MergeOrder',
    'New-ConflictReport'
)
