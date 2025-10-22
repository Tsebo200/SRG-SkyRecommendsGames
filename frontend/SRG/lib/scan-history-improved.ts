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
  static async saveScan(scanData: GameQRData, scanType: 'qr_code' | 'barcode' | 'manual' = 'qr_code'): Promise<ScanHistoryItem> {
    try {
      console.log('💾 Saving scan to dedicated table:', scanData);
      
      // Get current Firebase user
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Ensure user is synced to Supabase first
      await HybridAuthService.syncUserToSupabase(firebaseUser);

      // Get Supabase user ID
      const supabaseUserId = await HybridAuthService.getSupabaseUserId();
      if (!supabaseUserId) {
        throw new Error('User not found in Supabase after sync');
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
        console.error('❌ Error saving scan:', error);
        throw error;
      }

      console.log('✅ Scan saved successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to save scan:', error);
      throw error;
    }
  }

  /**
   * Get all scans for the current user
   */
  static async getScans(): Promise<ScanHistoryItem[]> {
    try {
      console.log('📱 Loading scan history from dedicated table...');
      
      // Get current Firebase user
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Get Supabase user ID
      const supabaseUserId = await HybridAuthService.getSupabaseUserId();
      if (!supabaseUserId) {
        throw new Error('User not found in Supabase');
      }

      // Fetch scans from dedicated table
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error fetching scans:', error);
        throw error;
      }

      console.log('✅ Loaded scans:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to load scans:', error);
      throw error;
    }
  }

  /**
   * Delete a specific scan
   */
  static async deleteScan(scanId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting scan:', scanId);
      
      // Get current Firebase user
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Get Supabase user ID
      const supabaseUserId = await HybridAuthService.getSupabaseUserId();
      if (!supabaseUserId) {
        throw new Error('User not found in Supabase');
      }

      // Delete from dedicated table
      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('id', scanId)
        .eq('user_id', supabaseUserId);

      if (error) {
        console.error('❌ Error deleting scan:', error);
        throw error;
      }

      console.log('✅ Scan deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete scan:', error);
      throw error;
    }
  }

  /**
   * Clear all scans for the current user
   */
  static async clearAllScans(): Promise<void> {
    try {
      console.log('🧹 Clearing all scans...');
      
      // Get current Firebase user
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Get Supabase user ID
      const supabaseUserId = await HybridAuthService.getSupabaseUserId();
      if (!supabaseUserId) {
        throw new Error('User not found in Supabase');
      }

      // Delete all scans from dedicated table
      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('user_id', supabaseUserId);

      if (error) {
        console.error('❌ Error clearing scans:', error);
        throw error;
      }

      console.log('✅ All scans cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear scans:', error);
      throw error;
    }
  }
}
