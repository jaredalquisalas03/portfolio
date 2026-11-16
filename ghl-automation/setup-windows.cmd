@echo off
REM One-time setup for Windows. Double-click it or run it in Command Prompt.
REM Installs Node.js LTS (if missing or too old), Playwright and Chromium.
cd /d "%~dp0"
echo.
echo === GHL automation setup ===

REM 1. Node.js 22.9 or newer
where node >nul 2>nul
if errorlevel 1 goto install_node
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=9)?0:1)"
if errorlevel 1 goto install_node
for /f %%v in ('node -v') do echo [ok] Node.js %%v
goto deps

:install_node
echo [..] Installing Node.js LTS with winget. Approve the Windows prompt if asked.
where winget >nul 2>nul
if errorlevel 1 (
  echo [!!] winget not found. Install Node.js LTS from https://nodejs.org then run this again.
  pause
  exit /b 1
)
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
echo.
echo [!!] Node.js installed. CLOSE this window, open a NEW Command Prompt, and run setup-windows.cmd again.
pause
exit /b 0

:deps
REM 2. Playwright + Chromium
echo [..] Installing Playwright (npm install)...
call npm install
if errorlevel 1 (
  echo [!!] npm install failed. Copy the error above and send it.
  pause
  exit /b 1
)
echo [..] Installing Chromium for Playwright...
call npx playwright install chromium
if errorlevel 1 (
  echo [!!] Chromium install failed. Copy the error above and send it.
  pause
  exit /b 1
)
echo [ok] Playwright and Chromium installed

REM 3. .env (never overwrites an existing one)
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo [..] Created .env. Opening it - set GHL_LOCATION_ID and GHL_EXPECTED_ACCOUNT, then save.
  notepad ".env"
) else (
  echo [ok] .env already exists
)

if exist "ghl-session.json" (echo [ok] Session file found) else (echo [..] No session yet. Run: npm run login)

echo.
echo === Setup done. Next: npm run check ===
pause
