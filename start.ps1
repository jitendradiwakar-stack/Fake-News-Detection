# SatyaCheck Full-Stack Launcher (PowerShell)
$projectRoot = $PSScriptRoot
if (-not $projectRoot) { $projectRoot = Get-Location }

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       Starting SatyaCheck Full-Stack Application       " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Launching Python Flask Backend (Port 5000)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; .\server\venv\Scripts\python.exe server\run.py"

Write-Host "[2/2] Launching React Vite Frontend (Port 8080)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot\client'; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "Servers launched in separate PowerShell windows!" -ForegroundColor Yellow
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "Frontend Web: http://localhost:8080" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Yellow
