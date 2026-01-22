// Native Firebase Auth SDK for React Native
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { supabase } from './supabase';
import { supabaseService } from './supabase-service';

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
      const result = await auth().signInWithEmailAndPassword(email, password);
      
      // Sync user to Supabase if needed
      await this.syncUserToSupabase(result.user);
      
      console.log('✅ Firebase sign in successful:', result.user.uid);
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('❌ Firebase sign in failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sign up with Firebase
  static async signUp(email: string, password: string) {
    try {
      console.log('🔐 Firebase sign up attempt:', email);
      const result = await auth().createUserWithEmailAndPassword(email, password);
      
      // Sync user to Supabase
      await this.syncUserToSupabase(result.user);
      
      console.log('✅ Firebase sign up successful:', result.user.uid);
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('❌ Firebase sign up failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sign out from Firebase
  static async signOut() {
    try {
      console.log('🔐 Starting logout process...');
      
      // Get current user before signing out
      const currentUser = this.getCurrentUser();
      const userId = currentUser?.uid;
      
      // Sign out from Firebase
      console.log('🔄 Signing out from Firebase...');
      await auth().signOut();
      console.log('✅ Firebase sign out successful');
      
      // Notify Supabase about logout (for session management)
      if (userId) {
        try {
          console.log('🔄 Notifying Supabase of logout...');
          
          // Update user's last logout timestamp in Supabase
          const { error: updateError } = await supabaseService
            .from('users')
            .update({ 
              last_logout: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('firebase_uid', userId);
          
          if (updateError) {
            console.warn('⚠️ Failed to update logout timestamp in Supabase:', updateError.message);
          } else {
            console.log('📝 Logout timestamp updated in Supabase');
          }
        } catch (supabaseError) {
          console.warn('⚠️ Supabase logout notification failed (non-critical):', supabaseError);
        }
      }
      
      console.log('✅ Complete logout successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Logout failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get current Firebase user
  static getCurrentUser(): FirebaseAuthTypes.User | null {
    try {
      return auth().currentUser;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  // Check if user is signed in
  static isSignedIn(): boolean {
    try {
      return !!auth().currentUser;
    } catch (error) {
      console.error('❌ Error checking sign-in status:', error);
      return false;
    }
  }

  // Listen to Firebase auth state changes
  static onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void): () => void {
    try {
      return auth().onAuthStateChanged(callback);
    } catch (error) {
      console.error('❌ Error setting up auth state listener:', error);
      // Return a no-op unsubscribe function if Firebase isn't ready
      return () => {};
    }
  }

  // Convert Firebase User to our AuthUser interface
  static convertUser(user: FirebaseAuthTypes.User | null): AuthUser | null {
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null
    };
  }

  // Get user ID for Supabase operations
  static getUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.uid || null;
  }

  // Sync Firebase user to Supabase (for data operations)
  static async syncUserToSupabase(firebaseUser: FirebaseAuthTypes.User) {
    try {
      console.log('🔄 Syncing Firebase user to Supabase:', firebaseUser.uid);
      
      // Check if user exists in Supabase
      const { data: existingUser, error: fetchError } = await supabaseService
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
        const { error: insertError } = await supabaseService
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
