#Requires -Version 5.1
<#
.SYNOPSIS
    Common utility functions for LBI scripts.
.DESCRIPTION
    Provides shared functionality across all PowerShell scripts including
    output formatting, path resolution, and project detection.
#>

# Strict mode for better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Script-level variables
$Script:ProjectRoot = $null
$Script:LbiDir = $null

function Write-Success {
    <#
    .SYNOPSIS
        Prints a success message in green.
    #>
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    <#
    .SYNOPSIS
        Prints an info message in blue.
    #>
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Write-Warning {
    <#
    .SYNOPSIS
        Prints a warning message in yellow.
    #>
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    <#
    .SYNOPSIS
        Prints an error message in red.
    #>
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Fatal {
    <#
    .SYNOPSIS
        Prints a fatal error and exits.
    #>
    param([string]$Message)
    Write-Error $Message
    exit 1
}

function Test-CommandExists {
    <#
    .SYNOPSIS
        Checks if a command exists.
    #>
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-ProjectRoot {
    <#
    .SYNOPSIS
        Gets the project root directory.
    .DESCRIPTION
        Searches up from the current directory for .lbi, .lbi.yaml, or .git markers.
    #>
    if ($Script:ProjectRoot) {
        return $Script:ProjectRoot
    }
    
    $dir = Get-Location
    while ($dir) {
        $lbiDir = Join-Path $dir ".lbi"
        $lbiYaml = Join-Path $dir ".lbi.yaml"
        $gitDir = Join-Path $dir ".git"
        
        if ((Test-Path $lbiDir) -or (Test-Path $lbiYaml) -or (Test-Path $gitDir)) {
            $Script:ProjectRoot = $dir.Path
            return $dir.Path
        }
        
        $parent = Split-Path $dir -Parent
        if ($parent -eq $dir) {
            break
        }
        $dir = $parent
    }
    
    # Default to current directory
    $Script:ProjectRoot = (Get-Location).Path
    return $Script:ProjectRoot
}

function Get-LbiDir {
    <#
    .SYNOPSIS
        Gets the .lbi directory path.
    #>
    if ($Script:LbiDir) {
        return $Script:LbiDir
    }
    
    $root = Get-ProjectRoot
    $Script:LbiDir = Join-Path $root ".lbi"
    return $Script:LbiDir
}

function Test-LbiProject {
    <#
    .SYNOPSIS
        Checks if we're in an LBI project.
    #>
    $lbiDir = Get-LbiDir
    Test-Path $lbiDir
}

function Assert-LbiProject {
    <#
    .SYNOPSIS
        Ensures we're in an LBI project, exits if not.
    #>
    if (-not (Test-LbiProject)) {
        Write-Fatal "Not in an LBI project. Run 'lbi init' first."
    }
}

function Get-CurrentFeature {
    <#
    .SYNOPSIS
        Gets the current feature name from the specs directory.
    #>
    $lbiDir = Get-LbiDir
    $specsDir = Join-Path $lbiDir "specs"
    
    if (Test-Path $specsDir) {
        $latest = Get-ChildItem $specsDir -Directory | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 1
        
        if ($latest) {
            return $latest.Name
        }
    }
    return $null
}

function Confirm-Directory {
    <#
    .SYNOPSIS
        Creates a directory if it doesn't exist.
    #>
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Info "Created directory: $Path"
    }
}

function Confirm-File {
    <#
    .SYNOPSIS
        Creates a file with content if it doesn't exist.
    #>
    param(
        [string]$Path,
        [string]$Content = ""
    )
    
    if (-not (Test-Path $Path)) {
        $dir = Split-Path $Path -Parent
        Confirm-Directory $dir
        Set-Content -Path $Path -Value $Content -Encoding UTF8
        Write-Info "Created file: $Path"
    }
}

function Get-CurrentBranch {
    <#
    .SYNOPSIS
        Gets the current git branch.
    #>
    if (Test-CommandExists "git") {
        try {
            $insideGit = & git rev-parse --is-inside-work-tree 2>$null
            if ($insideGit) {
                return & git rev-parse --abbrev-ref HEAD 2>$null
            }
        } catch {
            return $null
        }
    }
    return $null
}

function Test-GitClean {
    <#
    .SYNOPSIS
        Checks if git working directory is clean.
    #>
    if (Test-CommandExists "git") {
        try {
            $insideGit = & git rev-parse --is-inside-work-tree 2>$null
            if ($insideGit) {
                $status = & git status --porcelain 2>$null
                return [string]::IsNullOrEmpty($status)
            }
        } catch {
            return $false
        }
    }
    return $false
}

function Get-Timestamp {
    <#
    .SYNOPSIS
        Gets current timestamp in ISO format.
    #>
    [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
}

function ConvertTo-Slug {
    <#
    .SYNOPSIS
        Converts a string to a slug (lowercase, hyphens).
    #>
    param([string]$Text)
    
    $slug = $Text.ToLower()
    $slug = $slug -replace '\s+', '-'
    $slug = $slug -replace '[^a-z0-9-]', ''
    return $slug
}

function Test-CI {
    <#
    .SYNOPSIS
        Checks if running in CI environment.
    #>
    $env:CI -or $env:GITHUB_ACTIONS -or $env:GITLAB_CI
}

function Confirm-Action {
    <#
    .SYNOPSIS
        Prompts for confirmation (skips in CI).
    #>
    param([string]$Prompt = "Continue?")
    
    if (Test-CI) {
        return $true
    }
    
    $response = Read-Host "$Prompt [y/N]"
    return $response -match '^[yY]'
}

function Write-Header {
    <#
    .SYNOPSIS
        Prints a header.
    #>
    param([string]$Title)
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════"
    Write-Host "  $Title"
    Write-Host "═══════════════════════════════════════════════════════════════"
    Write-Host ""
}

function Write-Subheader {
    <#
    .SYNOPSIS
        Prints a subheader.
    #>
    param([string]$Title)
    
    Write-Host ""
    Write-Host "--- $Title ---"
    Write-Host ""
}

function Invoke-Command {
    <#
    .SYNOPSIS
        Runs a command and captures output.
    #>
    param(
        [string]$Description,
        [scriptblock]$Command
    )
    
    Write-Info "Running: $Description"
    try {
        & $Command
        Write-Success "$Description completed"
    } catch {
        Write-Error "Command failed: $_"
        throw
    }
}

# Export functions
Export-ModuleMember -Function @(
    'Write-Success',
    'Write-Info',
    'Write-Warning',
    'Write-Error',
    'Write-Fatal',
    'Test-CommandExists',
    'Get-ProjectRoot',
    'Get-LbiDir',
    'Test-LbiProject',
    'Assert-LbiProject',
    'Get-CurrentFeature',
    'Confirm-Directory',
    'Confirm-File',
    'Get-CurrentBranch',
    'Test-GitClean',
    'Get-Timestamp',
    'ConvertTo-Slug',
    'Test-CI',
    'Confirm-Action',
    'Write-Header',
    'Write-Subheader',
    'Invoke-Command'
)
