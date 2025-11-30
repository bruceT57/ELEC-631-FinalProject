@echo off
REM Deployment Preparation Script for Namecheap Stellar (Windows)
REM This script prepares your application for deployment

echo ==================================
echo Tutoring Tool - Deployment Preparation
echo ==================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Creating .env from .env.production template...
    copy .env.production .env
    echo [OK] .env file created
    echo WARNING: IMPORTANT: Edit .env file with your actual configuration before deploying!
    echo.
)

REM Install dependencies
echo 1. Installing dependencies...
call npm run install-all
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Build production
echo 2. Building for production...
call npm run build:production
if errorlevel 1 (
    echo [ERROR] Failed to build production version
    exit /b 1
)
echo [OK] Production build complete
echo.

REM Verify build outputs
echo 3. Verifying build outputs...
if not exist "backend\dist" (
    echo [ERROR] Backend build not found (backend\dist)
    exit /b 1
)
if not exist "frontend\dist" (
    echo [ERROR] Frontend build not found (frontend\dist)
    exit /b 1
)
echo [OK] Build outputs verified
echo.

REM Create uploads directory if it doesn't exist
if not exist "backend\uploads" (
    echo 4. Creating uploads directory...
    mkdir backend\uploads
    echo [OK] Uploads directory created
) else (
    echo 4. Uploads directory already exists
)
echo.

REM Summary
echo ==================================
echo [OK] Deployment Preparation Complete!
echo ==================================
echo.
echo Next steps:
echo 1. Review and edit .env file with your configuration
echo 2. Test locally: npm run start:production
echo 3. Create a ZIP file of the entire project
echo 4. Upload ZIP to Namecheap cPanel
echo 5. Follow NAMECHEAP_DEPLOYMENT.md for deployment steps
echo.
echo Important files to include:
echo   - production-server.js
echo   - .env (with your configuration)
echo   - backend\ (including dist\)
echo   - frontend\dist\
echo   - package.json
echo.
echo See DEPLOYMENT_CHECKLIST.md for complete checklist
echo ==================================
echo.
pause
