#!/bin/bash

# Script to automatically update the backend IP address in .env file
# This prevents Axios network errors when your IP address changes

echo "🔍 Detecting current IP address..."

# Get the current IP address (excluding localhost)
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$CURRENT_IP" ]; then
    echo "❌ Could not detect IP address"
    exit 1
fi

echo "📍 Current IP: $CURRENT_IP"

# Update the .env file
if [ -f ".env" ]; then
    # Backup the current .env file
    cp .env .env.backup
    
    # Update the IP address in .env
    sed -i '' "s/EXPO_PUBLIC_BACKEND_URL=http:\/\/[0-9.]*:8080/EXPO_PUBLIC_BACKEND_URL=http:\/\/$CURRENT_IP:8080/" .env
    
    echo "✅ Updated .env file with new IP: $CURRENT_IP"
    echo "📁 Backup saved as .env.backup"
    
    # Test the connection
    echo "🔍 Testing backend connection..."
    if curl -s "http://$CURRENT_IP:8080/health" > /dev/null; then
        echo "✅ Backend is accessible at http://$CURRENT_IP:8080"
    else
        echo "⚠️  Backend may not be running at http://$CURRENT_IP:8080"
        echo "💡 Make sure your backend server is running"
    fi
else
    echo "❌ .env file not found"
    exit 1
fi

echo "🎉 IP update complete!"

