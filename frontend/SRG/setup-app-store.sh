#!/bin/bash

# App Store Deployment Setup Script
# This script helps you set up environment variables for App Store deployment

set -e

echo "🚀 App Store Deployment Setup"
echo "=============================="
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed."
    echo "   Install it with: npm install -g eas-cli"
    exit 1
fi

echo "✅ EAS CLI is installed"
echo ""

# Check if logged in
echo "Checking Expo login status..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged into Expo."
    echo "   Please run: eas login"
    exit 1
fi

echo "✅ Logged into Expo"
echo ""

# Function to set secret
set_secret() {
    local name=$1
    local description=$2
    
    echo ""
    echo "Setting: $name"
    echo "Description: $description"
    read -p "Enter value (or press Enter to skip): " value
    
    if [ -n "$value" ]; then
        eas secret:create --scope project --name "$name" --value "$value" --force
        echo "✅ Set $name"
    else
        echo "⏭️  Skipped $name"
    fi
}

echo "📝 Setting up environment variables for production"
echo "   (You can skip any by pressing Enter)"
echo ""

# Backend URL
set_secret "EXPO_PUBLIC_BACKEND_URL" "Production backend API URL (e.g., https://api.yourdomain.com)"

# Supabase
set_secret "EXPO_PUBLIC_SUPABASE_URL" "Supabase project URL"
set_secret "EXPO_PUBLIC_SUPABASE_ANON_KEY" "Supabase anonymous key"

# Firebase
set_secret "EXPO_PUBLIC_FIREBASE_API_KEY" "Firebase API Key"
set_secret "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" "Firebase Auth Domain (e.g., your-project.firebaseapp.com)"
set_secret "EXPO_PUBLIC_FIREBASE_PROJECT_ID" "Firebase Project ID"
set_secret "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" "Firebase Storage Bucket (e.g., your-project.appspot.com)"
set_secret "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "Firebase Messaging Sender ID"
set_secret "EXPO_PUBLIC_FIREBASE_APP_ID" "Firebase App ID"

# Google Cloud Speech (optional)
set_secret "EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY" "Google Cloud Speech-to-Text API Key (optional)"

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review your secrets: eas secret:list"
echo "   2. Update eas.json with your Apple ID, App Store Connect App ID, and Team ID"
echo "   3. Build your app: eas build --platform ios --profile production"
echo "   4. Submit to App Store: eas submit --platform ios --profile production"
echo ""
echo "📖 For detailed instructions, see: APP_STORE_DEPLOYMENT.md"
echo ""



