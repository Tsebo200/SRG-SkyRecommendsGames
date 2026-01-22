# 🚀 Quick Firebase Setup - Download GoogleService-Info.plist

## Step-by-Step Instructions

### 1. Go to Firebase Console
- Open: https://console.firebase.google.com
- Sign in with your Google account

### 2. Select Your Project
- Click on project: **`skyscansgames`**
- (Or create a new project if it doesn't exist)

### 3. Add iOS App (if not already added)
- Click the **iOS icon** (🍎) or "Add app" → iOS
- **Bundle ID**: `org.name.SRGReactNativeExpo`
- **App nickname**: `SRG iOS`
- Click **"Register app"**

### 4. Download GoogleService-Info.plist
- Click **"Download GoogleService-Info.plist"** button
- The file will download to your Downloads folder

### 5. Move File to Project
```bash
# Move the downloaded file to the iOS project
mv ~/Downloads/GoogleService-Info.plist frontend/SRG/ios/SRG/
```

### 6. Add to Xcode Project
```bash
# Open the workspace in Xcode
open frontend/SRG/ios/SRG.xcworkspace
```

**In Xcode:**
1. Right-click on the **`SRG`** folder in Project Navigator (left sidebar)
2. Select **"Add Files to SRG..."**
3. Navigate to and select: `frontend/SRG/ios/SRG/GoogleService-Info.plist`
4. ✅ **Check "Copy items if needed"**
5. ✅ **Ensure "SRG" target is selected** (in "Add to targets" section)
6. Click **"Add"**

### 7. Verify File is Added
- The file should appear in Xcode Project Navigator under `SRG` folder
- It should have a blue icon (not red/gray)

### 8. Install Pods and Rebuild
```bash
cd frontend/SRG/ios
pod install
cd ..
npx expo prebuild --platform ios --clean
```

### 9. Test Build
```bash
npx expo run:ios
```

---

## ✅ Verification Checklist

- [ ] Downloaded `GoogleService-Info.plist` from Firebase Console
- [ ] File is in `frontend/SRG/ios/SRG/` directory
- [ ] File is added to Xcode project (visible in Project Navigator)
- [ ] File is included in "SRG" target
- [ ] Ran `pod install`
- [ ] Build succeeds

---

## 🆘 Troubleshooting

**File not showing in Xcode?**
- Make sure you opened `SRG.xcworkspace` (not `.xcodeproj`)
- Try removing and re-adding the file

**Build errors?**
- Clean build folder: `rm -rf ios/build`
- Reinstall pods: `cd ios && pod install`
- Rebuild: `npx expo run:ios`

**Firebase not initializing?**
- Check `GoogleService-Info.plist` is in Xcode project
- Verify bundle ID matches: `org.name.SRGReactNativeExpo`
- Check `FirebaseApp.configure()` is in `AppDelegate.swift`
