#
# workspace-common.ps1 - Helper functions for workspace/monorepo operations
#
# This script provides common functions for working with multi-repo workspaces
# and monorepos in the LBI workflow.
#
# Usage:
#   . .lbi\scripts\powershell\workspace-common.ps1
#

$ErrorActionPreference = "Stop"

function Get-WorkspaceRoot {
    <#
    .SYNOPSIS
        Get the workspace/monorepo root directory.
    .DESCRIPTION
        Walks up from current directory until finding .lbi/manifest.json
        with mode == 'workspace' or 'monorepo'.
    .PARAMETER Path
        Starting path (defaults to current directory).
    .OUTPUTS
        String path to workspace root, or $null if not found.
    #>
    param(
        [string]$Path = (Get-Location)
    )
    
    $dir = Resolve-Path $Path
    
    while ($dir -and $dir.Path -ne [System.IO.Path]::GetPathRoot($dir.Path)) {
        $manifest = Join-Path $dir.Path ".lbi" "manifest.json"
        if (Test-Path $manifest) {
            try {
                $content = Get-Content $manifest -Raw | ConvertFrom-Json
                $mode = $content.mode
                if ($mode -eq "workspace" -or $mode -eq "monorepo") {
                    return $dir.Path
                }
            } catch {
                # Invalid JSON, continue searching
            }
        }
        $dir = Split-Path $dir.Path -Parent
        if ($dir) { $dir = Resolve-Path $dir }
    }
    
    return $null
}

function Get-ProjectRoot {
    <#
    .SYNOPSIS
        Get the project root (closest .lbi directory).
    .PARAMETER Path
        Starting path (defaults to current directory).
    .OUTPUTS
        String path to project root, or $null if not found.
    #>
    param(
        [string]$Path = (Get-Location)
    )
    
    $dir = Resolve-Path $Path
    
    while ($dir -and $dir.Path -ne [System.IO.Path]::GetPathRoot($dir.Path)) {
        $lbiDir = Join-Path $dir.Path ".lbi"
        if (Test-Path $lbiDir -PathType Container) {
            return $dir.Path
        }
        $dir = Split-Path $dir.Path -Parent
        if ($dir) { $dir = Resolve-Path $dir }
    }
    
    return $null
}

function Get-DeploymentMode {
    <#
    .SYNOPSIS
        Get the deployment mode (single, monorepo, workspace).
    .PARAMETER Path
        Starting path (defaults to current directory).
    .OUTPUTS
        String mode value.
    #>
    param(
        [string]$Path = (Get-Location)
    )
    
    $root = Get-ProjectRoot -Path $Path
    if (-not $root) {
        return "unknown"
    }
    
    $manifest = Join-Path $root ".lbi" "manifest.json"
    if (Test-Path $manifest) {
        try {
            $content = Get-Content $manifest -Raw | ConvertFrom-Json
            if ($content.mode) {
                return $content.mode
            }
        } catch {
            # Invalid JSON
        }
    }
    
    return "single"
}

function Test-IsWorkspace {
    <#
    .SYNOPSIS
        Check if current directory is in a workspace.
    .OUTPUTS
        Boolean.
    #>
    param(
        [string]$Path = (Get-Location)
    )
    
    return (Get-DeploymentMode -Path $Path) -eq "workspace"
}

function Test-IsMonorepo {
    <#
    .SYNOPSIS
        Check if current directory is in a monorepo.
    .OUTPUTS
        Boolean.
    #>
    param(
        [string]$Path = (Get-Location)
    )
    
    return (Get-DeploymentMode -Path $Path) -eq "monorepo"
}

function Get-WorkspaceRepos {
    <#
    .SYNOPSIS
        List all repositories in a workspace.
    .PARAMETER WorkspaceRoot
        Path to workspace root (defaults to detected workspace).
    .OUTPUTS
        Array of objects with Name and Path properties.
    #>
    param(
        [string]$WorkspaceRoot = (Get-WorkspaceRoot)
    )
    
    if (-not $WorkspaceRoot) {
        return @()
    }
    
    $repos = @()
    Get-ChildItem -Path $WorkspaceRoot -Directory | ForEach-Object {
        if (-not $_.Name.StartsWith(".") -and (Test-Path (Join-Path $_.FullName ".git"))) {
            $repos += [PSCustomObject]@{
                Name = $_.Name
                Path = $_.FullName
                HasLbi = Test-Path (Join-Path $_.FullName ".lbi")
            }
        }
    }
    
    return $repos
}

function Get-MonorepoModules {
    <#
    .SYNOPSIS
        List all modules in a monorepo.
    .PARAMETER MonorepoRoot
        Path to monorepo root (defaults to detected workspace).
    .OUTPUTS
        Array of objects with Name, Path, and HasLbi properties.
    #>
    param(
        [string]$MonorepoRoot = (Get-WorkspaceRoot)
    )
    
    if (-not $MonorepoRoot) {
        return @()
    }
    
    $modules = @()
    Get-ChildItem -Path $MonorepoRoot -Directory | ForEach-Object {
        if (-not $_.Name.StartsWith(".")) {
            $modules += [PSCustomObject]@{
                Name = $_.Name
                Path = $_.FullName
                HasLbi = Test-Path (Join-Path $_.FullName ".lbi")
            }
        }
    }
    
    return $modules
}

function Get-InitializedComponents {
    <#
    .SYNOPSIS
        Get repos/modules with .lbi initialized.
    .PARAMETER Root
        Path to workspace/monorepo root.
    .OUTPUTS
        Array of objects with Name and Path properties.
    #>
    param(
        [string]$Root = (Get-WorkspaceRoot)
    )
    
    $mode = Get-DeploymentMode -Path $Root
    
    if ($mode -eq "workspace") {
        return Get-WorkspaceRepos -WorkspaceRoot $Root | Where-Object { $_.HasLbi }
    } elseif ($mode -eq "monorepo") {
        return Get-MonorepoModules -MonorepoRoot $Root | Where-Object { $_.HasLbi }
    }
    
    return @()
}

function Invoke-ForEachInitialized {
    <#
    .SYNOPSIS
        Execute a script block in each initialized repo/module.
    .PARAMETER ScriptBlock
        Script block to execute.
    .EXAMPLE
        Invoke-ForEachInitialized { git status }
    #>
    param(
        [ScriptBlock]$ScriptBlock
    )
    
    $components = Get-InitializedComponents
    
    foreach ($comp in $components) {
        Write-Host "=== $($comp.Name) ===" -ForegroundColor Cyan
        Push-Location $comp.Path
        try {
            & $ScriptBlock
        } finally {
            Pop-Location
        }
    }
}

# Export functions for module use
Export-ModuleMember -Function @(
    'Get-WorkspaceRoot',
    'Get-ProjectRoot',
    'Get-DeploymentMode',
    'Test-IsWorkspace',
    'Test-IsMonorepo',
    'Get-WorkspaceRepos',
    'Get-MonorepoModules',
    'Get-InitializedComponents',
    'Invoke-ForEachInitialized'
)
