# TestFlight Deployment Guide

Complete step-by-step guide to deploy your app to TestFlight for beta testing.

## Prerequisites Checklist

- [ ] **Apple Developer Account** ($99/year) - [Sign up](https://developer.apple.com/programs/)
- [ ] **Expo account** (free) - [Sign up](https://expo.dev/signup)
- [ ] **EAS CLI installed** - `npm install -g eas-cli`
- [ ] **App registered in App Store Connect** with Bundle ID: `org.name.SRGReactNativeExpo`
- [ ] **Backend deployed** (for production testing) - See `DEPLOY_BACKEND_PUBLIC.md`

## Current Configuration

✅ **EAS Project ID**: `5703e0d7-98d2-487a-8f53-cb544ef6bf38`
✅ **Bundle Identifier**: `org.name.SRGReactNativeExpo`
✅ **Apple ID**: `tbonziser@gmail.com`
✅ **App Store Connect App ID**: `6757149381`
✅ **Apple Team ID**: `G4XVP29J8P`

## Step 1: Verify App Store Connect Setup

1. **Go to App Store Connect**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Check Your App**:
   - App should exist with Bundle ID: `org.name.SRGReactNativeExpo`
   - App ID: `6757149381`
   - Status should be "Prepare for Submission" or "Ready for Sale"

3. **Verify TestFlight Tab**:
   - Go to your app → TestFlight tab
   - Ensure you can see the TestFlight section

## Step 2: Install and Configure EAS CLI

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify you're logged in
eas whoami
```

## Step 3: Verify EAS Configuration

Your `frontend/SRG/eas.json` is already configured! ✅

Current settings:
- **Production build**: Configured for iOS Release
- **Auto-increment**: Enabled (build numbers increment automatically)
- **Submit configuration**: Apple credentials already set

## Step 4: Set Environment Variables (Optional but Recommended)

If you have a production backend URL, set it as a secret:

```bash
cd frontend/SRG

# Set production backend URL (if you have one)
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "https://your-backend.railway.app"

# View all secrets
eas secret:list
```

**Note**: If you don't have a production backend yet, you can skip this and use localhost for now, or hardcode it in the app.

## Step 5: Build for TestFlight

### Option A: Build and Submit in One Command (Recommended)

```bash
cd frontend/SRG

# Build and automatically submit to TestFlight
eas build --platform ios --profile production --auto-submit
```

### Option B: Build First, Submit Later

```bash
cd frontend/SRG

# Step 1: Build the app
eas build --platform ios --profile production

# Wait for build to complete (10-20 minutes)
# You'll get a build ID and can track progress at: https://expo.dev/accounts/glitchedsky/projects/SRG/builds

# Step 2: After build completes, submit to TestFlight
eas submit --platform ios --profile production
```

## Step 6: Monitor Build Progress

1. **During Build**:
   - Watch the terminal for progress
   - Or visit: https://expo.dev/accounts/glitchedsky/projects/SRG/builds
   - Build typically takes 10-20 minutes

2. **Build Status**:
   - `in-progress`: Building
   - `finished`: Ready to submit
   - `errored`: Check logs for issues

3. **View Build Logs**:
   ```bash
   eas build:view [build-id]
   ```

## Step 7: Submit to TestFlight

If you used `--auto-submit`, this happens automatically. Otherwise:

```bash
eas submit --platform ios --profile production
```

**What happens**:
1. EAS uploads the build to App Store Connect
2. Apple processes the build (10-30 minutes)
3. Build appears in TestFlight tab
4. You can add testers and distribute

## Step 8: Configure TestFlight

1. **Go to App Store Connect**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Select Your App** → **TestFlight Tab**
3. **Wait for Processing**: 
   - First build: 10-30 minutes
   - Subsequent builds: Usually faster

4. **Add Internal Testers** (Up to 100):
   - Go to TestFlight → Internal Testing
   - Click "+" to add testers
   - Add email addresses of testers
   - They'll receive an email invitation

5. **Add External Testers** (Up to 10,000):
   - Go to TestFlight → External Testing
   - Create a new group
   - Add testers
   - **Note**: External testing requires App Store review (24-48 hours)

## Step 9: Testers Install TestFlight

1. **Testers need**:
   - iOS device (iPhone/iPad)
   - TestFlight app installed from App Store
   - Apple ID email invitation

2. **Installation Process**:
   - Tester receives email invitation
   - Opens email on iOS device
   - Taps "View in TestFlight"
   - Installs app from TestFlight

## Step 10: Update App Information (Required for External Testing)

Before external testers can use the app, you need:

1. **App Information**:
   - App name, description, keywords
   - Category, privacy policy URL
   - Support URL

2. **Screenshots** (Required):
   - iPhone 6.7" (1290 x 2796) - iPhone 14 Pro Max
   - iPhone 6.5" (1284 x 2778) - iPhone 11 Pro Max
   - iPhone 5.5" (1242 x 2208) - iPhone 8 Plus

3. **Privacy Policy URL** (Required):
   - Must be publicly accessible
   - Can be a simple GitHub Pages site or your website

## Troubleshooting

### Build Fails

**Check build logs**:
```bash
eas build:view [build-id]
```

**Common issues**:
- **Missing credentials**: Verify Apple ID, Team ID in `eas.json`
- **Bundle ID mismatch**: Ensure `app.json` bundle identifier matches App Store Connect
- **Code signing**: EAS handles this automatically, but verify Team ID is correct

**Fix bundle identifier**:
```json
// frontend/SRG/app.json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "org.name.SRGReactNativeExpo"  // Must match App Store Connect
    }
  }
}
```

### Submission Fails

**Check submission status**:
```bash
eas submit:list
```

**Common issues**:
- **Invalid credentials**: Verify Apple ID and Team ID
- **App not found**: Ensure app exists in App Store Connect with correct Bundle ID
- **Build not processed**: Wait for Apple to process the build (10-30 minutes)

### TestFlight Build Not Appearing

1. **Check Processing Status**:
   - App Store Connect → TestFlight → Builds
   - Status should be "Ready to Test" (not "Processing")

2. **Wait Time**:
   - First build: 10-30 minutes
   - Subsequent builds: Usually faster

3. **Check Email**:
   - Apple sends email if build fails processing
   - Check spam folder

### App Crashes on Tester's Device

1. **Check Crash Reports**:
   - App Store Connect → TestFlight → Crashes
   - View crash logs

2. **Common Causes**:
   - Missing environment variables
   - Backend URL not accessible
   - Missing permissions in Info.plist

3. **Test Locally First**:
   ```bash
   # Build preview build for testing
   eas build --platform ios --profile preview
   ```

## Quick Reference Commands

```bash
# Login to Expo
eas login

