#!/bin/bash

# TestFlight Deployment Script
# This script helps you deploy your app to TestFlight

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TestFlight Deployment Script${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/SRG/eas.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

cd frontend/SRG

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}⚠️  EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
fi

# Check if logged in to Expo
echo -e "${BLUE}📋 Checking Expo login status...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Expo. Please login:${NC}"
    eas login
else
    USER=$(eas whoami 2>/dev/null | head -1)
    echo -e "${GREEN}✅ Logged in as: $USER${NC}"
fi

echo ""
echo -e "${BLUE}📱 Current Configuration:${NC}"
echo "  Bundle ID: org.name.SRGReactNativeExpo"
echo "  Apple ID: tbonziser@gmail.com"
echo "  App Store Connect App ID: 6757149381"
echo "  Apple Team ID: G4XVP29J8P"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with TestFlight deployment? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

# Check if production backend URL is set
echo ""
echo -e "${BLUE}🌐 Checking environment variables...${NC}"
if eas secret:list 2>/dev/null | grep -q "EXPO_PUBLIC_BACKEND_URL"; then
    BACKEND_URL=$(eas secret:list 2>/dev/null | grep "EXPO_PUBLIC_BACKEND_URL" | awk '{print $NF}')
    echo -e "${GREEN}✅ Production backend URL set: $BACKEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  No production backend URL set.${NC}"
    echo -e "${YELLOW}   The app will use localhost or hardcoded URL.${NC}"
    read -p "Do you want to set a production backend URL now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your production backend URL (e.g., https://your-app.railway.app): " BACKEND_URL
        if [ ! -z "$BACKEND_URL" ]; then
            eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "$BACKEND_URL"
            echo -e "${GREEN}✅ Backend URL set!${NC}"
        fi
    fi
fi

echo ""
echo -e "${BLUE}🔨 Starting build process...${NC}"
echo -e "${YELLOW}   This will take 10-20 minutes.${NC}"
echo ""

# Ask if they want to auto-submit
read -p "Auto-submit to TestFlight after build completes? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    AUTO_SUBMIT="--auto-submit"
    echo -e "${GREEN}✅ Will auto-submit after build${NC}"
else
    AUTO_SUBMIT=""
    echo -e "${YELLOW}⚠️  You'll need to submit manually after build completes${NC}"
    echo -e "${YELLOW}   Run: eas submit --platform ios --profile production${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Starting build...${NC}"
echo ""

# Build the app
if [ -z "$AUTO_SUBMIT" ]; then
    eas build --platform ios --profile production
else
    eas build --platform ios --profile production --auto-submit
fi

echo ""
echo -e "${GREEN}✅ Build process initiated!${NC}"
echo ""
echo -e "${BLUE}📊 Monitor your build at:${NC}"
echo -e "   https://expo.dev/accounts/glitchedsky/projects/SRG/builds"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
if [ -z "$AUTO_SUBMIT" ]; then
    echo "   1. Wait for build to complete (10-20 minutes)"
    echo "   2. Run: eas submit --platform ios --profile production"
    echo "   3. Go to App Store Connect → TestFlight"
    echo "   4. Add testers and distribute"
else
    echo "   1. Wait for build to complete (10-20 minutes)"
    echo "   2. Wait for Apple to process (10-30 minutes)"
    echo "   3. Go to App Store Connect → TestFlight"
    echo "   4. Add testers and distribute"
fi
echo ""
echo -e "${GREEN}🎉 Good luck!${NC}"
