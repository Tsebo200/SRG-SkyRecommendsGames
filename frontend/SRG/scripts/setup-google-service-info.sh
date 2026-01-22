#!/bin/bash

# Script to automatically detect and setup GoogleService-Info.plist
# This will check Downloads folder and move/setup the file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios/SRG"
TARGET_FILE="$IOS_DIR/GoogleService-Info.plist"
DOWNLOADS_DIR="$HOME/Downloads"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔥 GoogleService-Info.plist Setup Helper${NC}"
echo ""

# Check if file already exists in target location
if [ -f "$TARGET_FILE" ]; then
    echo -e "${GREEN}✅ GoogleService-Info.plist already exists at:${NC}"
    echo "   $TARGET_FILE"
    echo ""
    read -p "Do you want to replace it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Keeping existing file.${NC}"
        exit 0
    fi
    rm "$TARGET_FILE"
fi

# Look for downloaded file
echo -e "${YELLOW}🔍 Searching for GoogleService-Info.plist in Downloads...${NC}"
DOWNLOADED_FILE=$(find "$DOWNLOADS_DIR" -name "GoogleService-Info.plist" -type f -mtime -1 2>/dev/null | head -1)

if [ -z "$DOWNLOADED_FILE" ]; then
    echo -e "${RED}❌ GoogleService-Info.plist not found in Downloads folder${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Go to: https://console.firebase.google.com"
    echo "2. Select project: skyscansgames"
    echo "3. Add iOS app (if needed) with Bundle ID: org.name.SRGReactNativeExpo"
    echo "4. Download GoogleService-Info.plist"
    echo "5. Run this script again: ./scripts/setup-google-service-info.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Found: $DOWNLOADED_FILE${NC}"
echo ""

# Verify it's a valid plist
if ! plutil -lint "$DOWNLOADED_FILE" > /dev/null 2>&1; then
    echo -e "${RED}❌ Invalid plist file!${NC}"
    exit 1
fi

# Check bundle ID matches
BUNDLE_ID=$(plutil -extract BUNDLE_ID raw "$DOWNLOADED_FILE" 2>/dev/null || echo "")
EXPECTED_BUNDLE_ID="org.name.SRGReactNativeExpo"

if [ -n "$BUNDLE_ID" ] && [ "$BUNDLE_ID" != "$EXPECTED_BUNDLE_ID" ]; then
    echo -e "${YELLOW}⚠️  Warning: Bundle ID mismatch${NC}"
    echo "   Found: $BUNDLE_ID"
    echo "   Expected: $EXPECTED_BUNDLE_ID"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Copy file to target location
echo -e "${BLUE}📦 Copying file to iOS project...${NC}"
mkdir -p "$IOS_DIR"
cp "$DOWNLOADED_FILE" "$TARGET_FILE"
echo -e "${GREEN}✅ Copied to: $TARGET_FILE${NC}"
echo ""

# Verify file
echo -e "${BLUE}🔍 Verifying file contents...${NC}"
PROJECT_ID=$(plutil -extract PROJECT_ID raw "$TARGET_FILE" 2>/dev/null || echo "N/A")
API_KEY=$(plutil -extract API_KEY raw "$TARGET_FILE" 2>/dev/null | head -c 20 || echo "N/A")
echo "   Project ID: $PROJECT_ID"
echo "   API Key: ${API_KEY}..."
echo ""

# Check if Xcode workspace exists
WORKSPACE="$PROJECT_ROOT/ios/SRG.xcworkspace"
if [ -d "$WORKSPACE" ]; then
    echo -e "${GREEN}✅ Xcode workspace found${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next: Add file to Xcode project${NC}"
    echo "1. Open: $WORKSPACE"
    echo "2. Right-click 'SRG' folder → 'Add Files to SRG...'"
    echo "3. Select: $TARGET_FILE"
    echo "4. ✅ Check 'Copy items if needed'"
    echo "5. ✅ Ensure 'SRG' target is selected"
    echo "6. Click 'Add'"
    echo ""
    read -p "Open Xcode workspace now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$WORKSPACE"
    fi
else
    echo -e "${YELLOW}⚠️  Xcode workspace not found. Run 'npx expo prebuild' first.${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps after adding to Xcode:${NC}"
echo "1. cd frontend/SRG/ios"
echo "2. pod install"
echo "3. cd .."
echo "4. npx expo run:ios"
