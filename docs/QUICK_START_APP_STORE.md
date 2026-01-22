# Quick Start: Deploy to App Store

This is a quick reference guide. For detailed instructions, see `APP_STORE_DEPLOYMENT.md`.

## Prerequisites

1. **Apple Developer Account** ($99/year) - [Sign up](https://developer.apple.com/programs/)
2. **Expo account** (free) - [Sign up](https://expo.dev/signup)
3. **EAS CLI installed**: `npm install -g eas-cli`

## 5-Minute Setup

### 1. Install & Login

```bash
npm install -g eas-cli
eas login
cd frontend/SRG
```

### 2. Register Bundle ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Create new App ID: `com.creativeT.SRG`
3. Note your **Team ID** from [Membership page](https://developer.apple.com/account/#/membership/)

### 3. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app with Bundle ID: `com.creativeT.SRG`
3. Note your **App Store Connect App ID** (numeric)

### 4. Update eas.json

Edit `frontend/SRG/eas.json` and replace:
- `your-apple-id@example.com` → Your Apple ID email
- `your-app-store-connect-app-id` → Your App Store Connect App ID
- `your-apple-team-id` → Your Apple Team ID

### 5. Set Environment Variables

Run the setup script:
```bash
cd frontend/SRG
./setup-app-store.sh
```

Or manually:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "https://your-production-backend.com"
# ... (see APP_STORE_DEPLOYMENT.md for all variables)
```

### 6. Build & Submit

```bash
# Build for iOS
eas build --platform ios --profile production

# After build completes, submit to App Store
eas submit --platform ios --profile production
```

### 7. Complete App Store Listing

1. Go to App Store Connect
2. Upload screenshots (required sizes)
3. Fill in app description, keywords, etc.
4. Add privacy policy URL (REQUIRED)
5. Submit for review

## Required Assets

- **App Icon**: 1024 x 1024 PNG
- **Screenshots**: 
  - iPhone 6.7" (1290 x 2796)
  - iPhone 6.5" (1284 x 2778)
  - iPhone 5.5" (1242 x 2208)
- **Privacy Policy URL**: Must be publicly accessible

## Timeline

- **Build**: 10-20 minutes
- **App Store Processing**: 10-30 minutes
- **Review**: 24-48 hours
- **Total**: ~2-3 days

## Troubleshooting

**Build fails?**
- Check: `eas build:view [build-id]`
- Verify secrets: `eas secret:list`

**Submission fails?**
- Verify Apple ID, App ID, Team ID in `eas.json`
- Try manual submission via Transporter app

**App rejected?**
- Most common: Missing privacy policy URL
- Check App Store Connect for specific reasons

## Full Documentation

- **Detailed Guide**: `APP_STORE_DEPLOYMENT.md`
- **Checklist**: `frontend/SRG/APP_STORE_CHECKLIST.md`
- **EAS Docs**: https://docs.expo.dev/build/introduction/

## Quick Commands

```bash
# List secrets
eas secret:list

# Build iOS
eas build --platform ios --profile production

# Submit
eas submit --platform ios --profile production

# View builds
eas build:list
```

---

**Need help?** Check `APP_STORE_DEPLOYMENT.md` for detailed instructions.



