import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { supabase } from './supabase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export class HybridAuthService {
  // Sign in with Firebase
  static async signIn(email: string, password: string) {
    try {
      console.log('🔐 Firebase sign in attempt:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Sync user to Supabase if needed
      await this.syncUserToSupabase(result.user);
      
      console.log('✅ Firebase sign in successful:', result.user.uid);
      return result;
    } catch (error: any) {
      console.error('❌ Firebase sign in failed:', error.message);
      throw error;
    }
  }

  // Sign up with Firebase
  static async signUp(email: string, password: string) {
    try {
      console.log('🔐 Firebase sign up attempt:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Sync user to Supabase
      await this.syncUserToSupabase(result.user);
      
      console.log('✅ Firebase sign up successful:', result.user.uid);
      return result;
    } catch (error: any) {
      console.error('❌ Firebase sign up failed:', error.message);
      throw error;
    }
  }

  // Sign out from Firebase
  static async signOut() {
    try {
      console.log('🔐 Firebase sign out');
      await signOut(auth);
      console.log('✅ Firebase sign out successful');
    } catch (error: any) {
      console.error('❌ Firebase sign out failed:', error.message);
      throw error;
    }
  }

  // Get current Firebase user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Check if user is signed in
  static isSignedIn(): boolean {
    return !!auth.currentUser;
  }

  // Listen to Firebase auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // Convert Firebase User to our AuthUser interface
  static convertUser(user: User | null): AuthUser | null {
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
  }

  // Get user ID for Supabase operations
  static getUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.uid || null;
  }

  // Sync Firebase user to Supabase (for data operations)
  static async syncUserToSupabase(firebaseUser: User) {
    try {
      console.log('🔄 Syncing Firebase user to Supabase:', firebaseUser.uid);
      
      // Check if user exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error checking Supabase user:', fetchError.message);
        return;
      }

      if (!existingUser) {
        // Create user in Supabase
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email,
            display_name: firebaseUser.displayName,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error creating Supabase user:', insertError.message);
        } else {
          console.log('✅ User synced to Supabase');
        }
      } else {
        console.log('✅ User already exists in Supabase');
      }
    } catch (error) {
      console.error('❌ Error syncing user to Supabase:', error);
    }
  }

  // Get Supabase user ID from Firebase UID
  static async getSupabaseUserId(): Promise<string | null> {
    try {
      const firebaseUser = this.getCurrentUser();
      if (!firebaseUser) return null;

      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      if (error) {
        console.error('❌ Error getting Supabase user ID:', error.message);
        return null;
      }

      return user?.id || null;
    } catch (error) {
      console.error('❌ Error getting Supabase user ID:', error);
      return null;
    }
  }
}
