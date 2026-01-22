#!/bin/bash

# Quick Fix Script for Network Error
# This script checks and starts the backend server if needed

echo "🔍 Checking if backend server is running..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo "✅ Backend server is already running on port 8080"
else
    echo "❌ Backend server is NOT running"
    echo ""
    echo "🚀 Starting backend server..."
    echo ""
    echo "Please open a NEW terminal window and run:"
    echo ""
    echo "  cd backend"
    echo "  go run ./cmd/server"
    echo ""
    echo "Then wait until you see:"
    echo "  Server starting on :8080"
    echo ""
    echo "After the backend is running, come back to this terminal"
    echo "and try generating recommendations again."
    echo ""
    
    read -p "Do you want to open a new terminal window now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v osascript &> /dev/null; then
            # macOS - open new terminal window
            osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/backend && go run ./cmd/server"'
            echo "✅ New terminal window opened with backend server command"
        else
            echo "⚠️  Please manually open a new terminal and run the backend server"
        fi
    fi
fi

echo ""
echo "🔍 Testing backend connection..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Backend is accessible at http://localhost:8080"
else
    echo "❌ Backend is NOT accessible at http://localhost:8080"
    echo "   Make sure the backend server is running in another terminal"
fi

echo ""
echo "📍 Your current IP address:"
CURRENT_IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | head -1 | awk '{print $2}')
echo "   $CURRENT_IP"
echo ""
echo "🌐 Testing backend from your IP..."
if curl -s http://$CURRENT_IP:8080/health > /dev/null 2>&1; then
    echo "✅ Backend is accessible at http://$CURRENT_IP:8080"
else
    echo "❌ Backend is NOT accessible at http://$CURRENT_IP:8080"
    echo "   This might mean the backend is only listening on localhost"
    echo "   Check your backend code to ensure it listens on 0.0.0.0:8080"
fi

