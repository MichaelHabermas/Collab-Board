#Requires -Version 5.1
<#
.SYNOPSIS
    QA common utilities.
#>

function Get-TestFramework {
    param([string]$ProjectRoot = ".")
    
    $pyproject = Join-Path $ProjectRoot "pyproject.toml"
    if (Test-Path $pyproject) {
        $content = Get-Content $pyproject -Raw
        if ($content -match 'pytest') { return "pytest" }
    }
    
    $packageJson = Join-Path $ProjectRoot "package.json"
    if (Test-Path $packageJson) {
        $content = Get-Content $packageJson -Raw
        if ($content -match '"jest"') { return "jest" }
        if ($content -match '"mocha"') { return "mocha" }
    }
    
    $goMod = Join-Path $ProjectRoot "go.mod"
    if (Test-Path $goMod) { return "go-test" }
    
    return "unknown"
}

function Get-TestFiles {
    param(
        [string]$ProjectRoot = ".",
        [string]$Framework
    )
    
    if (-not $Framework) { $Framework = Get-TestFramework -ProjectRoot $ProjectRoot }
    
    switch ($Framework) {
        "pytest" { Get-ChildItem $ProjectRoot -Recurse -Include "test_*.py","*_test.py" -ErrorAction SilentlyContinue }
        "jest" { Get-ChildItem $ProjectRoot -Recurse -Include "*.test.js","*.spec.js","*.test.ts","*.spec.ts" -ErrorAction SilentlyContinue }
        "mocha" { Get-ChildItem $ProjectRoot -Recurse -Include "*.test.js","*.spec.js" -ErrorAction SilentlyContinue }
        "go-test" { Get-ChildItem $ProjectRoot -Recurse -Include "*_test.go" -ErrorAction SilentlyContinue }
        default { @() }
    }
}

function Get-ArchitectureEntities {
    param([string]$LbiDir = ".lbi")
    
    $dataModel = Get-ChildItem (Join-Path $LbiDir "specs/*/data-model.md") -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($dataModel) { return Get-Content $dataModel.FullName -Raw }
    
    $archFile = Join-Path $LbiDir "docs/technical/architecture/data-architecture.md"
    if (Test-Path $archFile) { return Get-Content $archFile -Raw }
    
    return "No entity documentation found"
}

Write-Host "QA common utilities loaded"
