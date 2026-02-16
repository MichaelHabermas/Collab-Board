#Requires -Version 5.1
<#
.SYNOPSIS
    Comprehensive code review helper.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
    function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }
    function Get-ProjectRoot { (Get-Location).Path }
    function Get-LbiDir { Join-Path (Get-ProjectRoot) ".lbi" }
}

Write-Header "Comprehensive Code Review"

$ProjectRoot = Get-ProjectRoot
$LbiDir = Get-LbiDir
$ReviewDir = Join-Path $LbiDir "reviews"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ReviewFile = Join-Path $ReviewDir "review-$timestamp.md"

if (-not (Test-Path $ReviewDir)) {
    New-Item -ItemType Directory -Path $ReviewDir -Force | Out-Null
}

$content = @"
# Code Review Report

Generated: $((Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"))

## Review Checklist

### Code Quality
- [ ] Code follows project style guidelines
- [ ] No duplicate code or unnecessary complexity
- [ ] Functions are small and focused

### Security
- [ ] No hardcoded credentials or secrets
- [ ] Input validation is present

### Testing
- [ ] New code has test coverage
- [ ] Tests are meaningful

### Documentation
- [ ] Public APIs are documented
- [ ] README is updated if needed

## Recent Changes

"@

# Add git changes
if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
        $diff = & git diff --stat HEAD~1 2>$null
        $content += "### Files Changed`n``````n$diff`n```````n"
        
        $logs = & git log --oneline -10 2>$null
        $content += "`n### Commit Messages`n``````n$logs`n```````n"
    } catch { }
}

$content += @"

## Findings

_Add your review findings here_

## Recommendations

_Add your recommendations here_
"@

Set-Content -Path $ReviewFile -Value $content -Encoding UTF8
Write-Success "Review template created: $ReviewFile"
Write-Info "Edit the file to complete your review"
