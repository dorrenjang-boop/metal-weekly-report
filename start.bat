@echo off
echo ======================================================
echo Starting Local Development Environment (Split Mode)
echo ======================================================
echo.

echo [Checking Dependencies...]
if not exist "frontend\node_modules\" (
    echo Frontend node_modules not found. Installing...
    cd frontend
    call npm install
    cd ..
)
if not exist "backend\node_modules\" (
    echo Backend node_modules not found. Installing...
    cd backend
    call npm install
    cd ..
)
echo Dependencies check complete.
echo.

echo 1. Starting Backend API Server (Port 5000)...
cd backend
start "Backend Server" cmd /k "npx nodemon server.js"
cd ..
echo.

echo 2. Starting Frontend Dev Server (Port 5173)...
cd frontend
start "Frontend Server" cmd /k "npm run dev"
cd ..
echo.

echo ======================================================
echo [LOCAL DEV URL]
echo All servers are starting in separate windows.
echo Open http://localhost:5173 in your browser to access the app.
echo ======================================================
pause
