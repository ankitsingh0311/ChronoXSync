@echo off
echo ===================================================
echo Starting EduTrack 3D Frontend (React + Vite)
echo ===================================================
if exist "%LocalAppData%\Programs\nodejs" (
    set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
)
if exist "C:\Program Files\nodejs" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)
cd /d "%~dp0frontend"
call npm run dev
pause

