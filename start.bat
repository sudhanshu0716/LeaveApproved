@echo off
title LeaveApproved App Launcher
echo ==============================================
echo       Starting LeaveApproved App...
echo ==============================================

echo [1/3] Starting Backend Server on port 5000...
start "LeaveApproved - Backend" cmd /c "cd backend && npm run dev"

echo [2/3] Starting Frontend Server on port 5173...
start "LeaveApproved - Frontend" cmd /c "cd frontend && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo Opening application in your default browser...
start http://localhost:5173

echo ==============================================
echo       All set! Enjoy your trip planning!
echo ==============================================
pause
