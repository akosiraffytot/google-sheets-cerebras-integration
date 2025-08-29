#!/bin/bash

# Vercel Deployment Script for Google Sheets Cerebras Integration

set -e

echo "🚀 Starting Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Run type checking
echo "🔍 Running type checks..."
npm run type-check

# Run tests
echo "🧪 Running tests..."
npm test

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    echo "🌟 Deploying to production..."
    vercel --prod
else
    echo "🔧 Deploying preview..."
    vercel
fi

echo "✅ Deployment completed!"
echo "📋 Next steps:"
echo "   1. Set up environment variables in Vercel dashboard"
echo "   2. Test the deployed endpoints"
echo "   3. Update Google Apps Script with the new API URL"