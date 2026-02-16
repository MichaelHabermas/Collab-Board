<#
.SYNOPSIS
    Context7 library documentation lookup script.

.DESCRIPTION
    Searches for and retrieves library documentation from Context7.

.PARAMETER LibraryName
    Name of the library (e.g., react, fastapi).

.PARAMETER Topic
    Filter docs to specific topic.

.PARAMETER Tokens
    Maximum tokens to return. Default is 10000.

.PARAMETER Timeout
    Request timeout in seconds. Default is 60.

.PARAMETER Raw
    Output raw content without formatting.

.EXAMPLE
    .\context7-lookup.ps1 react
    .\context7-lookup.ps1 react -Topic "hooks"
    .\context7-lookup.ps1 fastapi -Tokens 5000
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$LibraryName,

    [Parameter(Mandatory = $false)]
    [string]$Topic,

    [Parameter(Mandatory = $false)]
    [int]$Tokens = 10000,

    [Parameter(Mandatory = $false)]
    [int]$Timeout = 60,

    [Parameter(Mandatory = $false)]
    [switch]$Raw
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "Searching for library documentation: $LibraryName" -Color Cyan

# Check if lbi is available
$lbiCommand = Get-Command lbi -ErrorAction SilentlyContinue

# Build arguments
$lbiArgs = @("context7", "search", $LibraryName, "--tokens", $Tokens, "--timeout", $Timeout)

if ($Topic) {
    $lbiArgs += @("--topic", $Topic)
    Write-ColorOutput "Topic filter: $Topic" -Color Cyan
}

if ($Raw) {
    $lbiArgs += "--raw"
}

if ($null -eq $lbiCommand) {
    Write-ColorOutput "Warning: lbi command not found. Attempting with python -m lbi" -Color Yellow
    $pythonArgs = @("-m", "lbi") + $lbiArgs
    $process = Start-Process -FilePath "python" -ArgumentList $pythonArgs -NoNewWindow -Wait -PassThru
}
else {
    $process = Start-Process -FilePath "lbi" -ArgumentList $lbiArgs -NoNewWindow -Wait -PassThru
}

if ($process.ExitCode -eq 0) {
    Write-ColorOutput "Lookup complete" -Color Green
}
else {
    Write-ColorOutput "Lookup failed" -Color Red
}

exit $process.ExitCode
