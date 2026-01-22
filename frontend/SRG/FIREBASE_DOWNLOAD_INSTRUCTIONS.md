# 🔥 Download GoogleService-Info.plist - Step by Step

## Quick Steps

### 1. Open Firebase Console
👉 **Click here or copy:** https://console.firebase.google.com/project/skyscansgames/settings/general

### 2. Add iOS App (if not already added)
- Scroll down to "Your apps" section
- Click the **iOS icon** (🍎) or "Add app" → iOS
- **Bundle ID**: `org.name.SRGReactNativeExpo`
- **App nickname**: `SRG iOS` (optional)
- Click **"Register app"**

### 3. Download the File
- You'll see a page with "Download GoogleService-Info.plist" button
- Click **"Download GoogleService-Info.plist"**
- The file will download to your `~/Downloads` folder

### 4. Run Setup Script
Once downloaded, run this command:

```bash
cd frontend/SRG
./scripts/setup-google-service-info.sh
```

The script will:
- ✅ Find the downloaded file
- ✅ Verify it's valid
- ✅ Copy it to the correct location
- ✅ Help you add it to Xcode

### 5. Add to Xcode (if script prompts)
- The script will offer to open Xcode
- Or manually: `open ios/SRG.xcworkspace`
- Right-click `SRG` folder → "Add Files to SRG..."
- Select `GoogleService-Info.plist`
- ✅ Check "Copy items if needed"
- ✅ Ensure "SRG" target is selected
- Click "Add"

### 6. Install Pods and Build
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

---

## 🆘 Troubleshooting

**Can't find the iOS app in Firebase?**
- Make sure you're in the correct project: `skyscansgames`
- You may need to add the iOS app first (Step 2)

**File not downloading?**
- Check your browser's download settings
- Try right-clicking the button → "Save link as..."

**Script can't find the file?**
- Make sure it downloaded to `~/Downloads`
- Check the file name is exactly `GoogleService-Info.plist`
- Try running the script again

---

**Ready?** Go to Firebase Console and download the file! 🚀
