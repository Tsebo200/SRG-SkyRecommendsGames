#!/bin/bash

echo "🚀 Starting SRG Frontend on Port 8081"
echo "====================================="

# Check if port 8081 is already in use
if lsof -i :8081 > /dev/null 2>&1; then
    echo "❌ Port 8081 is already in use!"
    echo "📋 Current processes on port 8081:"
    lsof -i :8081
    echo ""
    echo "🔧 Please kill the process manually:"
    echo "   lsof -ti:8081 | xargs kill -9"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Port 8081 is available"
echo "🎯 Starting Expo on port 8081..."

# Start Expo with fixed port
npx expo start --port 8081

echo "📱 Frontend should be running on http://localhost:8081"
