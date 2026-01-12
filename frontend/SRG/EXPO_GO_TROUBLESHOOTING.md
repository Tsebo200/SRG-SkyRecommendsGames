# Expo Go Troubleshooting - Development Build Required

## ❌ Problem

Your app uses native modules that **cannot run in Expo Go**:
- `@react-native-firebase/app` and `@react-native-firebase/auth`
- `@react-native-voice/voice`
- `react-native-worklets` and `react-native-worklets-core`

## ✅ Solution: Create a Development Build

You need to create a **Development Build** instead of using Expo Go. This is a custom version of Expo Go that includes your native modules.

---

## Step 1: Build Development Client

### For iOS:
```bash
cd frontend/SRG
eas build --profile development --platform ios
```

### For Android:
```bash
cd frontend/SRG
eas build --profile development --platform android
```

### For Both:
```bash
cd frontend/SRG
eas build --profile development --platform all
```

**Note:** This will take 10-20 minutes. You'll get a download link when it's done.

---

## Step 2: Install Development Build on Your Phone

### iOS:
1. Download the `.ipa` file from EAS dashboard
2. Install via TestFlight (recommended) or direct install
3. Or use the link provided after build completes

### Android:
1. Download the `.apk` file from EAS dashboard
2. Enable "Install from unknown sources" on your phone
3. Install the APK file

---

## Step 3: Publish Updates

After installing the development build, publish updates:

```bash
cd frontend/SRG
eas update --branch development --message "Your update message"
```

The development build will automatically fetch and apply updates!

---

## Alternative: Use Development Server (Local Testing)

If you want to test locally without building:

```bash
cd frontend/SRG
npm start
```

Then:
1. Install Expo Go
2. Scan the QR code
3. **BUT** - Firebase and voice features won't work

---

## Quick Commands

```bash
# Build development client
eas build --profile development --platform all

# Publish update to development build
eas update --branch development --message "Update"

# View your builds
eas build:list

# View your updates
eas update:list
```

---

## Why This Happens

Expo Go only includes a limited set of native modules. Your app needs:
- Firebase native SDKs (not available in Expo Go)
- Voice recognition native SDKs (not available in Expo Go)
- Custom native worklets

These require a **custom build** with your native code compiled in.

---

## Cost

- **Development builds**: Free on EAS (limited builds per month)
- **Production builds**: Free tier available, or $29/month for unlimited

---

## Next Steps

1. Run: `eas build --profile development --platform all`
2. Wait for build to complete (10-20 min)
3. Install on your device
4. Publish updates: `eas update --branch development`

Your app will work perfectly in the development build! 🚀


