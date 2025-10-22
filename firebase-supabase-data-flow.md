# Firebase + Supabase Data Flow

## 🔄 How Firebase Authentication Connects to Supabase Data

### **Step 1: User Signs In with Firebase**
```typescript
// User signs in with Firebase
const result = await FirebaseAuthService.signIn(email, password);
// Firebase UID: "firebase_user_123"
```

### **Step 2: Create User Mapping in Supabase**
```sql
-- Supabase creates a user record with Firebase UID
INSERT INTO users (firebase_uid, email, display_name) 
VALUES ('firebase_user_123', 'user@example.com', 'John Doe');
-- Supabase User ID: "supabase_user_456"
```

### **Step 3: User Adds Favourite Game**
```typescript
// User adds a game to favourites
await HybridFavouritesService.addFavourite(
  'game_789', 
  'Cyberpunk 2077', 
  'cyberpunk-2077'
);
```

### **Step 4: Data is Stored in Supabase**
```sql
-- Favourite is stored with Supabase user ID
INSERT INTO favourites (user_id, game_id) 
VALUES ('supabase_user_456', 'game_789');
```

### **Step 5: User Views Favourites**
```typescript
// App fetches favourites using Firebase UID → Supabase User ID mapping
const favourites = await HybridFavouritesService.getFavourites();
```

## 🗄️ Database Schema

### **Users Table (Firebase → Supabase Mapping)**
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,           -- Supabase user ID
  firebase_uid text UNIQUE,       -- Firebase UID
  email text,                     -- User email
  display_name text,              -- User display name
  created_at timestamptz
);
```

### **Favourites Table (User Data)**
```sql
CREATE TABLE favourites (
  user_id uuid REFERENCES users(id),  -- Links to Supabase user
  game_id uuid REFERENCES games(id), -- Links to game
  created_at timestamptz
);
```

## 🔐 Row Level Security (RLS)

### **Users Table RLS**
```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = firebase_uid);
```

### **Favourites Table RLS**
```sql
-- Users can only see their own favourites
CREATE POLICY "Users can manage own favourites" ON favourites
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users 
      WHERE firebase_uid = auth.uid()::text
    )
  );
```

## 📱 Complete Data Flow Example

### **1. User Authentication**
```typescript
// Firebase handles authentication
const firebaseUser = await FirebaseAuthService.signIn(email, password);
// Firebase UID: "firebase_abc123"
```

### **2. User Mapping Creation**
```typescript
// Create mapping in Supabase
const supabaseUserId = await UserMappingService.createUserMapping();
// Supabase User ID: "supabase_def456"
```

### **3. Add Favourite**
```typescript
// Add game to favourites
await HybridFavouritesService.addFavourite(
  'game_789',
  'The Witcher 3',
  'the-witcher-3'
);
```

### **4. Database Storage**
```sql
-- Game is stored in favourites table
INSERT INTO favourites (user_id, game_id, created_at)
VALUES ('supabase_def456', 'game_789', NOW());
```

### **5. Retrieve Favourites**
```typescript
// Get user's favourites
const favourites = await HybridFavouritesService.getFavourites();
// Returns: [{ game_name: 'The Witcher 3', game_slug: 'the-witcher-3', ... }]
```

## 🎯 Key Benefits

1. **Firebase Authentication**: Superior persistence and offline support
2. **Supabase Database**: Powerful querying and real-time features
3. **User Mapping**: Seamless connection between auth and data
4. **RLS Security**: Users can only access their own data
5. **Local Storage**: Offline support with AsyncStorage backup

## 🔧 Implementation Files

- `lib/firebase.ts` - Firebase configuration
- `lib/hybrid-auth.ts` - Firebase authentication service
- `lib/user-mapping.ts` - Firebase ↔ Supabase user mapping
- `lib/favourites-hybrid.ts` - Favourites with hybrid persistence
- `update-supabase-for-firebase.sql` - Database schema updates

## 🚀 Result

Users get:
- ✅ **Firebase authentication** with perfect persistence
- ✅ **Supabase database** for favourites data
- ✅ **Seamless user experience** with no login screen flash
- ✅ **Offline support** with local storage backup
- ✅ **Secure data access** with RLS policies
