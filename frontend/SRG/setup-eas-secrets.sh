#!/bin/bash

# Script to set up EAS secrets from .env file
# This will set all production environment variables for EAS builds

set -e

echo "🔐 Setting up EAS Environment Variables"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Source the .env file
source .env

# Function to set secret
set_secret() {
    local name=$1
    local value=$2
    local description=$3
    
    if [ -z "$value" ]; then
        echo "⏭️  Skipping $name (no value found)"
        return
    fi
    
    echo "Setting: $name"
    echo "  Description: $description"
    eas secret:create --scope project --name "$name" --value "$value" --force --non-interactive 2>&1 | grep -v "already exists" || echo "  ✅ Set (or already exists)"
    echo ""
}

echo "📝 Setting environment variables..."
echo ""

# Backend URL - ask for production URL
echo "⚠️  IMPORTANT: Your .env has a local backend URL (http://10.0.0.4:8080)"
echo "   For production, you need a publicly accessible backend URL."
echo ""
read -p "Enter production backend URL (or press Enter to use placeholder): " PROD_BACKEND_URL

if [ -z "$PROD_BACKEND_URL" ]; then
    PROD_BACKEND_URL="https://your-production-backend.com"
    echo "⚠️  Using placeholder. You'll need to update this before building!"
fi

set_secret "EXPO_PUBLIC_BACKEND_URL" "$PROD_BACKEND_URL" "Production backend API URL"

# Supabase
set_secret "EXPO_PUBLIC_SUPABASE_URL" "$EXPO_PUBLIC_SUPABASE_URL" "Supabase project URL"
set_secret "EXPO_PUBLIC_SUPABASE_ANON_KEY" "$EXPO_PUBLIC_SUPABASE_ANON_KEY" "Supabase anonymous key"

# Firebase
set_secret "EXPO_PUBLIC_FIREBASE_API_KEY" "$EXPO_PUBLIC_FIREBASE_API_KEY" "Firebase API Key"
set_secret "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" "$EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" "Firebase Auth Domain"
set_secret "EXPO_PUBLIC_FIREBASE_PROJECT_ID" "$EXPO_PUBLIC_FIREBASE_PROJECT_ID" "Firebase Project ID"
set_secret "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" "$EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" "Firebase Storage Bucket"
set_secret "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "$EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "Firebase Messaging Sender ID"
set_secret "EXPO_PUBLIC_FIREBASE_APP_ID" "$EXPO_PUBLIC_FIREBASE_APP_ID" "Firebase App ID"

# Google Cloud Speech (optional)
if [ -n "$EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY" ]; then
    set_secret "EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY" "$EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY" "Google Cloud Speech-to-Text API Key"
fi

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify secrets: eas secret:list"
echo "   2. Build: eas build --platform ios --profile production"
echo ""



