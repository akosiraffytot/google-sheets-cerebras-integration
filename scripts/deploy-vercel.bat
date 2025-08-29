@echo off
REM Vercel Deployment Script for Google Sheets Cerebras Integration

echo 🚀 Starting Vercel deployment...

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI is not installed. Installing...
    npm install -g vercel
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

REM Build the project
echo 🔨 Building project...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

REM Deploy to Vercel
if "%1"=="production" (
    echo 🌟 Deploying to production...
    vercel --prod
) else if "%1"=="prod" (
    echo 🌟 Deploying to production...
    vercel --prod
) else (
    echo 🔧 Deploying preview...
    vercel
)

echo ✅ Deployment completed!
echo 📋 Next steps:
echo    1. Set up environment variables in Vercel dashboard
echo    2. Test the deployed endpoints
echo    3. Update Google Apps Script with the new API URL