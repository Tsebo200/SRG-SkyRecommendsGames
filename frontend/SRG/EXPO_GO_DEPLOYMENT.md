# Deploying to Expo Go

This guide explains how to publish your app to Expo's servers so it can be accessed via the Expo Go app.

## ⚠️ Important Limitations

**Note:** Your app uses some native modules that **may not work in Expo Go**:
- `@react-native-firebase/app` and `@react-native-firebase/auth`
- `@react-native-voice/voice`
- `expo-camera` (should work)
- `expo-av` (should work)

If these modules don't work in Expo Go, you'll need to use **Development Builds** instead (see alternative method below).

---

## Method 1: Publish to Expo (Classic - Deprecated but Still Works)

### Step 1: Install Expo CLI

```bash
npm install -g expo-cli
```

### Step 2: Login to Expo

```bash
expo login
```

Enter your Expo account credentials (create one at [expo.dev](https://expo.dev) if needed).

### Step 3: Publish Your App

```bash
cd frontend/SRG
expo publish
```

This will:
- Bundle your JavaScript
- Upload assets
- Generate a URL like: `exp://exp.host/@your-username/srg-sky-recommends-games`

### Step 4: Share Your App

After publishing, you'll get:
- **QR Code**: Scan with Expo Go app
- **URL**: Share with others: `exp://exp.host/@your-username/srg-sky-recommends-games`

### Step 5: Access in Expo Go

1. Install **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Open Expo Go and:
   - Scan the QR code from terminal, OR
   - Enter the URL manually, OR
   - Find it in "Recently opened" if you've opened it before

---

## Method 2: EAS Update (Recommended - Modern Approach)

EAS Update is the modern way to publish updates to Expo Go and development builds.

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login

```bash
eas login
```

### Step 3: Configure EAS Update

```bash
cd frontend/SRG
eas update:configure
```

This creates an `eas.json` file (you already have one, but this ensures it's configured for updates).

### Step 4: Publish Update

```bash
eas update --branch production --message "Initial release"
```

This publishes your app to Expo's CDN.

### Step 5: Get Shareable Link

After publishing, you'll get a URL. You can also create a shareable link:

```bash
eas update:list
```

Or visit: https://expo.dev/accounts/[your-username]/projects/srg-sky-recommends-games/updates

---

## Method 3: Development Build (If Native Modules Don't Work)

If your native modules don't work in Expo Go, create a **development build**:

### Step 1: Build Development Client

```bash
cd frontend/SRG
eas build --profile development --platform ios
eas build --profile android --platform android
```

### Step 2: Install on Device

- **iOS**: Install via TestFlight or direct download
- **Android**: Download APK and install

### Step 3: Publish Updates

```bash
eas update --branch development --message "Update description"
```

The development build will automatically fetch updates.

---

## Quick Start Commands

### For Expo Go (Classic):

```bash
cd frontend/SRG
expo login
expo publish
```

### For EAS Update:

```bash
cd frontend/SRG
eas login
eas update:configure
eas update --branch production --message "Initial release"
```

### For Development Build:

```bash
cd frontend/SRG
eas build --profile development --platform all
eas update --branch development --message "Update"
```

---

## Sharing Your App

### Option 1: QR Code
After publishing, a QR code appears in the terminal. Scan it with:
- **iOS**: Camera app (opens Expo Go)
- **Android**: Expo Go app's scanner

### Option 2: Share URL
Share the `exp://` URL with others. They can:
1. Open Expo Go
2. Tap "Enter URL manually"
3. Paste the URL

### Option 3: Expo Go App
If you're logged into the same Expo account:
- Open Expo Go
- Go to "Profile" tab
- Find your published projects

---

## Troubleshooting

### "Module not found" errors in Expo Go

Some native modules aren't available in Expo Go. Solutions:
1. Use **Development Build** instead (Method 3)
2. Remove incompatible modules temporarily
3. Use Expo-compatible alternatives

### App won't load

1. Check internet connection
2. Verify you're logged into the same Expo account
3. Try clearing Expo Go cache (Settings → Clear cache)
4. Check if the update was published successfully

### Firebase not working

Firebase requires native code. Options:
1. Use Development Build
2. Use Expo's Firebase alternative: `expo-firebase-recaptcha` (limited)
3. Build standalone app for production

---

## Environment Variables

If you use environment variables, set them in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "your-backend-url"
```

Or use `.env` files (but secrets are more secure for production).

---

## Updating Your App

### Classic Expo Publish:
```bash
expo publish
```

### EAS Update:
```bash
eas update --branch production --message "Bug fixes"
```

Updates are **instant** - users get them immediately when they reopen the app!

---

## Best Practices

1. **Use EAS Update** for modern projects (recommended)
2. **Test in Expo Go first** to verify compatibility
3. **Use Development Builds** if you need custom native code
4. **Version your updates** with meaningful messages
5. **Monitor updates** in Expo dashboard

---

## Next Steps

1. **Try Expo Go first**: `expo publish` or `eas update`
2. **Test on real device** using Expo Go app
3. **If modules don't work**: Switch to Development Build
4. **For production**: Build standalone apps for App Store/Play Store

---

## Quick Reference

```bash
# Login
expo login          # Classic
eas login           # Modern

# Publish
expo publish        # Classic (deprecated but works)
eas update          # Modern (recommended)

# Build
eas build --profile development --platform all

# View updates
eas update:list

# Share
# QR code appears after publish
# Or share exp:// URL
```

---

## Need Help?

- [Expo Docs](https://docs.expo.dev/)
- [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)
- [Expo Discord](https://chat.expo.dev/)
- [Expo Forums](https://forums.expo.dev/)


