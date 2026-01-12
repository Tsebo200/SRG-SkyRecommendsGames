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

      // Check if Supabase is configured before making requests
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.log('ℹ️ Supabase not configured, cannot create user mapping');
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

      // Handle network errors gracefully
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Not found - continue to create
        } else if (fetchError.message?.includes('Network request failed') || fetchError.message?.includes('fetch')) {
          console.warn('⚠️ Network error checking existing user (may be temporary):', fetchError.message);
          return null;
        } else {
          console.error('❌ Error checking existing user:', fetchError.message);
          return null;
        }
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
            // Handle network errors in race condition fetch
            if (raceError.message?.includes('Network request failed') || raceError.message?.includes('fetch')) {
              console.warn('⚠️ Network error fetching user after race condition (may be temporary):', raceError.message);
            } else {
              console.error('❌ Error fetching user after race condition:', raceError.message);
            }
          }
        } else {
          // Handle network errors gracefully
          if (insertError.message?.includes('Network request failed') || insertError.message?.includes('fetch')) {
            console.warn('⚠️ Network error creating user mapping (may be temporary):', insertError.message);
          } else {
            console.error('❌ Error creating user mapping:', insertError.message);
          }
        }
        return null;
      }

      console.log('✅ User mapping created:', newUser.id);
      return newUser.id;

    } catch (error: any) {
      // Handle network errors gracefully - don't block app functionality
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn('⚠️ Network error in createUserMapping (may be temporary):', error.message);
        return null;
      }
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

      // Check if Supabase is configured before making requests
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.log('ℹ️ Supabase not configured, skipping user ID lookup');
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
          // Only try to create mapping if Supabase is available
          return await this.createUserMapping();
        }
        
        // Handle network errors gracefully - don't treat as critical
        if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
          console.warn('⚠️ Network error getting Supabase user ID (may be temporary):', error.message);
          return null;
        }
        
        console.error('❌ Error getting Supabase user ID:', error.message);
        return null;
      }

      console.log('✅ Found Supabase user ID:', user.id);
      return user.id;

    } catch (error: any) {
      // Handle network errors gracefully - don't block navigation
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn('⚠️ Network error in getSupabaseUserId (may be temporary):', error.message);
        return null;
      }
      console.error('❌ Error in getSupabaseUserId:', error);
      return null;
    }
  }

  // Ensure user mapping exists (call this after Firebase sign in)
  static async ensureUserMapping(): Promise<boolean> {
    try {
      // Check if Supabase is configured first
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.log('ℹ️ Supabase not configured, skipping user mapping');
        return false; // Return false but don't treat as error
      }

      const supabaseUserId = await this.getSupabaseUserId();
      return !!supabaseUserId;
    } catch (error: any) {
      // Handle network errors gracefully - don't block app functionality
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn('⚠️ Network error ensuring user mapping (may be temporary):', error.message);
        return false; // Return false but don't treat as critical error
      }
      console.error('❌ Error ensuring user mapping:', error);
      return false;
    }
  }

  // Get user profile from Supabase
  static async getUserProfile(): Promise<UserMapping | null> {
    try {
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        console.log('⚠️ No Firebase user for getUserProfile');
        return null;
      }

      // Check if Supabase is configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase not configured, skipping getUserProfile');
        return null;
      }

      console.log('🔄 Fetching user profile for Firebase UID:', firebaseUser.uid);

      const { data: user, error } = await supabaseService
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      if (error) {
        // Don't log network errors as critical - they might be temporary
        if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
          console.warn('⚠️ Network error getting user profile (may be temporary):', error.message);
        } else {
          console.error('❌ Error getting user profile:', error.message);
        }
        return null;
      }

      if (user) {
        console.log('✅ User profile retrieved successfully');
      }

      return user;
    } catch (error: any) {
      // Handle network errors gracefully
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn('⚠️ Network error in getUserProfile (may be temporary):', error.message);
      } else {
        console.error('❌ Error in getUserProfile:', error);
      }
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
