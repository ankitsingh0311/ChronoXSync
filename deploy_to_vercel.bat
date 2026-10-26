@echo off
setlocal
echo ===================================================
echo   ChronoXSync - Direct Vercel Production Deploy
echo ===================================================
echo.
cd /d "%~dp0\frontend"

echo Building and deploying frontend to Vercel Production...
call npx vercel --prod --yes

if errorlevel 1 (
    echo.
    echo [ERROR] Deployment to Vercel failed.
) else (
    echo.
    echo ===================================================
    echo   SUCCESS! Live at https://chronoxsync.vercel.app
    echo ===================================================
)

echo.
pause
