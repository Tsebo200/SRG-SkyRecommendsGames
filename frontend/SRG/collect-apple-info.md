# Apple Developer Information Needed

To proceed with App Store deployment, we need the following information from your Apple Developer account:

## Required Information

### 1. Apple ID Email
- This is the email address you use to sign in to Apple Developer Portal
- Example: `your-email@example.com`

### 2. Apple Team ID
- A 10-character alphanumeric string
- **How to find it:**
  1. Go to https://developer.apple.com/account/#/membership/
  2. Sign in with your Apple ID
  3. Look for "Team ID" - it looks like `ABC123DEFG`

### 3. App Store Connect App ID
- A numeric ID (like `1234567890`)
- **How to get it:**
  1. First, make sure your Bundle ID is registered:
     - Go to https://developer.apple.com/account/resources/identifiers/list
     - Click "+" to create new App ID if needed
     - Bundle ID: `com.creativeT.SRG`
  2. Then create the app in App Store Connect:
     - Go to https://appstoreconnect.apple.com
     - Click "My Apps" → "+" → "New App"
     - Fill in:
       - Platform: iOS
       - Name: Sky Recommends Games (or your preferred name)
       - Primary Language: English
       - Bundle ID: Select `com.creativeT.SRG`
       - SKU: `SRG-001`
     - After creating, the App ID is visible in the URL or app details

## Quick Links

- **Apple Developer Portal**: https://developer.apple.com/account/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Team ID Location**: https://developer.apple.com/account/#/membership/

## Once You Have This Information

We'll update `eas.json` with these values and proceed with the build!



