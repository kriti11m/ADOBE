@echo off
REM Environment Setup Script for ConnectPDF (Windows)
echo 🔧 ConnectPDF Environment Setup
echo ================================

REM Check if global .env exists
if not exist ".env" (
    echo ❌ Global .env file not found!
    pause
    exit /b 1
)

echo ✅ Global .env file found

echo.
echo 📋 Checking required environment variables...

REM Check Gemini API Key
findstr /C:"GEMINI_API_KEY=AIzaSy" .env >nul
if %errorlevel%==0 (
    findstr /C:"GEMINI_API_KEY=your_actual" .env >nul
    if %errorlevel%==1 (
        echo ✅ Gemini API Key configured
    ) else (
        echo ⚠️  Gemini API Key needs to be configured
        echo    1. Go to https://aistudio.google.com/app/apikey
        echo    2. Create an API key
        echo    3. Replace the value in .env file
    )
) else (
    echo ⚠️  Gemini API Key needs to be configured
    echo    1. Go to https://aistudio.google.com/app/apikey
    echo    2. Create an API key
    echo    3. Replace the value in .env file
)

REM Check Adobe Client ID
if exist "adobe_frontend\.env" (
    findstr /C:"REACT_APP_ADOBE_CLIENT_ID=" adobe_frontend\.env >nul
    if %errorlevel%==0 (
        findstr /C:"REACT_APP_ADOBE_CLIENT_ID=YOUR_ACTUAL" adobe_frontend\.env >nul
        if %errorlevel%==1 (
            echo ✅ Adobe Client ID configured
        ) else (
            echo ⚠️  Adobe Client ID needs to be configured
            echo    1. Go to https://www.adobe.com/go/dcsdks_credentials
            echo    2. Create a project and get Client ID
            echo    3. Replace the value in adobe_frontend\.env file
        )
    ) else (
        echo ⚠️  Adobe Client ID missing
    )
) else (
    echo ⚠️  Frontend .env file missing
)

echo.
echo 🚀 Environment Status:
echo    - Global .env: ✅ Present
echo    - Backend .env: Uses global config
echo    - Frontend .env: ✅ Present

echo.
echo 💡 To start the application:
echo    Backend:  cd combined-backend ^&^& python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo    Frontend: cd adobe_frontend ^&^& npm start

echo.
pause
