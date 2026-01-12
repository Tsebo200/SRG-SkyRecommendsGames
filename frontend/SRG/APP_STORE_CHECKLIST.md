# App Store Deployment Checklist

Use this checklist to ensure you've completed all steps before submitting to the App Store.

## Pre-Deployment Setup

### Account Setup
- [ ] Apple Developer Account purchased ($99/year)
- [ ] Expo account created (free tier works)
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into Expo: `eas login`

### Apple Developer Portal
- [ ] Bundle ID registered: `com.creativeT.SRG`
- [ ] Apple Team ID noted (10-character string)
- [ ] App ID created in App Store Connect
- [ ] App Store Connect App ID noted (numeric ID)

### Configuration Files
- [ ] `eas.json` updated with:
  - [ ] Apple ID email
  - [ ] App Store Connect App ID
  - [ ] Apple Team ID
- [ ] `app.json` verified:
  - [ ] Bundle identifier: `com.creativeT.SRG`
  - [ ] Version: `1.0.0`
  - [ ] Build number: `1`
  - [ ] App name and icon configured

### Environment Variables
- [ ] Production backend URL set: `eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "..."` 
- [ ] Supabase URL set: `eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."`
- [ ] Supabase Anon Key set: `eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."`
- [ ] Firebase API Key set: `eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..."`
- [ ] Firebase Auth Domain set: `eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "..."`
- [ ] Firebase Project ID set: `eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "..."`
- [ ] Firebase Storage Bucket set: `eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "..."`
- [ ] Firebase Messaging Sender ID set: `eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "..."`
- [ ] Firebase App ID set: `eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "..."`
- [ ] Google Cloud Speech API Key set (if used): `eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY --value "..."`

### Build
- [ ] Production build completed: `eas build --platform ios --profile production`
- [ ] Build successful (no errors)
- [ ] Build ID noted for reference

## App Store Connect Setup

### App Information
- [ ] App name entered
- [ ] Primary language selected
- [ ] Bundle ID selected
- [ ] SKU entered
- [ ] Category selected (Games → Entertainment)

### App Privacy
- [ ] Privacy policy URL added (REQUIRED)
- [ ] Data collection questions answered:
  - [ ] Camera usage (for QR scanning)
  - [ ] Microphone usage (for voice search)
  - [ ] User data collection
  - [ ] Third-party data sharing (Firebase, Supabase)

### App Assets
- [ ] App icon: 1024 x 1024 pixels (PNG, no transparency)
- [ ] Screenshots for iPhone 6.7" (1290 x 2796)
- [ ] Screenshots for iPhone 6.5" (1284 x 2778)
- [ ] Screenshots for iPhone 5.5" (1242 x 2208)
- [ ] Screenshots for iPad Pro 12.9" (2048 x 2732) - if supporting iPad
- [ ] App Preview Video (optional but recommended)

### Version Information
- [ ] Version number: 1.0.0
- [ ] "What's New" release notes written
- [ ] Full app description written (up to 4000 characters)
- [ ] Keywords added (up to 100 characters)
- [ ] Support URL added (REQUIRED)
- [ ] Marketing URL added (optional)
- [ ] Promotional text added (optional, up to 170 characters)

### App Review Information
- [ ] Contact name entered
- [ ] Contact phone number entered
- [ ] Contact email entered
- [ ] Demo account credentials provided (if app requires login)
- [ ] Notes for reviewers added (if needed)
- [ ] Attachments added (if needed)

### Pricing and Availability
- [ ] Price set (Free or Paid)
- [ ] Countries/regions selected
- [ ] Availability date set

### Build Selection
- [ ] Build uploaded to App Store Connect
- [ ] Build processed (may take 10-30 minutes)
- [ ] Build selected for this version

## Pre-Submission Verification

### Final Checks
- [ ] App tested on physical iOS device
- [ ] All features working correctly
- [ ] No crashes or critical bugs
- [ ] Privacy policy accessible at provided URL
- [ ] Support URL accessible
- [ ] All required fields completed
- [ ] Screenshots match current app version
- [ ] App description accurate

### Export Compliance
- [ ] Export compliance questions answered (if applicable)
- [ ] Encryption information provided (if applicable)

## Submission

- [ ] All checklist items completed
- [ ] "Add for Review" clicked
- [ ] Final questions answered
- [ ] "Submit for Review" clicked
- [ ] Confirmation email received

## Post-Submission

### Monitoring
- [ ] Check App Store Connect daily for status updates
- [ ] Monitor email for notifications
- [ ] Prepare responses for potential questions

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Address all issues mentioned
- [ ] Make necessary changes
- [ ] Resubmit with explanation
- [ ] Update this checklist with lessons learned

### If Approved
- [ ] App status: "Pending Developer Release"
- [ ] Review app one final time
- [ ] Click "Release This Version"
- [ ] App goes live within 24 hours
- [ ] Monitor initial reviews and ratings

## Quick Command Reference

```bash
# Navigate to project
cd frontend/SRG

# Set environment variable
eas secret:create --scope project --name VARIABLE_NAME --value "value"

# List all secrets
eas secret:list

# Build for iOS
eas build --platform ios --profile production

# List builds
eas build:list

# Submit to App Store
eas submit --platform ios --profile production

# View build details
eas build:view [build-id]
```

## Notes

- Keep this checklist updated as you progress
- Save important IDs (Team ID, App ID, Build IDs) in a secure place
- Document any issues encountered and their solutions
- Review process typically takes 24-48 hours
- Be patient and responsive to any App Store requests

---

**Last Updated**: [Date]
**Current Version**: 1.0.0
**Build Number**: 1



