# Set Up Environment Variables for EAS Build

Run these commands one by one in your terminal. Each will prompt you to enter the value.

## Commands to Run

```bash
cd frontend/SRG

# Backend URL (use a placeholder for now: https://your-backend-url.com)
eas env:create --name EXPO_PUBLIC_BACKEND_URL --scope project

# Supabase
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --scope project
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --scope project

# Firebase
eas env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_APP_ID --scope project

# Google Cloud Speech (optional)
eas env:create --name EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY --scope project
```

## Values from Your .env File

When prompted, use these values from your `.env` file:

- **EXPO_PUBLIC_BACKEND_URL**: `https://your-backend-url.com` (placeholder - update after deploying backend)
- **EXPO_PUBLIC_SUPABASE_URL**: `https://fwqzmyrjhajpukhqdfrh.supabase.co`
- **EXPO_PUBLIC_SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDE3OTIsImV4cCI6MjA3NjA3Nzc5Mn0.EyPG_-S0JF64iV6dK0ZJ5I_YOZPI38bgvHYv9xzwmkg`
- **EXPO_PUBLIC_FIREBASE_API_KEY**: `AIzaSyD82vrd5UWee7bP-fSCxy3HM7X9T7T4zHA`
- **EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN**: `skyscansgames.firebaseapp.com`
- **EXPO_PUBLIC_FIREBASE_PROJECT_ID**: `skyscansgames`
- **EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET**: `skyscansgames.appspot.com`
- **EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**: `123456789`
- **EXPO_PUBLIC_FIREBASE_APP_ID**: `1:123456789:web:abcdef123456`
- **EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY**: `AIzaSyBLc7dbbF2sudVb-HaW9SdpRmI1C0As2q4`

## After Setting Variables

Once all variables are set, verify with:
```bash
eas env:list
```

Then proceed with the build!



