@echo off
echo Starting Pose With AI Frontend...
cd /d "%~dp0frontend"
if not exist node_modules (
    call npm install
)
call npm run dev
