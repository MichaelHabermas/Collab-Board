#Requires -Version 5.1
<#
.SYNOPSIS
    Lines of code analysis script.
.DESCRIPTION
    Analyzes codebase size by language.
#>

$ErrorActionPreference = "Stop"

# Import common functions
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$ScriptDir\common.ps1"

Write-Header "Lines of Code Analysis"

$ProjectRoot = Get-ProjectRoot
Set-Location $ProjectRoot

# Excluded directories
$ExcludedDirs = @(".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build")

function Get-LineCount {
    param(
        [string]$Extension,
        [string]$Name
    )
    
    $files = Get-ChildItem -Path . -Filter "*.$Extension" -Recurse -File -ErrorAction SilentlyContinue | 
        Where-Object { 
            $path = $_.FullName
            -not ($ExcludedDirs | Where-Object { $path -like "*\$_\*" })
        }
    
    if ($files) {
        $totalLines = 0
        foreach ($file in $files) {
            try {
                $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
                $totalLines += ($content | Measure-Object).Count
            } catch {
                continue
            }
        }
        $fileCount = ($files | Measure-Object).Count
        if ($fileCount -gt 0) {
            "{0,-15} {1,8} lines in {2,5} files" -f "$Name`:", $totalLines, $fileCount
        }
    }
}

Write-Subheader "By Language"

Get-LineCount "py" "Python"
Get-LineCount "js" "JavaScript"
Get-LineCount "ts" "TypeScript"
Get-LineCount "jsx" "JSX"
Get-LineCount "tsx" "TSX"
Get-LineCount "go" "Go"
Get-LineCount "rs" "Rust"
Get-LineCount "java" "Java"
Get-LineCount "kt" "Kotlin"
Get-LineCount "rb" "Ruby"
Get-LineCount "php" "PHP"
Get-LineCount "c" "C"
Get-LineCount "cpp" "C++"
Get-LineCount "cs" "C#"
Get-LineCount "swift" "Swift"

Write-Subheader "Configuration & Data"

Get-LineCount "json" "JSON"
Get-LineCount "yaml" "YAML"
Get-LineCount "yml" "YAML"
Get-LineCount "toml" "TOML"
Get-LineCount "xml" "XML"

Write-Subheader "Documentation"

Get-LineCount "md" "Markdown"
Get-LineCount "txt" "Text"
Get-LineCount "rst" "RST"

Write-Subheader "Styles"

Get-LineCount "css" "CSS"
Get-LineCount "scss" "SCSS"
Get-LineCount "less" "LESS"

Write-Subheader "Shell"

Get-LineCount "sh" "Bash"
Get-LineCount "ps1" "PowerShell"

Write-Host ""
Write-Subheader "Total Summary"

$codeExtensions = @("py", "js", "ts", "jsx", "tsx", "go", "rs", "java", "rb", "php")
$totalLines = 0
$totalFiles = 0

foreach ($ext in $codeExtensions) {
    $files = Get-ChildItem -Path . -Filter "*.$ext" -Recurse -File -ErrorAction SilentlyContinue | 
        Where-Object { 
            $path = $_.FullName
            -not ($ExcludedDirs | Where-Object { $path -like "*\$_\*" })
        }
    
    if ($files) {
        foreach ($file in $files) {
            try {
                $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
                $totalLines += ($content | Measure-Object).Count
                $totalFiles++
            } catch {
                continue
            }
        }
    }
}

Write-Info "Total code lines: $totalLines"
Write-Info "Total code files: $totalFiles"

Write-Success "Analysis complete"
