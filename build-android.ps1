param(
    [string]$ToolchainRoot,
    [switch]$Offline,
    [switch]$ReleaseCheck,
    [int]$PreviousVersionCode = 0
)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$appConfig = Get-Content -LiteralPath (Join-Path $projectRoot 'app\build.gradle') -Raw
$versionName = [regex]::Match($appConfig, "(?m)^\s*versionName\s+'([^']+)'").Groups[1].Value
$versionCode = [int][regex]::Match($appConfig, '(?m)^\s*versionCode\s+(\d+)').Groups[1].Value
$targetSdk = [int][regex]::Match($appConfig, '(?m)^\s*targetSdk\s+(\d+)').Groups[1].Value
$packageVersion = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
if (!$versionName -or $versionName -ne $packageVersion -or $versionCode -le 0 -or $versionCode -gt 2100000000) {
    throw 'Verifica versionCode si versionName in Gradle si versiunea din package.json.'
}
if ($versionCode -le $PreviousVersionCode) {
    throw "versionCode $versionCode trebuie sa depaseasca valoarea $PreviousVersionCode folosita in Play Console."
}
if (-not $ToolchainRoot) { $ToolchainRoot = Join-Path $projectRoot '..\Play\.tools' }
$ToolchainRoot = [IO.Path]::GetFullPath($ToolchainRoot)
$gradle = Join-Path $ToolchainRoot 'gradle-8.11.1\bin\gradle.bat'
if (-not (Test-Path -LiteralPath $gradle)) { throw "Lipseste Gradle 8.11.1. Specifica uneltele existente: .\build-android.ps1 -ToolchainRoot 'C:\cale\catre\.tools'" }
$jdkRoot = Join-Path $ToolchainRoot 'jdk'
$jdk = @(Get-ChildItem -LiteralPath $jdkRoot -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin\javac.exe') })
if ($jdk.Count -eq 1) { $env:JAVA_HOME = $jdk[0].FullName }
if (-not $env:JAVA_HOME -or -not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) { throw 'Lipseste JDK 17 sau 21.' }
$sdk = Join-Path $ToolchainRoot 'android-sdk'
if (-not (Test-Path -LiteralPath (Join-Path $sdk 'platforms\android-36\android.jar'))) { throw 'Lipseste Android SDK API 36 din directorul de unelte.' }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:PATH = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:PATH
$sdkPath = $sdk.Replace('\', '/').Replace(':', '\:')
[IO.File]::WriteAllText((Join-Path $projectRoot 'local.properties'), "sdk.dir=$sdkPath`n", [Text.UTF8Encoding]::new($false))
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    $curierTests = @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'tests') -Filter '*.test.cjs' -File | ForEach-Object FullName)
    & $node.Source --test @curierTests
    if ($LASTEXITCODE -ne 0) { throw 'Testele jocului au esuat.' }
}
$arguments = @('-p', $projectRoot, '--no-daemon')
if ($Offline) { $arguments += '--offline' }
$tasks = if ($ReleaseCheck) { @('lintRelease', 'bundleRelease') } else { @('lintDebug', 'assembleDebug') }
& $gradle @arguments @tasks
if ($LASTEXITCODE -ne 0) { throw 'Compilarea Android a esuat. Pastreaza prima eroare Gradle din jurnal.' }
$artifacts = Join-Path $projectRoot 'artifacts'
if ($ReleaseCheck) {
    $source = Join-Path $projectRoot 'app\build\outputs\bundle\release\app-release.aab'
    $filename = "Tine-coletul-$versionName-verificare.aab"
    $kind = 'release-check'
} else {
    $source = Join-Path $projectRoot 'app\build\outputs\apk\debug\app-debug.apk'
    $filename = "Tine-coletul-$versionName-test.apk"
    $kind = 'debug-test'
}
if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw 'Gradle nu a generat fisierul asteptat.' }
New-Item -ItemType Directory -Force -Path $artifacts | Out-Null
$output = Join-Path $artifacts $filename
Copy-Item -LiteralPath $source -Destination $output -Force
@{
    version=$versionName
    versionCode=$versionCode
    kind=$kind
    targetSdk=$targetSdk
    lint='passed'
    sha256=(Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash
    builtAt=[DateTime]::UtcNow.ToString('o')
} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $artifacts "$kind.json") -Encoding UTF8
Write-Host "GATA: $output"
if ($ReleaseCheck) {
    Write-Host 'AAB de verificare, nesemnat. Semneaza separat cu cheia de upload a jocului pentru Google Play.'
} else {
    Write-Host 'APK debug pentru testare pe telefon.'
}
