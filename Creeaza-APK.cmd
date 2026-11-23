@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-android.ps1"
if errorlevel 1 echo Compilarea nu a reusit. Pastreaza prima eroare afisata.
pause