# Check current user
eas whoami

# Build for TestFlight
eas build --platform ios --profile production

# Build and auto-submit
eas build --platform ios --profile production --auto-submit

# Submit existing build
eas submit --platform ios --profile production

# List all builds
eas build:list

# View specific build
eas build:view [build-id]

# List submissions
eas submit:list

# Set environment variable
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "https://your-backend.com"

# List secrets
eas secret:list

# Update credentials
eas credentials
```

## Build Profiles Explained

- **development**: For development builds with Expo Go
- **preview**: For internal testing (APK/IPA files)
- **production**: For App Store and TestFlight (what we're using)

## Timeline

- **Build Time**: 10-20 minutes
- **Apple Processing**: 10-30 minutes
- **First TestFlight Setup**: ~1 hour total
- **External Testing Review**: 24-48 hours (first time only)

## Next Steps After TestFlight

1. **Gather Feedback**: Collect feedback from testers
2. **Fix Issues**: Address bugs and improvements
3. **Iterate**: Build new versions and submit updates
4. **Submit to App Store**: When ready, submit for App Store review

## Important Notes

⚠️ **Bundle Identifier**: Must match exactly between:
- `app.json` → `ios.bundleIdentifier`
- App Store Connect → App Bundle ID
- Apple Developer Portal → App ID

⚠️ **Build Numbers**: Auto-increment is enabled, so each build gets a new build number automatically.

⚠️ **Version Numbers**: Update `app.json` → `version` when you want to release a new version.

⚠️ **TestFlight Expiration**: TestFlight builds expire after 90 days. You'll need to upload a new build.

## Need Help?

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **TestFlight Guide**: https://developer.apple.com/testflight/
- **Expo Forums**: https://forums.expo.dev/
- **Check Build Status**: https://expo.dev/accounts/glitchedsky/projects/SRG/builds

---

**Ready to deploy?** Run:
```bash
cd frontend/SRG
eas build --platform ios --profile production --auto-submit
```

Good luck! 🚀
