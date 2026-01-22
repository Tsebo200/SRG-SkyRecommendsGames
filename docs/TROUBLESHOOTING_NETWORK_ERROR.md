# 🔧 Troubleshooting Network Error: ERR_NETWORK

## Understanding the Error

**Error**: `ERR_NETWORK` with `baseURL: "http://10.0.0.8:8080"`

This means your React Native app is trying to connect to your backend server at IP address `10.0.0.8` on port `8080`, but it cannot reach it.

## Step-by-Step Fix

### Step 1: Check if Backend Server is Running

First, verify if your backend server is actually running:

```bash
# Check if anything is running on port 8080
lsof -i :8080
```

**Expected Output if Backend is Running:**
```
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
go        12345 user   3u  IPv6  0x12345      0t0  TCP *:8080 (LISTEN)
```

**If Nothing Shows Up:**
Your backend server is NOT running. Go to Step 2.

**If Something Shows Up:**
Check if it's your backend or another process. If it's not your backend, kill it and restart:
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### Step 2: Start Your Backend Server

If the backend isn't running, start it:

```bash
# Navigate to backend directory
cd backend

# Start the backend server
go run ./cmd/server
```

**Expected Output:**
```
Server starting on :8080
Health endpoint: http://localhost:8080/health
```

### Step 3: Verify Backend is Accessible

Test if the backend responds locally:

```bash
# Test backend health endpoint
curl http://localhost:8080/health
```

**Expected Output:**
```json
{"status":"ok"}
```

If this works, your backend is running correctly on localhost.

### Step 4: Find Your Current IP Address

The frontend is trying to connect to `10.0.0.8`, but your current IP might be different. Find your current IP:

```bash
# Get your current IP address
ifconfig | grep "inet " | grep -v "127.0.0.1" | head -1 | awk '{print $2}'
```

**On macOS, you might see:**
```
inet 192.168.1.100
```
or
```
inet 10.0.0.15
```

### Step 5: Update the IP Address in .env File

If your IP address is different from `10.0.0.8`, update it:

**Option A: Using the update script (Recommended)**

```bash
# From the project root
./update-ip.sh
```

**Option B: Manual Update**

1. Find your `.env` file:
   ```bash
   # Check if .env exists
   ls frontend/SRG/.env
   ```

2. Open the `.env` file and update:
   ```env
   EXPO_PUBLIC_BACKEND_URL=http://YOUR_CURRENT_IP:8080
   ```
   
   Replace `YOUR_CURRENT_IP` with the IP from Step 4.

### Step 6: Verify Backend is Accessible from Your IP

Before restarting Expo, test if the backend is accessible from your network IP:

```bash
# Replace 10.0.0.8 with your current IP from Step 4
curl http://YOUR_CURRENT_IP:8080/health
```

**If this fails:**
- Your backend might only be listening on localhost
- Check the backend configuration (should listen on `0.0.0.0:8080`, not just `localhost:8080`)

### Step 7: Restart Expo Development Server

After updating the IP address, you MUST restart Expo:

```bash
# Stop current Expo server (Ctrl+C if running)

# Restart Expo
cd frontend/SRG
npm start
```

**Important:** Environment variables are loaded when Expo starts, so you must restart after changing `.env`.

### Step 8: Test the Connection

After restarting, try generating recommendations again. Check the console logs:

**Good Signs:**
```
🌐 Initial API Base URL: http://10.0.0.8:8080
✅ Initialized with working backend URL: http://10.0.0.8:8080
🌐 API Request: GET http://10.0.0.8:8080/games/recommendations
✅ API Response: 200 /games/recommendations
```

**Bad Signs:**
```
❌ API Response Error: Network Error
🔄 Network error detected, trying to find working backend...
```

## Common Issues and Solutions

### Issue 1: Backend Only Listening on localhost

**Problem:** Backend server is only accessible via `localhost`, not your network IP.

**Solution:** Check your Go backend code - make sure it listens on `0.0.0.0:8080`:
```go
// In main.go, should be:
http.ListenAndServe("0.0.0.0:8080", r)
// NOT:
http.ListenAndServe("localhost:8080", r)
```

### Issue 2: Firewall Blocking Port 8080

**Problem:** Your firewall is blocking incoming connections on port 8080.

**Solution (macOS):**
```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If enabled, allow Go/backend through firewall
# Or temporarily disable firewall for testing
```

### Issue 3: IP Address Changed (WiFi)

**Problem:** Your IP address changed because you switched networks (different WiFi, etc.)

**Solution:**
1. Run `./update-ip.sh` again
2. Restart Expo
3. Verify backend is accessible at new IP

### Issue 4: Backend Crashed

**Problem:** Backend was running but crashed.

**Solution:**
1. Check backend logs for errors
2. Restart backend server
3. Verify it's running: `lsof -i :8080`

## Quick Diagnostic Commands

Run these commands to quickly diagnose the issue:

```bash
# 1. Check if backend is running
lsof -i :8080

# 2. Test backend locally
curl http://localhost:8080/health

# 3. Get your current IP
ifconfig | grep "inet " | grep -v "127.0.0.1" | head -1 | awk '{print $2}'

# 4. Test backend from your IP (replace with your IP)
curl http://YOUR_IP:8080/health

# 5. Check .env file
cat frontend/SRG/.env | grep BACKEND_URL
```

## Still Not Working?

If none of the above works:

1. **Check Backend Logs:** Look for errors when starting the backend
2. **Check Network Connection:** Make sure your phone/simulator is on the same network
3. **Try localhost:** For iOS simulator, try `http://localhost:8080` instead of IP
4. **Check Backend Configuration:** Verify all required environment variables are set in backend `.env`

## Quick Fix Summary

1. ✅ Check backend is running: `lsof -i :8080`
2. ✅ Start backend if not: `cd backend && go run ./cmd/server`
3. ✅ Get current IP: `ifconfig | grep "inet " | grep -v "127.0.0.1"`
4. ✅ Update IP: Run `./update-ip.sh` or edit `frontend/SRG/.env`
5. ✅ Restart Expo: Stop and restart `npm start`
6. ✅ Test again: Try generating recommendations

