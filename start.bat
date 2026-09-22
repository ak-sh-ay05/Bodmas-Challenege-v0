@echo off
REM Double-click this file to set up and launch the BODMAS server.
cd /d "%~dp0"

if exist .env goto skipenv
copy .env.example .env
echo Created .env with a default admin password (admin / changeme123).
echo You can edit .env later to set your own password.
:skipenv

if exist node_modules goto skipinstall
echo First time setup - installing dependencies, this takes a minute...
call npm install
:skipinstall

echo.
echo Starting server...
echo Game:  http://localhost:3000
echo Admin: http://localhost:3000/admin
echo.
call npm start
pause
