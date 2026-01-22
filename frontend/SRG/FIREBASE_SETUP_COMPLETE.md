# ✅ Firebase Native SDK Setup - COMPLETE!

## 🎉 Status: Ready to Build!

### ✅ Completed Steps

1. ✅ **Code Migration** - All code updated to use `@react-native-firebase` native SDK
2. ✅ **Firebase Plugins** - Added to `app.json`
3. ✅ **AppDelegate** - Updated with `FirebaseApp.configure()`
4. ✅ **GoogleService-Info.plist** - Copied to correct location
5. ✅ **Package Cleanup** - Removed `firebase` web SDK package

---

## 📁 File Locations

### ✅ Active iOS Project (USE THIS):
```
frontend/SRG/ios/SRG/
├── GoogleService-Info.plist  ✅ (Copied from root ios/)
├── AppDelegate.swift          ✅ (Has Firebase.init)
├── Info.plist                 ✅
└── ...
```

### ❌ Legacy Folders (IGNORE):
- `/ios/` - Old project structure
- `/frontend/ios/` - Stale prebuild folder

**See:** `IOS_FOLDERS_ANALYSIS.md` for full details

---

## 🔧 Final Step: Add to Xcode Project

The file is in the correct location, but it needs to be added to the Xcode project:

### Option 1: Using Xcode (Recommended)

1. **Open Xcode workspace:**
   ```bash
   cd frontend/SRG
   open ios/SRG.xcworkspace
   ```

2. **In Xcode:**
   - Right-click on the **`SRG`** folder in Project Navigator (left sidebar)
   - Select **"Add Files to SRG..."**
   - Navigate to: `ios/SRG/GoogleService-Info.plist`
   - ✅ **Check "Copy items if needed"** (even though it's already there)
   - ✅ **Ensure "SRG" target is selected** (in "Add to targets" section)
   - Click **"Add"**

3. **Verify:**
   - File should appear in Project Navigator with a blue icon
   - Should be under the `SRG` folder

### Option 2: Verify File is Visible

If the file is already visible in Xcode (sometimes it auto-detects), you're good to go!

---

## 🚀 Build and Test

After adding to Xcode:

```bash
cd frontend/SRG/ios
pod install
cd ..
npx expo run:ios
```

---

## ✅ Verification Checklist

- [x] `GoogleService-Info.plist` in `frontend/SRG/ios/SRG/`
- [x] File is valid plist (verified)
- [x] Bundle ID matches: `org.name.SRGReactNativeExpo`
- [x] Project ID: `skyscansgames`
- [ ] File added to Xcode project (do this now)
- [ ] File included in "SRG" target
- [ ] Build succeeds

---

## 🆘 Troubleshooting

### "Firebase not initialized" error
- ✅ Check `GoogleService-Info.plist` is in Xcode project
- ✅ Verify file is added to "SRG" target
- ✅ Check `FirebaseApp.configure()` is in `AppDelegate.swift`

### Build errors
- ✅ Run `pod install` after adding plist
- ✅ Clean build folder: `rm -rf ios/build`
- ✅ Rebuild: `npx expo run:ios`

### File not showing in Xcode?
- Make sure you opened `SRG.xcworkspace` (not `.xcodeproj`)
- Try removing and re-adding the file
- Check file permissions: `chmod 644 ios/SRG/GoogleService-Info.plist`

---

## 📝 Summary

**Current Status:**
- ✅ All code migrated to native SDK
- ✅ Firebase configuration file in place
- ⚠️ **Action Required:** Add file to Xcode project (5 minutes)

**Next:** Add to Xcode → Build → Test! 🚀
