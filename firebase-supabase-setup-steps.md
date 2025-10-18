# Firebase + Supabase Setup Steps

## 🗄️ Step 1: Update Supabase Database

### **Go to Supabase Dashboard:**
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `SRG-SkyRecommendsGames`
3. Go to **SQL Editor** (left sidebar)
4. Click **"New Query"**

### **Run the SQL Script:**
Copy and paste the entire contents of `update-supabase-for-firebase.sql` and run it.

**Expected Result:**
```
Database updated for Firebase authentication!
```

## 🔥 Step 2: Configure Firebase

### **Create Firebase Project:**
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Name it: `SRG-SkyRecommendsGames`
4. Enable Google Analytics (optional)
5. Click **"Create project"**

### **Add Firebase to Web App:**
1. In Firebase Console, click **"Add app"** → **Web** (</> icon)
2. App nickname: `SRG-ReactNative`
3. **Don't check** "Also set up Firebase Hosting"
4. Click **"Register app"**
5. Copy the Firebase config object

### **Enable Authentication:**
1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"**
5. Click **"Save"**

## 📱 Step 3: Update App Configuration

### **Add Firebase Config:**
Create `frontend/SRG/.env` with your Firebase config:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Keep existing Supabase config
EXPO_PUBLIC_SUPABASE_URL=https://fwqzmyrjhajpukhqdfrh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🔄 Step 4: Test the Integration

### **Run the App:**
```bash
cd frontend/SRG
npm start
```

### **Test Flow:**
1. **Sign in** with Firebase (should persist across app restarts)
2. **Add a favourite** game
3. **Check Supabase** - should see user mapping and favourite
4. **Close and reopen app** - should stay logged in
5. **Favourites should persist** from both Firebase auth and Supabase data

## ✅ Expected Results

- ✅ **No login screen flash** on app start
- ✅ **Favourites persist** across app restarts
- ✅ **User data stored** in Supabase with Firebase UID mapping
- ✅ **Offline support** with local storage backup
- ✅ **Secure data access** with RLS policies

## 🛠️ Troubleshooting

### **If Firebase auth fails:**
- Check Firebase config in `.env`
- Verify Firebase project settings
- Check console for authentication errors

### **If Supabase data fails:**
- Verify SQL script ran successfully
- Check RLS policies in Supabase dashboard
- Verify user mapping table exists

### **If app crashes:**
- Check Firebase SDK installation
- Verify all environment variables
- Check console for import errors
