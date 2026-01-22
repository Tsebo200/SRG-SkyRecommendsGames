#!/bin/bash

# Script to update the IP address in the .env file
# This fixes the axios timeout error by using the correct network IP

echo "🔧 Updating IP address in .env file..."

# Get the current IP address
CURRENT_IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | head -1 | awk '{print $2}')

echo "📍 Current IP address: $CURRENT_IP"

# Update the .env file
if [ -f "frontend/SRG/.env" ]; then
    # Backup the original file
    cp frontend/SRG/.env frontend/SRG/.env.backup
    
    # Update the IP address
    sed -i '' "s/EXPO_PUBLIC_BACKEND_URL=.*/EXPO_PUBLIC_BACKEND_URL=http:\/\/$CURRENT_IP:8080/" frontend/SRG/.env
    
    echo "✅ Updated .env file with new IP: $CURRENT_IP"
    echo "📋 New backend URL: http://$CURRENT_IP:8080"
    echo "💾 Backup saved as: frontend/SRG/.env.backup"
else
    echo "❌ .env file not found at frontend/SRG/.env"
    exit 1
fi

echo ""
echo "🔄 Please restart your Expo development server for changes to take effect:"
echo "   cd frontend/SRG && npm start"


