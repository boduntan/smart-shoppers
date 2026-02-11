@echo off
REM Quick setup for Windows - Install staples-hk from Azure Artifacts

echo.
echo ========================================
echo   Staples-HK Azure Artifacts Setup
echo ========================================
echo.

REM Check if NPM_TOKEN is set
if "%NPM_TOKEN%"=="" (
    echo [ERROR] NPM_TOKEN environment variable is not set!
    echo.
    echo Please follow these steps:
    echo.
    echo 1. Go to: https://dev.azure.com/SPLS/Staples-ChatBot/_usersSettings/tokens
    echo 2. Create a new PAT with 'Packaging (Read)' scope
    echo 3. Encode your PAT to base64:
    echo    - PowerShell: [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('YOUR_PAT'))
    echo 4. Set the environment variable:
    echo    - PowerShell: $env:NPM_TOKEN = 'YOUR_BASE64_TOKEN'
    echo    - CMD: set NPM_TOKEN=YOUR_BASE64_TOKEN
    echo.
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] NPM_TOKEN is set
echo.

echo Cleaning previous installation...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Installing dependencies from Azure Artifacts...
echo.

call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS! 
    echo ========================================
    echo.
    echo staples-hk@0.0.3 installed successfully!
    echo.
    echo You can now run: npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo   INSTALLATION FAILED
    echo ========================================
    echo.
    echo Please check:
    echo   1. NPM_TOKEN is correctly encoded in base64
    echo   2. You have access to Azure Artifacts feed
    echo   3. Network connection is stable
    echo.
)

pause
