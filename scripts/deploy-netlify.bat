@echo off
REM Netlify Deployment Script for Google Sheets Cerebras Integration

echo 🚀 Starting Netlify deployment...

REM Check if Netlify CLI is installed
where netlify >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Netlify CLI is not installed. Installing...
    npm install -g netlify-cli
)

REM Run type checking
echo 🔍 Running type checks...
npm run type-check
if %errorlevel% neq 0 (
    echo ❌ Type check failed
    exit /b 1
)

REM Run tests
echo 🧪 Running tests...
npm test
if %errorlevel% neq 0 (
    echo ❌ Tests failed
    exit /b 1
)

REM Build the project for Netlify
echo 🔨 Building project for Netlify...
npm run build:netlify
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

REM Deploy to Netlify
if "%1"=="production" (
    echo 🌟 Deploying to production...
    netlify deploy --prod
) else if "%1"=="prod" (
    echo 🌟 Deploying to production...
    netlify deploy --prod
) else (
    echo 🔧 Deploying preview...
    netlify deploy
)

echo ✅ Deployment completed!
echo 📋 Next steps:
echo    1. Set up environment variables in Netlify dashboard
echo    2. Test the deployed endpoints
echo    3. Update Google Apps Script with the new API URL