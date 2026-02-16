<#
.SYNOPSIS
    Context7 library ID resolution script.

.DESCRIPTION
    Resolves a library name to Context7 library IDs.

.PARAMETER LibraryName
    Name of the library to resolve (e.g., react, fastapi).

.PARAMETER Timeout
    Connection timeout in seconds. Default is 30.

.EXAMPLE
    .\context7-resolve.ps1 react
    .\context7-resolve.ps1 "next.js"
    .\context7-resolve.ps1 express -Timeout 60
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$LibraryName,

    [Parameter(Mandatory = $false)]
    [int]$Timeout = 30
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

Write-ColorOutput "Resolving library: $LibraryName" -Color Cyan

# Check if lbi is available
$lbiCommand = Get-Command lbi -ErrorAction SilentlyContinue

if ($null -eq $lbiCommand) {
    Write-ColorOutput "Warning: lbi command not found. Attempting with python -m lbi" -Color Yellow
    $lbiArgs = @("-m", "lbi", "context7", "resolve", $LibraryName, "--timeout", $Timeout)
    $process = Start-Process -FilePath "python" -ArgumentList $lbiArgs -NoNewWindow -Wait -PassThru
}
else {
    $lbiArgs = @("context7", "resolve", $LibraryName, "--timeout", $Timeout)
    $process = Start-Process -FilePath "lbi" -ArgumentList $lbiArgs -NoNewWindow -Wait -PassThru
}

if ($process.ExitCode -eq 0) {
    Write-ColorOutput "Resolution complete" -Color Green
}
else {
    Write-ColorOutput "Resolution failed" -Color Red
}

exit $process.ExitCode
