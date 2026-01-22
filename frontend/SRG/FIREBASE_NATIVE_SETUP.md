# 🔥 Firebase Native SDK Setup Guide

## ✅ Migration Complete - Code Updated

All code has been migrated to use `@react-native-firebase` native SDK. Now you need to complete the native setup.

---

## 📋 Required Steps

### Step 1: Get GoogleService-Info.plist

**Option A: Download from Firebase Console (Recommended - Most Accurate)**

1. **Go to Firebase Console:**
   - Visit [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select your project: `skyscansgames` (or create one if needed)

2. **Add iOS App (if not already added):**
   - Click "Add app" → iOS icon (🍎)
   - Bundle ID: `org.name.SRGReactNativeExpo` (from your app.json)
   - App nickname: `SRG iOS`
   - Click "Register app"

3. **Download GoogleService-Info.plist:**
   - Click "Download GoogleService-Info.plist"
   - Save the file to: `frontend/SRG/ios/SRG/GoogleService-Info.plist`

**Option B: Generate from .env file (If you have Firebase config)**

```bash
cd frontend/SRG
./scripts/create-google-service-info.sh
```

This script will read your `.env` file and generate the plist automatically.

---

### Step 2: Add GoogleService-Info.plist to iOS Project

**Option A: Using Xcode (Recommended)**
1. Open `frontend/SRG/ios/SRG.xcworkspace` in Xcode
2. Right-click on the `SRG` folder in Project Navigator
3. Select "Add Files to SRG..."
4. Select the downloaded `GoogleService-Info.plist`
5. ✅ Check "Copy items if needed"
6. ✅ Ensure "SRG" target is selected
7. Click "Add"

**Option B: Manual Copy**
```bash
# Copy the file to the iOS project
cp ~/Downloads/GoogleService-Info.plist frontend/SRG/ios/SRG/
```

Then add it to Xcode project manually.

---

### Step 3: Verify File Location

The file should be at:
```
frontend/SRG/ios/SRG/GoogleService-Info.plist
```

And it should be:
- ✅ Added to the Xcode project
- ✅ Included in the "SRG" target
- ✅ Visible in Project Navigator

---

### Step 4: Remove Web SDK Package

```bash
cd frontend/SRG
npm uninstall firebase
npm install
```

This will:
- Remove the `firebase` web SDK package
- Clean up dependencies
- Keep only `@react-native-firebase` packages

---

### Step 5: Rebuild iOS Project

```bash
cd frontend/SRG
rm -rf ios/Pods ios/Podfile.lock ios/build
npx expo prebuild --platform ios --clean
cd ios && pod install
```

---

### Step 6: Test Build

```bash
cd frontend/SRG
npx expo run:ios
```

---

## ✅ Verification Checklist

- [ ] `GoogleService-Info.plist` downloaded from Firebase Console
- [ ] File added to `ios/SRG/` directory
- [ ] File added to Xcode project and target
- [ ] `firebase` package removed from `package.json`
- [ ] `npm install` completed
- [ ] Pods reinstalled
- [ ] Build succeeds

---

## 🚨 Important Notes

1. **GoogleService-Info.plist is REQUIRED**
   - Without it, Firebase won't initialize
   - App will crash or auth will fail
   - Must be added to Xcode project (not just copied)

2. **Native SDK Auto-Initializes**
   - No manual config needed in code
   - Firebase reads from `GoogleService-Info.plist` automatically
   - `FirebaseApp.configure()` in AppDelegate is sufficient

3. **Environment Variables**
   - You can remove Firebase env vars from `.env` (not needed for native SDK)
   - Native SDK uses `GoogleService-Info.plist` instead

---

## 🔍 Troubleshooting

### "Firebase not initialized" error
- ✅ Check `GoogleService-Info.plist` is in Xcode project
- ✅ Verify file is added to "SRG" target
- ✅ Check `FirebaseApp.configure()` is in AppDelegate

### Build errors
- ✅ Run `pod install` after adding plist
- ✅ Clean build folder: `rm -rf ios/build`
- ✅ Rebuild: `npx expo run:ios`

### Auth not working
- ✅ Verify Email/Password auth is enabled in Firebase Console
- ✅ Check Firebase project matches the plist file
- ✅ Verify bundle ID matches Firebase app configuration

---

## 📝 Next Steps After Setup

1. **Test Authentication:**
   - Sign up with email/password
   - Sign in
   - Sign out
   - Verify persistence (close app, reopen)

2. **Verify Supabase Sync:**
   - Check that users are synced to Supabase
   - Verify `firebase_uid` is stored correctly

3. **Test Build:**
   - Local build: `npx expo run:ios`
   - EAS build: `eas build --platform ios --profile production`

---

**Status:** ⚠️ **Action Required** - Download and add `GoogleService-Info.plist` to complete setup.
