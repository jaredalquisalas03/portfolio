@echo off
cd /d "%~dp0"
git pull
call npm install
if not exist ghl-session.json call npm run save-session
node 03-build-lead-intake.js --pause
pause
