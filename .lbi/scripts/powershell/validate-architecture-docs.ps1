#Requires -Version 5.1
<#
.SYNOPSIS
    Validate Architecture Docs - Check documentation completeness.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Warning { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
    function Write-Header { param([string]$Title) Write-Host "`n=== $Title ===`n" }
    function Get-LbiDir { Join-Path (Get-Location) ".lbi" }
}

Write-Header "Architecture Documentation Validation"

$LbiDir = Get-LbiDir
$ArchDir = Join-Path $LbiDir "docs/technical/architecture"

$ChecksPassed = 0
$ChecksFailed = 0

function Test-ArchFile {
    param([string]$Name, [string]$Path)
    if (Test-Path $Path) {
        Write-Success "  $Name exists"
        $script:ChecksPassed++
        return $true
    } else {
        Write-Warning "  $Name missing"
        $script:ChecksFailed++
        return $false
    }
}

Write-Info "Checking required architecture files..."

Test-ArchFile "System Overview" (Join-Path $ArchDir "system-overview.md") | Out-Null
Test-ArchFile "Component Architecture" (Join-Path $ArchDir "component-architecture.md") | Out-Null
Test-ArchFile "Data Architecture" (Join-Path $ArchDir "data-architecture.md") | Out-Null
Test-ArchFile "Security Architecture" (Join-Path $ArchDir "security-architecture.md") | Out-Null

Write-Host ""
Write-Info "Checking for diagrams..."

$diagramCount = (Get-ChildItem $ArchDir -Include "*.png","*.svg","*.mermaid" -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
if ($diagramCount -gt 0) {
    Write-Success "  Found $diagramCount diagram(s)"
    $ChecksPassed++
} else {
    Write-Info "  No diagrams found (consider adding visualizations)"
}

Write-Host ""
Write-Host "## Validation Summary"
Write-Host ""
Write-Host "Checks passed: $ChecksPassed"
Write-Host "Checks failed: $ChecksFailed"
Write-Host ""

if ($ChecksFailed -eq 0) {
    Write-Success "Architecture documentation is complete!"
} else {
    Write-Warning "Architecture documentation is incomplete"
    Write-Info "Run /lbi.architecture to generate missing documentation"
    exit 1
}
