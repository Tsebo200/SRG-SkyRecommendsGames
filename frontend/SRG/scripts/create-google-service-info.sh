#!/bin/bash

# Script to create GoogleService-Info.plist from Firebase config
# Usage: ./scripts/create-google-service-info.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios/SRG"
TEMPLATE="$IOS_DIR/GoogleService-Info.plist.template"
OUTPUT="$IOS_DIR/GoogleService-Info.plist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔥 Creating GoogleService-Info.plist${NC}"
echo ""

# Check if template exists
if [ ! -f "$TEMPLATE" ]; then
    echo -e "${RED}❌ Template file not found: $TEMPLATE${NC}"
    exit 1
fi

# Check for .env file
ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env file not found.${NC}"
    echo -e "${YELLOW}Please provide Firebase configuration values:${NC}"
    echo ""
    read -p "Firebase API Key: " API_KEY
    read -p "Firebase Project ID: " PROJECT_ID
    read -p "Firebase Storage Bucket: " STORAGE_BUCKET
    read -p "Firebase Messaging Sender ID: " SENDER_ID
    read -p "Firebase App ID: " APP_ID
else
    echo -e "${GREEN}✅ Found .env file${NC}"
    # Source .env file (basic parsing)
    export $(grep -v '^#' "$ENV_FILE" | grep EXPO_PUBLIC_FIREBASE | xargs)
    
    API_KEY="${EXPO_PUBLIC_FIREBASE_API_KEY}"
    PROJECT_ID="${EXPO_PUBLIC_FIREBASE_PROJECT_ID}"
    STORAGE_BUCKET="${EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}"
    SENDER_ID="${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"
    APP_ID="${EXPO_PUBLIC_FIREBASE_APP_ID}"
fi

# Validate required values
if [ -z "$API_KEY" ] || [ -z "$PROJECT_ID" ] || [ -z "$STORAGE_BUCKET" ] || [ -z "$SENDER_ID" ] || [ -z "$APP_ID" ]; then
    echo -e "${RED}❌ Missing required Firebase configuration values${NC}"
    echo "Required: API_KEY, PROJECT_ID, STORAGE_BUCKET, SENDER_ID, APP_ID"
    exit 1
fi

# Create the plist file
echo -e "${GREEN}✅ Generating GoogleService-Info.plist...${NC}"
cp "$TEMPLATE" "$OUTPUT"

# Replace placeholders (macOS/BSD sed)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/YOUR_API_KEY_HERE/$API_KEY/g" "$OUTPUT"
    sed -i '' "s/YOUR_PROJECT_ID_HERE/$PROJECT_ID/g" "$OUTPUT"
    sed -i '' "s/YOUR_STORAGE_BUCKET_HERE/$STORAGE_BUCKET/g" "$OUTPUT"
    sed -i '' "s/YOUR_MESSAGING_SENDER_ID_HERE/$SENDER_ID/g" "$OUTPUT"
    sed -i '' "s/YOUR_APP_ID_HERE/$APP_ID/g" "$OUTPUT"
else
    sed -i "s/YOUR_API_KEY_HERE/$API_KEY/g" "$OUTPUT"
    sed -i "s/YOUR_PROJECT_ID_HERE/$PROJECT_ID/g" "$OUTPUT"
    sed -i "s/YOUR_STORAGE_BUCKET_HERE/$STORAGE_BUCKET/g" "$OUTPUT"
    sed -i "s/YOUR_MESSAGING_SENDER_ID_HERE/$SENDER_ID/g" "$OUTPUT"
    sed -i "s/YOUR_APP_ID_HERE/$APP_ID/g" "$OUTPUT"
fi

echo -e "${GREEN}✅ Created: $OUTPUT${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: You still need to add this file to Xcode:${NC}"
echo "1. Open frontend/SRG/ios/SRG.xcworkspace in Xcode"
echo "2. Right-click on 'SRG' folder → 'Add Files to SRG...'"
echo "3. Select GoogleService-Info.plist"
echo "4. ✅ Check 'Copy items if needed'"
echo "5. ✅ Ensure 'SRG' target is selected"
echo "6. Click 'Add'"
echo ""
echo -e "${GREEN}Then run: cd ios && pod install${NC}"
