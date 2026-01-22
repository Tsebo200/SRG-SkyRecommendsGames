# TestFlight Quick Start 🚀

**Fastest way to get your app on TestFlight**

## ✅ Pre-Flight Checklist

Before you start, make sure you have:

- [x] Apple Developer Account ($99/year)
- [x] App registered in App Store Connect (Bundle ID: `org.name.SRGReactNativeExpo`)
- [x] EAS CLI installed ✅ (Already installed!)
- [ ] Logged in to Expo (run `eas login` if needed)
- [ ] Production backend deployed (optional but recommended)

## 🚀 Deploy in 3 Steps

### Step 1: Login to Expo (if needed)

```bash
cd frontend/SRG
eas login
```

### Step 2: Run Deployment Script

```bash
# From project root
./deploy-testflight.sh
```

**OR manually:**

```bash
cd frontend/SRG
eas build --platform ios --profile production --auto-submit
```

### Step 3: Wait and Add Testers

1. **Wait for build** (10-20 minutes)
   - Monitor: https://expo.dev/accounts/glitchedsky/projects/SRG/builds

2. **Wait for Apple processing** (10-30 minutes)
   - Check: App Store Connect → TestFlight

3. **Add testers**:
   - App Store Connect → Your App → TestFlight
   - Internal Testing → Add testers
   - They'll receive email invitations

## 📋 Your Current Configuration

✅ **Bundle ID**: `org.name.SRGReactNativeExpo`
✅ **Apple ID**: `tbonziser@gmail.com`
✅ **App Store Connect App ID**: `6757149381`
✅ **Apple Team ID**: `G4XVP29J8P`
✅ **EAS Project ID**: `5703e0d7-98d2-487a-8f53-cb544ef6bf38`

## 🔧 Optional: Set Production Backend URL

If you have a deployed backend:

```bash
cd frontend/SRG
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "https://your-backend.railway.app"
```

## 📱 Testers Need

1. **TestFlight app** (from App Store)
2. **Email invitation** (you'll send from App Store Connect)
3. **iOS device** (iPhone/iPad)

## ⏱️ Timeline

- **Build**: 10-20 minutes
- **Apple Processing**: 10-30 minutes
- **Total**: ~30-50 minutes for first build

## 🆘 Troubleshooting

**Build fails?**
```bash
eas build:view [build-id]  # Check logs
```

**Not logged in?**
```bash
eas login
```

**Need to check status?**
```bash
eas build:list
eas submit:list
```

## 📚 Full Documentation

See `TESTFLIGHT_DEPLOYMENT.md` for detailed instructions.

---

**Ready?** Run:
```bash
./deploy-testflight.sh
```

Good luck! 🎉
