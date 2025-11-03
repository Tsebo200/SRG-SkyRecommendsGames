import { supabase } from './supabase';
import { supabaseService } from './supabase-service';
import { HybridAuthService } from './hybrid-auth';

export interface UserMapping {
  id: string;
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
}

export class UserMappingService {
  // Create or get user mapping between Firebase and Supabase
  static async createUserMapping(): Promise<string | null> {
    try {
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        console.log('⚠️ No Firebase user, cannot create mapping');
        return null;
      }

      console.log('🔄 Creating user mapping for Firebase UID:', firebaseUser.uid);

      // Check if user already exists using service role (bypasses RLS)
      const { data: existingUser, error: fetchError } = await supabaseService
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUser.uid)
        .maybeSingle();

      // If user already exists, return the existing ID
      if (existingUser) {
        console.log('✅ User mapping already exists:', existingUser.id);
        return existingUser.id;
      }

      // Handle error only if it's not a "not found" error
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error checking existing user:', fetchError.message);
        return null;
      }

      // Create new user mapping using service role (bypasses RLS)
      const { data: newUser, error: insertError } = await supabaseService
        .from('users')
        .insert({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          display_name: firebaseUser.displayName,
        })
        .select('id')
        .single();

      // Handle duplicate key error - user was created between check and insert
      if (insertError) {
        if (insertError.code === '23505' || insertError.message.includes('duplicate key')) {
          console.log('⚠️ User already exists (race condition), fetching existing user...');
          // Try to get the existing user again
          const { data: existingUserAfterRace, error: raceError } = await supabaseService
            .from('users')
            .select('id')
            .eq('firebase_uid', firebaseUser.uid)
            .single();
          
          if (existingUserAfterRace) {
            console.log('✅ Found existing user after race condition:', existingUserAfterRace.id);
            return existingUserAfterRace.id;
          }
          
          if (raceError) {
            console.error('❌ Error fetching user after race condition:', raceError.message);
          }
        } else {
          console.error('❌ Error creating user mapping:', insertError.message);
        }
        return null;
      }

      console.log('✅ User mapping created:', newUser.id);
      return newUser.id;

    } catch (error) {
      console.error('❌ Error in createUserMapping:', error);
      return null;
    }
  }

  // Get Supabase user ID from Firebase UID
  static async getSupabaseUserId(): Promise<string | null> {
    try {
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        console.log('⚠️ No Firebase user');
        return null;
      }

      console.log('🔍 Getting Supabase user ID for Firebase UID:', firebaseUser.uid);

      const { data: user, error } = await supabaseService
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ User mapping not found, creating new one...');
          return await this.createUserMapping();
        }
        console.error('❌ Error getting Supabase user ID:', error.message);
        return null;
      }

      console.log('✅ Found Supabase user ID:', user.id);
      return user.id;

    } catch (error) {
      console.error('❌ Error in getSupabaseUserId:', error);
      return null;
    }
  }

  // Ensure user mapping exists (call this after Firebase sign in)
  static async ensureUserMapping(): Promise<boolean> {
    try {
      const supabaseUserId = await this.getSupabaseUserId();
      return !!supabaseUserId;
    } catch (error) {
      console.error('❌ Error ensuring user mapping:', error);
      return false;
    }
  }

  // Get user profile from Supabase
  static async getUserProfile(): Promise<UserMapping | null> {
    try {
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) return null;

      const { data: user, error } = await supabaseService
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      if (error) {
        console.error('❌ Error getting user profile:', error.message);
        return null;
      }

      return user;
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error);
      return null;
    }
  }

  // Update user profile in Supabase
  static async updateUserProfile(updates: Partial<UserMapping>): Promise<boolean> {
    try {
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) return false;

      const { error } = await supabaseService
        .from('users')
        .update(updates)
        .eq('firebase_uid', firebaseUser.uid);

      if (error) {
        console.error('❌ Error updating user profile:', error.message);
        return false;
      }

      console.log('✅ User profile updated');
      return true;
    } catch (error) {
      console.error('❌ Error in updateUserProfile:', error);
      return false;
    }
  }
}
