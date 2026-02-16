#Requires -Version 5.1
<#
.SYNOPSIS
    Scaffold observability configuration.
#>

function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Header { param([string]$Title) Write-Host "`n═══ $Title ═══`n" }

Write-Header "Scaffolding Observability"

$ProjectRoot = Get-Location
$ObsDir = Join-Path $ProjectRoot "observability"

if (-not (Test-Path $ObsDir)) {
    New-Item -ItemType Directory -Path $ObsDir -Force | Out-Null
}

# Prometheus config
$prometheusConfig = @"
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'application'
    static_configs:
      - targets: ['localhost:8080']
"@
Set-Content -Path (Join-Path $ObsDir "prometheus.yml") -Value $prometheusConfig -Encoding UTF8
Write-Success "Created: prometheus.yml"

# Dashboard
$dashboard = @{ title = "Application Dashboard"; panels = @() } | ConvertTo-Json
Set-Content -Path (Join-Path $ObsDir "dashboard.json") -Value $dashboard -Encoding UTF8
Write-Success "Created: dashboard.json"

Write-Host ""
Write-Success "Observability scaffolding complete!"
Write-Info "Customize configurations in: $ObsDir"
