@echo off
echo Starting RPG Platform Development Servers...
echo.

REM Check if website-api dependencies are installed
if not exist "services\website-api\node_modules" (
    echo Installing Website API dependencies...
    cd services\website-api
    call npm install
    cd ..\..
)

REM Check if game-server dependencies are installed
if not exist "services\game-server\node_modules" (
    echo Installing Game Server dependencies...
    cd services\game-server
    call npm install
    cd ..\..
)

REM Generate Prisma client if needed
echo Generating Prisma client...
cd services\website-api
call npm run db:generate
cd ..\..

echo.
echo =====================================
echo Starting servers...
echo =====================================
echo.
echo Website API will run on http://localhost:3000
echo Game Server will run on http://localhost:3001
echo.
echo Press Ctrl+C to stop all servers
echo.

start "Website API" cmd /k "cd services\website-api && npm run dev"
timeout /t 2 /nobreak >nul
start "Game Server" cmd /k "cd services\game-server && npm run dev"

echo Both servers are starting...
pause

