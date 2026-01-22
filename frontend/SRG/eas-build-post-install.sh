#!/bin/bash
set -e

echo "🔧 EAS Build Post-Install Hook: Ensuring GoogleService-Info.plist exists"

# Check if GoogleService-Info.plist exists in root (for prebuild)
if [ -f "./GoogleService-Info.plist" ]; then
  echo "✅ GoogleService-Info.plist exists in root"
  
  # Also ensure it's in the iOS project directory after prebuild
  if [ -d "ios" ]; then
    mkdir -p ios/SRG
    cp ./GoogleService-Info.plist ios/SRG/GoogleService-Info.plist 2>/dev/null || true
    echo "✅ Copied to ios/SRG/ for native build"
  fi
  exit 0
fi

# Fallback: Create from environment variable if available
if [ -n "$GOOGLE_SERVICES_FILE" ]; then
  echo "📝 Creating GoogleService-Info.plist from EAS secret"
  echo "$GOOGLE_SERVICES_FILE" > ./GoogleService-Info.plist
  echo "✅ GoogleService-Info.plist created from secret"
  
  # Copy to iOS directory if it exists
  if [ -d "ios" ]; then
    mkdir -p ios/SRG
    cp ./GoogleService-Info.plist ios/SRG/GoogleService-Info.plist
  fi
else
  echo "⚠️  Warning: GoogleService-Info.plist not found and GOOGLE_SERVICES_FILE not set"
  echo "   Build may fail if Firebase is required"
fi
