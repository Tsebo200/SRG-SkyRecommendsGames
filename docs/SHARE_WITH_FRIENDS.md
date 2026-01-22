# Sharing Your App with Friends

Once you've deployed your backend to a public server, here's how to share the app with your friends.

## Quick Setup for Friends

### Option 1: Share via Expo Go (Easiest) 📱

1. **Deploy Backend** (follow `DEPLOY_BACKEND_PUBLIC.md`)
2. **Get Your Public Backend URL** (e.g., `https://srg-backend.railway.app`)
3. **Share with Friends**:
   - Friends install **Expo Go** app from App Store/Play Store
   - You share your Expo development URL (from `npm start`)
   - Friends scan QR code or enter URL in Expo Go
   - **Important**: Friends need to set the backend URL in their app

### Option 2: Build and Distribute (Production) 🚀

1. **Build Production App**:
   ```bash
   cd frontend/SRG
   eas build --platform ios  # or android
   ```

2. **Set Production Backend URL**:
   - Update `EXPO_PUBLIC_BACKEND_URL` in your `.env` to production URL
   - Or hardcode it in the app for production builds

3. **Distribute**:
   - **iOS**: TestFlight or App Store
   - **Android**: Google Play Store or APK file

## Setting Backend URL for Friends

### Method 1: Environment Variable (Development)

Friends need to create `frontend/SRG/.env` file:
```bash
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### Method 2: Hardcode in App (Production)

Update `frontend/SRG/lib/network-config.ts`:
```typescript
export function getBackendUrl(): string {
  // Production backend URL (hardcoded)
  const PRODUCTION_URL = "https://your-backend-url.com";
  
  // Use production URL if in production build
  if (process.env.NODE_ENV === 'production' || !__DEV__) {
    return PRODUCTION_URL;
  }
  
  // Development: use environment variable or localhost
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }
  
  return `http://localhost:${BACKEND_PORT}`;
}
```

### Method 3: Remote Config (Advanced)

Use a service like Firebase Remote Config to update backend URL without app updates.

## Step-by-Step: Share via Expo Go

### For You (Developer):
1. Deploy backend to Railway/Render/etc.
2. Get public URL: `https://your-backend.railway.app`
3. Update your `.env`: `EXPO_PUBLIC_BACKEND_URL=https://your-backend.railway.app`
4. Start Expo: `cd frontend/SRG && npm start`
5. Share the QR code or URL with friends

### For Your Friends:
1. Install **Expo Go** from App Store/Play Store
2. Scan QR code or enter URL you shared
3. App loads in Expo Go
4. **They need to set backend URL**:
   - Create `frontend/SRG/.env` file (if they have the code)
   - Or you can hardcode it in your repo before sharing

## Recommended: Hardcode Production URL

**Best approach for sharing**: Hardcode the production backend URL in your code so friends don't need to configure anything.

### Update `network-config.ts`:

```typescript
// Production backend URL - change this to your deployed backend
const PRODUCTION_BACKEND_URL = "https://your-backend.railway.app";

export function getBackendUrl(): string {
  // In production or when EXPO_PUBLIC_BACKEND_URL is not set, use production URL
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  
  if (envUrl && envUrl.trim()) {
    // Environment variable takes priority (for local development)
    return envUrl.trim();
  }
  
  // Fallback to production URL
  if (PRODUCTION_BACKEND_URL) {
    return PRODUCTION_BACKEND_URL;
  }
  
  // Last resort: localhost for development
  return `http://localhost:${BACKEND_PORT}`;
}
```

This way:
- **You**: Can use local backend by setting `EXPO_PUBLIC_BACKEND_URL` in `.env`
- **Friends**: Automatically use production backend (no configuration needed)

## Testing with Friends

1. **Deploy Backend**: Follow `DEPLOY_BACKEND_PUBLIC.md`
2. **Update Code**: Hardcode production URL in `network-config.ts`
3. **Test Locally**: Verify it connects to production backend
4. **Share**: Give friends Expo Go URL or build APK/IPA
5. **Verify**: Friends should be able to use all features

## Troubleshooting

### Friend Can't Connect
- ✅ Check backend is deployed and accessible
- ✅ Verify backend URL is correct
- ✅ Check backend health: `curl https://your-backend.com/health`
- ✅ Ensure CORS allows your app's origin

### Friend Gets Network Errors
- ✅ Backend might be down (check Railway/Render dashboard)
- ✅ Backend URL might be wrong
- ✅ Firewall blocking (unlikely with cloud hosting)

### Friend Can't See Recommendations
- ✅ Check backend logs for errors
- ✅ Verify API keys are set in backend environment
- ✅ Check rate limiting (might be too strict)

## Security Notes

⚠️ **Important**: When sharing publicly:
- Don't commit API keys to GitHub
- Use environment variables in cloud hosting
- Consider adding API authentication
- Monitor usage and costs

## Cost Management

- **Railway Free Tier**: 500 hours/month (enough for testing)
- **Render Free Tier**: 750 hours/month
- **Monitor Usage**: Check your cloud provider dashboard
- **Set Alerts**: Get notified if approaching limits

## Next Steps

1. ✅ Deploy backend (see `DEPLOY_BACKEND_PUBLIC.md`)
2. ✅ Hardcode production URL in app
3. ✅ Test with one friend first
4. ✅ Share with more friends
5. ✅ Monitor backend usage and costs

Happy sharing! 🎮
