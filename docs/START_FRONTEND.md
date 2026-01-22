# How to Start the Frontend

## Correct Directory Structure

Your frontend code is in:
- **Package.json location**: `/Users/tebstest/Documents/GitHub/SRG-ReactNative-Expo/frontend/`
- **Source code location**: `/Users/tebstest/Documents/GitHub/SRG-ReactNative-Expo/frontend/SRG/`

## Starting the App

### Step 1: Navigate to the correct directory
```bash
cd /Users/tebstest/Documents/GitHub/SRG-ReactNative-Expo/frontend
```

### Step 2: Start the Expo server
```bash
npm start
```

Or use one of these commands:
- **iOS Simulator**: `npm run ios` or press `i` after starting
- **Android Emulator**: `npm run android` or press `a` after starting  
- **Web Browser**: `npm run web` or press `w` after starting

## If You Get Errors

### Error: "Cannot find module"
- Make sure you're in the `frontend/` directory (not `frontend/SRG/`)
- Run: `npm install` to ensure all dependencies are installed

### Error: "Port 8081 already in use"
- Kill the process: `lsof -ti:8081 | xargs kill -9`
- Or use a different port: `expo start --port 8082`

### Error: Metro bundler issues
- Clear cache: `npx expo start -c`
- Reset Metro: `npx expo start --clear`

## Quick Commands

```bash
# Start from frontend directory
cd frontend
npm start

# In another terminal, start backend (if needed)
cd backend
go run ./cmd/server
```

## What I Fixed

✅ Updated theme system to show Black & Yellow theme in selector
✅ Fixed `getAvailableThemes()` to include all accessibility themes
✅ Updated theme selection to work with new format
✅ All syntax errors resolved

The app should now start successfully!
