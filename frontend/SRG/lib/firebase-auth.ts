import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export class FirebaseAuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      console.log('🔐 Firebase sign in attempt:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase sign in successful:', result.user.uid);
      return result;
    } catch (error: any) {
      console.error('❌ Firebase sign in failed:', error.message);
      throw error;
    }
  }

  // Sign up with email and password
  static async signUp(email: string, password: string): Promise<UserCredential> {
    try {
      console.log('🔐 Firebase sign up attempt:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase sign up successful:', result.user.uid);
      return result;
    } catch (error: any) {
      console.error('❌ Firebase sign up failed:', error.message);
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      console.log('🔐 Firebase sign out');
      await signOut(auth);
      console.log('✅ Firebase sign out successful');
    } catch (error: any) {
      console.error('❌ Firebase sign out failed:', error.message);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Check if user is signed in
  static isSignedIn(): boolean {
    return !!auth.currentUser;
  }

  // Listen to auth state changes
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

  // Get user ID for storage keys
  static getUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.uid || null;
  }
}
