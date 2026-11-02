@echo off
title SatyaCheck Launcher
cd /d "%~dp0"

echo ========================================================
echo        Starting SatyaCheck Full-Stack Application
echo ========================================================
echo.

echo [1/2] Starting Python Flask ML Backend (Port 5000)...
start "SatyaCheck Backend (Port 5000)" cmd /k "cd /d "%~dp0" && server\venv\Scripts\python.exe server\run.py"

echo [2/2] Starting React Vite Frontend (Port 8080)...
start "SatyaCheck Frontend (Port 8080)" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo ========================================================
echo Both servers are launching!
echo Backend API:  http://localhost:5000
echo Frontend Web: http://localhost:8080
echo ========================================================
echo Keep both terminal windows open while using SatyaCheck.
echo.
pause
