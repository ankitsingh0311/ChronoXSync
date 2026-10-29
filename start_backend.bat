@echo off
echo ===================================================
echo # Launching the EduTrack 3D backend server using FastAPI and Uvicorn.
echo ===================================================
cd /d "%~dp0backend"

set "PYTHON_EXE="
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" --version >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_EXE=.venv\Scripts\python.exe"
    )
)

if "%PYTHON_EXE%"=="" (
    python --version >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_EXE=python"
    )
)

if "%PYTHON_EXE%"=="" (
    py --version >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_EXE=py"
    )
)

if "%PYTHON_EXE%"=="" (
    echo [ERROR] No working Python installation found!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo Starting backend with: %PYTHON_EXE% ...
"%PYTHON_EXE%" app.py
pause
