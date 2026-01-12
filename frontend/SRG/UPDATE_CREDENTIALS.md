# Update Apple Developer Credentials

The script approach had some issues. Here's the easiest way to update your credentials:

## Option 1: Manual Edit (Recommended)

Open `frontend/SRG/eas.json` and update these three values in the `submit.production.ios` section:

```json
"ios": {
  "appleId": "your-apple-id@example.com",        // ← Replace with your Apple ID email
  "ascAppId": "your-app-store-connect-app-id",   // ← Replace with numeric App Store Connect App ID
  "appleTeamId": "your-apple-team-id"            // ← Replace with your 10-character Team ID
}
```

## Option 2: Provide Values Here

If you provide me with:
1. **Apple ID email** (e.g., `yourname@example.com`)
2. **Apple Team ID** (10 characters, e.g., `ABC123DEFG`)
3. **App Store Connect App ID** (numeric, e.g., `1234567890`)

I can update the file for you directly!

## How to Find These Values

### Apple ID Email
- The email address you use to sign in to Apple Developer Portal

### Apple Team ID
1. Go to: https://developer.apple.com/account/#/membership/
2. Sign in with your Apple ID
3. Look for "Team ID" - it's a 10-character string

### App Store Connect App ID
1. Go to: https://appstoreconnect.apple.com
2. Sign in with your Apple ID
3. Click "My Apps" → Create new app (or open existing)
4. Bundle ID: `com.creativeT.SRG`
5. After creating, the App ID is visible in:
   - The URL (numbers after `/app/`)
   - Or in the app details page

**Note**: If you haven't created the app in App Store Connect yet, you can leave `ascAppId` as placeholder for now and we'll update it after creating the app.



