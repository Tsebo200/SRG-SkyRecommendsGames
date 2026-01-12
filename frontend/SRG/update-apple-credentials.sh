#!/bin/bash

# Script to update eas.json with Apple Developer credentials

echo "🍎 Apple Developer Credentials Setup"
echo "======================================"
echo ""

# Get Apple ID
read -p "Enter your Apple ID email: " APPLE_ID

# Get Team ID
echo ""
echo "To find your Team ID:"
echo "1. Go to https://developer.apple.com/account/#/membership/"
echo "2. Look for 'Team ID' (10-character string like ABC123DEFG)"
read -p "Enter your Apple Team ID: " TEAM_ID

# Get App Store Connect App ID
echo ""
echo "To find your App Store Connect App ID:"
echo "1. Go to https://appstoreconnect.apple.com"
echo "2. Create a new app (or open existing) with Bundle ID: com.creativeT.SRG"
echo "3. The App ID is a numeric ID visible in the URL or app details"
read -p "Enter your App Store Connect App ID (or press Enter to skip for now): " APP_ID

# Update eas.json
EAS_JSON_PATH="eas.json"

if [ -f "$EAS_JSON_PATH" ]; then
    # Create backup
    cp "$EAS_JSON_PATH" "${EAS_JSON_PATH}.backup"
    
    # Update the values using a temporary file
    if [ -n "$APP_ID" ]; then
        # Use jq if available, otherwise use sed
        if command -v jq &> /dev/null; then
            jq ".submit.production.ios.appleId = \"$APPLE_ID\" | .submit.production.ios.ascAppId = \"$APP_ID\" | .submit.production.ios.appleTeamId = \"$TEAM_ID\"" "$EAS_JSON_PATH" > "${EAS_JSON_PATH}.tmp" && mv "${EAS_JSON_PATH}.tmp" "$EAS_JSON_PATH"
        else
            # Fallback to sed (less reliable but works)
            sed -i '' "s/\"your-apple-id@example.com\"/\"$APPLE_ID\"/g" "$EAS_JSON_PATH"
            sed -i '' "s/\"your-app-store-connect-app-id\"/\"$APP_ID\"/g" "$EAS_JSON_PATH"
            sed -i '' "s/\"your-apple-team-id\"/\"$TEAM_ID\"/g" "$EAS_JSON_PATH"
        fi
    else
        # Update without App ID (user can add it later)
        if command -v jq &> /dev/null; then
            jq ".submit.production.ios.appleId = \"$APPLE_ID\" | .submit.production.ios.appleTeamId = \"$TEAM_ID\"" "$EAS_JSON_PATH" > "${EAS_JSON_PATH}.tmp" && mv "${EAS_JSON_PATH}.tmp" "$EAS_JSON_PATH"
        else
            sed -i '' "s/\"your-apple-id@example.com\"/\"$APPLE_ID\"/g" "$EAS_JSON_PATH"
            sed -i '' "s/\"your-apple-team-id\"/\"$TEAM_ID\"/g" "$EAS_JSON_PATH"
        fi
    fi
    
    echo ""
    echo "✅ Updated eas.json with your credentials!"
    echo "   Backup saved as: ${EAS_JSON_PATH}.backup"
    echo ""
    echo "📋 Next steps:"
    if [ -z "$APP_ID" ]; then
        echo "   1. Create app in App Store Connect: https://appstoreconnect.apple.com"
        echo "   2. Update eas.json with the App Store Connect App ID"
    fi
    echo "   3. Set up environment variables: ./setup-app-store.sh"
    echo "   4. Build: eas build --platform ios --profile production"
else
    echo "❌ eas.json not found!"
    exit 1
fi



