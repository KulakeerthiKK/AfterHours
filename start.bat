@echo off
title AEGIS-AGENT Security War Room
echo ====================================================
echo   AEGIS-AGENT - Multi-Agent Security War Room
echo   Front-End Hackathon Prototype
echo ====================================================
echo.
echo Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Node.js...
    start http://localhost:3000
    node server.js
) else (
    if exist "C:\Program Files\nodejs\node.exe" (
        echo Starting server with C:\Program Files\nodejs\node.exe...
        start http://localhost:3000
        "C:\Program Files\nodejs\node.exe" server.js
    ) else (
        echo Node.js not found in PATH or standard location.
        echo Opening index.html directly in your default browser...
        start index.html
    )
)
pause

