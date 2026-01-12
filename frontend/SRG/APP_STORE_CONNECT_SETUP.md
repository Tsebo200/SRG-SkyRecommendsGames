# App Store Connect Setup Checklist

## Step 1: Create the App (Do This Now)

Go to: https://appstoreconnect.apple.com

1. Click **"My Apps"** → **"+"** → **"New App"**

2. Fill in the required fields:
   - **Platform**: iOS
   - **Name**: Sky Recommends Games (or your preferred name)
   - **Primary Language**: English
   - **Bundle ID**: Select `com.creativeT.SRG` (if it's not listed, you need to register it first in Apple Developer Portal)
   - **SKU**: `SRG-001`
   - **User Access**: Full Access

3. Click **"Create"**

## Step 2: Get the App Store Connect App ID

After creating the app, you'll see the app details page. The **App ID** (also called ASC App ID) is:

- **In the URL**: The numbers after `/app/` (e.g., `https://appstoreconnect.apple.com/apps/1234567890/...`)
- **Or in the app information**: Look for "Apple ID" or "App ID" - it's a numeric value like `1234567890`

**Copy this number and share it with me!**

## Step 3: Optional - Add Basic Info Now (or do later)

While you're there, you can optionally add:
- App description (can be updated later)
- Category: Games → Entertainment
- But you can skip screenshots and detailed metadata for now - we'll add those while the build runs

---

**Once you have the App Store Connect App ID, share it and we'll:**
1. Update eas.json
2. Set up environment variables
3. Start the production build
4. Guide you through adding screenshots/metadata while it builds



