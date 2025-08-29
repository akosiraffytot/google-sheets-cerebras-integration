#!/bin/bash

# Vercel Environment Variables Setup Script

set -e

echo "🔧 Setting up Vercel environment variables..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it based on .env.example"
    exit 1
fi

echo "📝 Adding environment variables to Vercel..."

# Read environment variables from .env.local and add them to Vercel
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^#.*$ ]] || [[ -z $key ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    
    echo "Adding $key..."
    vercel env add "$key" production <<< "$value"
    vercel env add "$key" preview <<< "$value"
    vercel env add "$key" development <<< "$value"
done < .env.local

echo "✅ Environment variables setup completed!"
echo "📋 You can verify the variables in your Vercel dashboard"