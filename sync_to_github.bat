@echo off
setlocal
echo ===================================================
echo   ChronoXSync - Automatic GitHub Sync Tool
echo ===================================================
echo.
cd /d "%~dp0"

echo 1. Checking git status...
git status --short
echo.

set /p COMMIT_MSG="Enter commit message (Press Enter for auto-message): "
if "%COMMIT_MSG%"=="" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
    for /f "tokens=1-2 delims=/:" %%a in ("%TIME%") do (set mytime=%%a:%%b)
    set COMMIT_MSG=update: automatic sync on %mydate% %mytime%
)

echo.
echo 2. Staging all changes...
git add -A

echo.
echo 3. Creating commit: "%COMMIT_MSG%"...
git commit -m "%COMMIT_MSG%"

echo.
echo 4. Pushing directly to GitHub (origin main)...
git push origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Push failed. Check your internet connection or git credentials.
) else (
    echo.
    echo ===================================================
    echo   SUCCESS! All changes are live on GitHub!
    echo ===================================================
)

echo.
pause
