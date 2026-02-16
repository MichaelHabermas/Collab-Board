#Requires -Version 5.1
<#
.SYNOPSIS
    SLO synthetic monitoring.
#>

param([string]$EndpointsFile = "./slos/endpoints.txt")

function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }

Write-Header "SLO Synthetic Monitoring"

$Failures = 0
$Total = 0

if (-not (Test-Path $EndpointsFile)) {
    Write-Info "No endpoints file found at: $EndpointsFile"
    Write-Info "Create file with one URL per line"
    exit 0
}

Write-Info "Running synthetic checks..."
Write-Host ""

Get-Content $EndpointsFile | ForEach-Object {
    $endpoint = $_.Trim()
    if ([string]::IsNullOrEmpty($endpoint) -or $endpoint.StartsWith('#')) { return }
    
    $Total++
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $endpoint -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $stopwatch.Stop()
        
        if ($response.StatusCode -eq 200) {
            Write-Success "$endpoint`: $($stopwatch.ElapsedMilliseconds)ms"
        } else {
            Write-Warning "$endpoint`: HTTP $($response.StatusCode)"
            $Failures++
        }
    } catch {
        Write-Error "$endpoint`: FAILED"
        $Failures++
    }
}

Write-Host ""
Write-Info "Synthetic checks completed: $Total"

if ($Failures -eq 0) {
    Write-Success "All endpoints are healthy!"
} else {
    Write-Error "$Failures endpoint(s) are unhealthy"
    exit 1
}
