import { supabase } from './supabase';
import { GameQRData } from './qr-scanner';
import { HybridAuthService } from './hybrid-auth';

export interface ScanHistoryItem {
  id: string;
  user_id: string;
  scan_type: 'qr_code' | 'barcode' | 'manual';
  scan_data: GameQRData;
  scan_date: string;
  source: string;
  game_name?: string;
  game_id?: string;
  platform?: string;
  cover_art?: string;
  created_at: string;
  updated_at: string;
}

// Generate UUID for React Native compatibility
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class ScanHistoryService {
  /**
   * Save a scan to dedicated scan_history table
   */
  static async saveScan(scanData: GameQRData, scanType: 'qr_code' | 'barcode' | 'manual' = 'qr_code'): Promise<ScanHistoryItem | null> {
    try {
      console.log('💾 Saving scan to dedicated table:', scanData);
      
      // Get current Firebase user
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        console.warn('⚠️ User not authenticated, cannot save scan to history');
        return null;
      }

      // Check if Supabase is configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.log('ℹ️ Supabase not configured, skipping scan history save');
        return null;
      }

      // Ensure user is synced to Supabase first (gracefully handle errors)
      try {
      await HybridAuthService.syncUserToSupabase(firebaseUser);
      } catch (syncError: any) {
        if (syncError?.message?.includes('Network request failed') || syncError?.message?.includes('fetch')) {
          console.warn('⚠️ Network error syncing user (may be temporary):', syncError.message);
          return null;
        }
        // Re-throw non-network errors
        throw syncError;
      }

      // Get Supabase user ID (gracefully handle errors)
      const supabaseUserId = await HybridAuthService.getSupabaseUserId();
      if (!supabaseUserId) {
        console.warn('⚠️ User not found in Supabase, cannot save scan history');
        return null;
      }

      // Create scan item
      const scanItem: ScanHistoryItem = {
        id: generateUUID(),
        user_id: supabaseUserId,
        scan_type: scanType,
        scan_data: scanData,
        scan_date: new Date().toISOString(),
        source: scanData.source || 'QR Code',
        game_name: scanData.gameName || scanData.name,
        game_id: scanData.gameId || scanData.id,
        platform: scanData.platform,
        cover_art: scanData.coverArt || scanData.image_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert into dedicated scan_history table
      const { data, error } = await supabase
        .from('scan_history')
        .insert([scanItem])
        .select()
        .single();

      if (error) {
        // Handle network errors gracefully
        if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
          console.warn('⚠️ Network error saving scan (may be temporary):', error.message);
          return null;
        }
        console.error('❌ Error saving scan:', error);
        // Don't throw - return null to allow scan to continue
        return null;
      }

      console.log('✅ Scan saved successfully:', data);
      return data;
    } catch (error: any) {
      // Handle network errors gracefully - don't block scanning
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn('⚠️ Network error in saveScan (may be temporary):', error.message);
        return null;
      }
      console.error('❌ Failed to save scan:', error);
      // Return null instead of throwing to allow scan to continue
      return null;
    }
  }

  /**
   * Get all scans for the current user
   */
  static async getScans(): Promise<ScanHistoryItem[]> {
    try {
      // Removed verbose log - caller can log if needed
      
      // Get current Firebase user
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        return [];
      }

      // Check if Supabase is configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        return [];
      }

      // Get Supabase user ID (gracefully handle errors)
      const supabaseUserId = await HybridAuthService.getSupabaseUserId();
      if (!supabaseUserId) {
        return [];
      }

      // Fetch scans from dedicated table
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // Handle network errors gracefully
        if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
          console.warn('⚠️ Network error loading scans (may be temporary):', error.message);
          return []; // Return empty array instead of throwing
        }
        console.error('❌ Error fetching scans:', error);
        return []; // Return empty array instead of throwing
      }

      // Removed verbose log - only log if there's an actual change
      return data || [];
    } catch (error: any) {
      // Handle network errors gracefully - return empty array
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn('⚠️ Network error in getScans (may be temporary):', error.message);
        return [];
      }
      console.error('❌ Failed to load scans:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Delete a specific scan
   */
  static async deleteScan(scanId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting scan:', scanId);
      
      // Get current Firebase user
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        console.warn('⚠️ User not authenticated, cannot delete scan');
        return false;
      }

      // Check if Supabase is configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.log('ℹ️ Supabase not configured, cannot delete scan');
        return false;
      }

      // Get Supabase user ID
      const supabaseUserId = await HybridAuthService.getSupabaseUserId();
      if (!supabaseUserId) {
        console.warn('⚠️ User not found in Supabase, cannot delete scan');
        return false;
      }

      // Delete from dedicated table
      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('id', scanId)
        .eq('user_id', supabaseUserId);

      if (error) {
        // Handle network errors gracefully
        if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
          console.warn('⚠️ Network error deleting scan (may be temporary):', error.message);
          return false;
        }
        console.error('❌ Error deleting scan:', error);
        return false;
      }

      console.log('✅ Scan deleted successfully');
      return true;
    } catch (error: any) {
      // Handle network errors gracefully
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn('⚠️ Network error in deleteScan (may be temporary):', error.message);
        return false;
      }
      console.error('❌ Failed to delete scan:', error);
      return false;
    }
  }

  /**
   * Clear all scans for the current user
   */
  static async clearAllScans(): Promise<boolean> {
    try {
      console.log('🧹 Clearing all scans...');
      
      // Get current Firebase user
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        console.warn('⚠️ User not authenticated, cannot clear scans');
        return false;
      }

      // Check if Supabase is configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.log('ℹ️ Supabase not configured, cannot clear scans');
        return false;
      }

      // Get Supabase user ID
      const supabaseUserId = await HybridAuthService.getSupabaseUserId();
      if (!supabaseUserId) {
        console.warn('⚠️ User not found in Supabase, cannot clear scans');
        return false;
      }

      // Delete all scans from dedicated table
      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('user_id', supabaseUserId);

      if (error) {
        // Handle network errors gracefully
        if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
          console.warn('⚠️ Network error clearing scans (may be temporary):', error.message);
          return false;
        }
        console.error('❌ Error clearing scans:', error);
        return false;
      }

      console.log('✅ All scans cleared successfully');
      return true;
    } catch (error: any) {
      // Handle network errors gracefully
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn('⚠️ Network error in clearAllScans (may be temporary):', error.message);
        return false;
      }
      console.error('❌ Failed to clear scans:', error);
      return false;
    }
  }
}
