param([string]$Destination)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $Destination) { $version = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version; $Destination = Join-Path $projectRoot "..\outputs\Tine-coletul-prototip-$version.zip" }
$Destination = [IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Destination) | Out-Null
$include = @('app\src', 'app\build.gradle', 'tools', 'tests', 'build.gradle', 'settings.gradle', 'gradle.properties', 'build-android.ps1', 'Creeaza-APK.cmd', 'Joaca-pe-PC.cmd', 'README.md', 'DESIGN.md', 'CONTINUA-DE-AICI.md', 'VERIFICARI.md', 'CHANGELOG.md', 'AUDIO-CREDITS.md', 'package.json', '.gitignore')
Add-Type -AssemblyName System.IO.Compression
$stream = [IO.File]::Create($Destination)
try {
    $zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $true)
    try {
        foreach ($item in $include) {
            $source = Join-Path $projectRoot $item
            $files = if (Test-Path -LiteralPath $source -PathType Container) { @(Get-ChildItem -LiteralPath $source -File -Recurse) } else { @(Get-Item -LiteralPath $source) }
            foreach ($file in $files) {
                $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
                $entry = $zip.CreateEntry('Curier/' + $relative, [IO.Compression.CompressionLevel]::Optimal)
                $inputFile = [IO.File]::OpenRead($file.FullName)
                $outputFile = $entry.Open()
                try { $inputFile.CopyTo($outputFile) } finally { $inputFile.Dispose(); $outputFile.Dispose() }
            }
        }
    } finally { $zip.Dispose() }
} finally { $stream.Dispose() }
Write-Output $Destination
