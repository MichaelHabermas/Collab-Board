#Requires -Version 5.1
<#
.SYNOPSIS
    Create Docs - Generate documentation structure.
#>
param(
    [Parameter(Mandatory=$true)][string]$Feature,
    [string]$DocType = "feature"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonPath = Join-Path $ScriptDir "common.ps1"
if (Test-Path $CommonPath) { . $CommonPath }
else {
    function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
    function Write-Header { param([string]$Title) Write-Host "`n=== $Title ===`n" }
    function Get-LbiDir { Join-Path (Get-Location) ".lbi" }
}

Write-Header "Create Documentation"

$LbiDir = Get-LbiDir
$DocsDir = Join-Path $LbiDir "docs"

switch ($DocType) {
    "feature" {
        $DocFile = Join-Path $DocsDir "features/$Feature.md"
        $content = @"
# $Feature

## Overview

[Brief description]

## Usage

``````bash
lbi [command]
``````

## Examples

[Examples here]
"@
    }
    "api" {
        $DocFile = Join-Path $DocsDir "api/$Feature.md"
        $content = @"
# $Feature API

## Endpoints

### GET /api/$Feature

[Description]
"@
    }
    "guide" {
        $DocFile = Join-Path $DocsDir "guides/$Feature.md"
        $content = @"
# $Feature Guide

## Prerequisites

- [Prerequisite 1]

## Steps

1. [Step 1]
2. [Step 2]
"@
    }
    default {
        Write-Host "Unknown doc type: $DocType" -ForegroundColor Red
        exit 1
    }
}

$parentDir = Split-Path $DocFile -Parent
if (-not (Test-Path $parentDir)) {
    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
}

Set-Content -Path $DocFile -Value $content -Encoding UTF8

Write-Success "Created: $DocFile"
Write-Info "Documentation type: $DocType"
