#!/bin/bash
set -e

echo "🔧 EAS Build Pre-Install Hook: Setting up GoogleService-Info.plist"

# Create the iOS directory structure if it doesn't exist
mkdir -p ios/SRG

# Check if GoogleService-Info.plist already exists (for local builds or if already created)
if [ -f "ios/SRG/GoogleService-Info.plist" ]; then
  echo "✅ GoogleService-Info.plist already exists"
  exit 0
fi

# For EAS Build, create it from environment variable
# The file content is stored as GOOGLE_SERVICES_FILE secret
if [ -n "$GOOGLE_SERVICES_FILE" ]; then
  echo "📝 Creating GoogleService-Info.plist from EAS secret"
  echo "$GOOGLE_SERVICES_FILE" > ios/SRG/GoogleService-Info.plist
  echo "✅ GoogleService-Info.plist created successfully"
  ls -lh ios/SRG/GoogleService-Info.plist
else
  echo "❌ Error: GOOGLE_SERVICES_FILE environment variable not set"
  echo "   Please ensure the secret is configured in EAS"
  exit 1
fi
