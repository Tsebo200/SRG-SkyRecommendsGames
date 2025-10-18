#!/bin/bash

# Stop Frontend (Expo) Server
# This script stops the Expo development server

echo "🛑 Stopping Frontend (Expo) Server..."
echo "====================================="

# Kill Expo processes
echo "🔍 Looking for Expo processes..."
EXPO_PIDS=$(pgrep -f "expo start" || true)

if [ -n "$EXPO_PIDS" ]; then
    echo "📱 Found Expo processes: $EXPO_PIDS"
    echo "🔄 Stopping Expo processes..."
    
    # Kill Expo processes
    pkill -f "expo start" || true
    sleep 2
    
    # Check if processes are still running
    REMAINING_PIDS=$(pgrep -f "expo start" || true)
    if [ -n "$REMAINING_PIDS" ]; then
        echo "⚠️ Some processes still running, force killing..."
        pkill -9 -f "expo start" || true
    fi
    
    echo "✅ Expo processes stopped"
else
    echo "ℹ️ No Expo processes found"
fi

# Kill Node processes on common Expo ports
echo "🔍 Checking for processes on Expo ports..."
for port in 8081 8082 8083; do
    PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo "🔄 Stopping process on port $port (PID: $PID)..."
        kill $PID 2>/dev/null || true
    fi
done

# Kill any remaining Metro bundler processes
echo "🔍 Looking for Metro bundler processes..."
METRO_PIDS=$(pgrep -f "metro" || true)
if [ -n "$METRO_PIDS" ]; then
    echo "🔄 Stopping Metro bundler processes..."
    pkill -f "metro" || true
fi

# Kill any React Native processes
echo "🔍 Looking for React Native processes..."
RN_PIDS=$(pgrep -f "react-native" || true)
if [ -n "$RN_PIDS" ]; then
    echo "🔄 Stopping React Native processes..."
    pkill -f "react-native" || true
fi

echo ""
echo "✅ Frontend (Expo) Server stopped successfully!"
echo "📱 You can now start the frontend again with: npm start"
