#Requires -Version 5.1
<#
.SYNOPSIS
    Observability sanity checks.
#>

param(
    [string]$MetricsEndpoint = "http://localhost:8080/metrics"
)

function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }

Write-Header "Observability Sanity Check"

$Failures = 0
$Checks = 0

# Check metrics endpoint
Write-Info "Checking metrics endpoint: $MetricsEndpoint"
$Checks++
try {
    $response = Invoke-WebRequest -Uri $MetricsEndpoint -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Success "Metrics endpoint is accessible"
} catch {
    Write-Warning "Metrics endpoint not accessible (service may not be running)"
    $Failures++
}

# Check Prometheus config
$prometheusConfig = "./observability/prometheus.yml"
Write-Info "Checking Prometheus config: $prometheusConfig"
$Checks++
if (Test-Path $prometheusConfig) {
    Write-Success "Prometheus config exists"
} else {
    Write-Warning "Prometheus config not found"
    $Failures++
}

# Check logging config
$loggingConfig = "./observability/logging.yaml"
Write-Info "Checking logging config: $loggingConfig"
$Checks++
if (Test-Path $loggingConfig) {
    Write-Success "Logging config exists"
} else {
    Write-Warning "Logging config not found"
}

Write-Host ""
Write-Info "Checks completed: $Checks"

if ($Failures -eq 0) {
    Write-Success "All sanity checks passed!"
} else {
    Write-Error "$Failures check(s) failed"
    exit 1
}
