@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Instale o Node.js em https://nodejs.org e rode de novo. & pause & exit /b)
if not exist node_modules (echo Instalando dependencias... & call npm install)
echo.
echo Abra http://localhost:3000 no navegador
node server.js
pause
