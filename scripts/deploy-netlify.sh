#!/bin/bash

# Netlify Deployment Script for Google Sheets Cerebras Integration

set -e

echo "🚀 Starting Netlify deployment..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Installing..."
    npm install -g netlify-cli
fi

# Run type checking
echo "🔍 Running type checks..."
npm run type-check

# Run tests
echo "🧪 Running tests..."
npm test

# Build the project for Netlify
echo "🔨 Building project for Netlify..."
npm run build:netlify

# Deploy to Netlify
if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    echo "🌟 Deploying to production..."
    netlify deploy --prod
else
    echo "🔧 Deploying preview..."
    netlify deploy
fi

echo "✅ Deployment completed!"
echo "📋 Next steps:"
echo "   1. Set up environment variables in Netlify dashboard"
echo "   2. Test the deployed endpoints"
echo "   3. Update Google Apps Script with the new API URL"