#!/bin/bash

# Netlify Environment Variables Setup Script

set -e

echo "🔧 Setting up Netlify environment variables..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Please install it first:"
    echo "   npm install -g netlify-cli"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it based on .env.example"
    exit 1
fi

echo "📝 Adding environment variables to Netlify..."

# Read environment variables from .env.local and add them to Netlify
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^#.*$ ]] || [[ -z $key ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    
    echo "Adding $key..."
    netlify env:set "$key" "$value"
done < .env.local

echo "✅ Environment variables setup completed!"
echo "📋 You can verify the variables in your Netlify dashboard"