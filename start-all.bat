@echo off
echo ===================================================
echo   LJ UNIVERSITY - DEPARTMENT SYSTEM
echo ===================================================
echo Starting Backend Server (Port 5000)...
start cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak > nul

echo Starting Frontend Web App (Port 5173)...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
pause
