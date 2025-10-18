#!/bin/bash

echo "🔍 SRG Project Port Status Check"
echo "================================="
echo

# Check Backend (Port 8080)
echo "📡 Backend (Port 8080):"
if lsof -i :8080 > /dev/null 2>&1; then
    echo "✅ Running on http://localhost:8080"
    # Test health endpoint
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Health check: OK"
    else
        echo "❌ Health check: FAILED"
    fi
else
    echo "❌ Not running"
fi
echo

# Check Frontend (Port 8081)
echo "📱 Frontend (Port 8081):"
if lsof -i :8081 > /dev/null 2>&1; then
    echo "✅ Running on http://localhost:8081"
else
    echo "❌ Not running"
fi
echo

# Check Database (Port 54322)
echo "🗄️  Database (Port 54322):"
if lsof -i :54322 > /dev/null 2>&1; then
    echo "✅ Supabase running on postgresql://postgres:postgres@127.0.0.1:54322/postgres"
else
    echo "❌ Not running"
fi
echo

# Summary
echo "📊 Summary:"
backend_status=$(lsof -i :8080 > /dev/null 2>&1 && echo "✅" || echo "❌")
frontend_status=$(lsof -i :8081 > /dev/null 2>&1 && echo "✅" || echo "❌")
database_status=$(lsof -i :54322 > /dev/null 2>&1 && echo "✅" || echo "❌")

echo "Backend (8080):  $backend_status"
echo "Frontend (8081): $frontend_status"
echo "Database (54322): $database_status"
echo

if [ "$backend_status" = "✅" ] && [ "$frontend_status" = "✅" ] && [ "$database_status" = "✅" ]; then
    echo "🎉 All services are running!"
else
    echo "⚠️  Some services are not running. Check the status above."
fi
