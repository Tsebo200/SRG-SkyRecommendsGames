# App Store & Play Store Deployment Guide

This guide will walk you through deploying Sky Recommends Games (SRG) to both the Apple App Store and Google Play Store.

## Prerequisites

### For Both Platforms:
- [ ] Expo account (free tier works)
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into Expo: `eas login`

### For iOS (App Store):
- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect access
- [ ] Xcode installed (for local builds, optional)

### For Android (Play Store):
- [ ] Google Play Console account ($25 one-time fee)
- [ ] Service account key (for automated submission)

---

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

---

## Step 2: Configure Your App

### Update Bundle Identifiers

The app.json has been updated with:
- iOS Bundle ID: `com.skyrecommendsgames.SRG`
- Android Package: `com.skyrecommendsgames.SRG`

**Important:** You need to register these bundle IDs:
- **iOS**: Register in [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
- **Android**: The package name is automatically registered when you create the app in Play Console

---

## Step 3: Build for iOS (App Store)

### 3.1 Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Sky Recommends Games
   - Primary Language: English
   - Bundle ID: `com.skyrecommendsgames.SRG`
   - SKU: `SRG-001` (or any unique identifier)
   - User Access: Full Access

### 3.2 Build iOS App

```bash
cd frontend/SRG
eas build --platform ios --profile production
```

This will:
- Prompt you to create an EAS project (if first time)
- Build your app in the cloud
- Generate an `.ipa` file ready for submission

### 3.3 Submit to App Store

```bash
eas submit --platform ios --profile production
```

Or manually:
1. Download the `.ipa` from EAS dashboard
2. Use Transporter app or Xcode to upload to App Store Connect
3. Complete app metadata in App Store Connect:
   - Screenshots (required sizes)
   - App description
   - Keywords
   - Privacy policy URL
   - Support URL
   - Category: Games / Entertainment

### 3.4 App Store Metadata Requirements

You'll need:
- **Screenshots**: 
  - iPhone 6.7" (1290 x 2796)
  - iPhone 6.5" (1284 x 2778)
  - iPhone 5.5" (1242 x 2208)
  - iPad Pro 12.9" (2048 x 2732)
- **App Icon**: 1024 x 1024 (already configured)
- **App Preview Video** (optional)
- **Description**: Up to 4000 characters
- **Keywords**: Up to 100 characters
- **Support URL**: Required
- **Privacy Policy URL**: Required

---

## Step 4: Build for Android (Play Store)

### 4.1 Create App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - App name: Sky Recommends Games
   - Default language: English
   - App or game: Game
   - Free or paid: Free
   - Declarations: Check all applicable boxes

### 4.2 Create Service Account (for automated submission)

1. In Play Console: Settings → API access
2. Create service account
3. Download JSON key file
4. Save as `service-account-key.json` in `frontend/SRG/`
5. Grant "Release Manager" role to service account

### 4.3 Build Android App

```bash
cd frontend/SRG
eas build --platform android --profile production
```

This generates an `.aab` (Android App Bundle) file.

### 4.4 Submit to Play Store

```bash
eas submit --platform android --profile production
```

Or manually:
1. Download the `.aab` from EAS dashboard
2. Go to Play Console → Your app → Production
3. Click "Create new release"
4. Upload the `.aab` file
5. Fill in release notes
6. Review and roll out

### 4.5 Play Store Metadata Requirements

You'll need:
- **App Icon**: 512 x 512 (already configured)
- **Feature Graphic**: 1024 x 500
- **Screenshots**: 
  - Phone: At least 2, up to 8 (16:9 or 9:16)
  - Tablet: At least 1 (7" or 10")
- **Short Description**: Up to 80 characters
- **Full Description**: Up to 4000 characters
- **Privacy Policy URL**: Required
- **Content Rating**: Complete questionnaire

---

## Step 5: Environment Variables

Make sure your production environment variables are set:

```bash
# In EAS dashboard or eas.json
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "your-production-backend-url"
eas secret:create --scope project --name FIREBASE_API_KEY --value "your-firebase-key"
# ... add all required environment variables
```

Or create a `.env.production` file (but secrets are more secure).

---

## Step 6: Testing Before Release

### Internal Testing

1. Build preview versions:
   ```bash
   eas build --platform ios --profile preview
   eas build --platform android --profile preview
   ```

2. Test on real devices using TestFlight (iOS) or Internal Testing (Android)

### TestFlight (iOS)

1. Upload build to App Store Connect
2. Add testers in TestFlight section
3. Testers receive email invitation

### Internal Testing (Android)

1. Upload `.aab` to Internal Testing track
2. Add testers via email
3. Testers can download from Play Store

---

## Step 7: Release Checklist

### Before Submitting:

- [ ] App version number updated in `app.json`
- [ ] Build number incremented (iOS: `buildNumber`, Android: `versionCode`)
- [ ] All environment variables configured
- [ ] App tested on real devices
- [ ] Privacy policy URL ready
- [ ] Support URL ready
- [ ] Screenshots prepared for all required sizes
- [ ] App description written
- [ ] Keywords researched and added
- [ ] Content rating completed (Android)
- [ ] App Store Connect/Play Console accounts set up

### iOS Specific:

- [ ] Apple Developer account active
- [ ] Bundle ID registered
- [ ] App Store Connect app created
- [ ] TestFlight testing completed
- [ ] App Review Information filled (contact info, demo account if needed)

### Android Specific:

- [ ] Google Play Console account created
- [ ] Service account key configured (for automated submission)
- [ ] Content rating questionnaire completed
- [ ] Target audience and content settings configured
- [ ] Data safety section completed

---

## Step 8: Submission Process

### iOS App Store:

1. Build: `eas build --platform ios --profile production`
2. Submit: `eas submit --platform ios --profile production`
3. Complete metadata in App Store Connect
4. Submit for review
5. Wait for review (typically 24-48 hours)
6. App goes live after approval

### Google Play Store:

1. Build: `eas build --platform android --profile production`
2. Submit: `eas submit --platform android --profile production`
3. Complete store listing in Play Console
4. Create release and upload AAB
5. Review and publish
6. App goes live (can take a few hours)

---

## Step 9: Post-Launch

### Monitor:

- App Store Connect Analytics (iOS)
- Google Play Console Analytics (Android)
- User reviews and ratings
- Crash reports
- Performance metrics

### Updates:

When releasing updates:

1. Update version in `app.json`:
   ```json
   "version": "1.0.1",
   "ios": { "buildNumber": "2" },
   "android": { "versionCode": 2 }
   ```

2. Build and submit:
   ```bash
   eas build --platform all --profile production
   eas submit --platform all --profile production
   ```

---

## Troubleshooting

### Common Issues:

1. **Bundle ID already exists**: Register it in Apple Developer Portal first
2. **Build fails**: Check EAS build logs in dashboard
3. **Submission fails**: Verify all metadata is complete
4. **App rejected**: Address feedback in App Store Connect/Play Console

### Getting Help:

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Expo Discord](https://chat.expo.dev/)
- [Apple Developer Forums](https://developer.apple.com/forums/)
- [Google Play Help](https://support.google.com/googleplay/android-developer)

---

## Cost Summary

- **Expo EAS**: Free tier (limited builds), $29/month for unlimited
- **Apple Developer**: $99/year
- **Google Play**: $25 one-time fee
- **Total First Year**: ~$124-153

---

## Quick Commands Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Build both
eas build --platform all --profile production

# Submit iOS
eas submit --platform ios --profile production

# Submit Android
eas submit --platform android --profile production

# View builds
eas build:list

# View submissions
eas submit:list
```

---

## Next Steps

1. **Update bundle identifiers** in `app.json` if needed
2. **Register bundle IDs** in Apple Developer Portal
3. **Create apps** in App Store Connect and Play Console
4. **Prepare screenshots** and metadata
5. **Run first build**: `eas build --platform all --profile production`
6. **Test** using TestFlight/Internal Testing
7. **Submit** for review

Good luck with your deployment! 🚀


