import { supabase } from './supabase';
import { GameQRData } from './qr-scanner';
import { HybridAuthService } from './hybrid-auth';

// Generate UUID for React Native compatibility
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface ScanHistoryItem {
  id: string;
  scan_type: 'qr_code' | 'barcode' | 'manual';
  scan_data: GameQRData;
  scan_date: string;
  source: string;
  game_name?: string;
  game_id?: string;
  platform?: string;
  cover_art?: string;
  created_at: string;
}

export class ScanHistoryService {
  /**
   * Save a scan to Supabase
   */
  static async saveScan(scanData: GameQRData, scanType: 'qr_code' | 'barcode' | 'manual' = 'qr_code'): Promise<ScanHistoryItem> {
    try {
      console.log('💾 Saving scan to Supabase:', scanData);
      
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
        scan_type: scanType,
        scan_data: scanData,
        scan_date: new Date().toISOString(),
        source: scanData.source || 'QR Code',
        game_name: scanData.gameName || scanData.name,
        game_id: scanData.gameId || scanData.id,
        platform: scanData.platform,
        cover_art: scanData.coverArt || scanData.image_url,
        created_at: new Date().toISOString(),
      };

      // Get current scan history
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('scan_history')
        .eq('id', supabaseUserId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching user scan history:', fetchError);
        throw fetchError;
      }

      // Add new scan to history
      const currentHistory = userData.scan_history || [];
      const updatedHistory = [scanItem, ...currentHistory].slice(0, 100); // Keep last 100 scans

      // Update user's scan history
      const { error: updateError } = await supabase
        .from('users')
        .update({ scan_history: updatedHistory })
        .eq('id', supabaseUserId);

      if (updateError) {
        console.error('❌ Error updating scan history:', updateError);
        throw updateError;
      }

      console.log('✅ Scan saved successfully:', scanItem);
      return scanItem;
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
      console.log('📱 Loading scan history from Supabase...');
      
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

      const { data, error } = await supabase
        .from('users')
        .select('scan_history')
        .eq('id', supabaseUserId)
        .single();

      if (error) {
        console.error('❌ Error loading scans:', error);
        throw error;
      }

      const scanHistory = data?.scan_history || [];
      console.log('✅ Loaded', scanHistory.length, 'scans from Supabase');
      return scanHistory;
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

      // Ensure user is synced to Supabase first
      await HybridAuthService.syncUserToSupabase(firebaseUser);

      // Get Supabase user ID
      const supabaseUserId = await HybridAuthService.getSupabaseUserId();
      if (!supabaseUserId) {
        throw new Error('User not found in Supabase after sync');
      }

      // Get current scan history
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('scan_history')
        .eq('id', supabaseUserId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching user scan history:', fetchError);
        throw fetchError;
      }

      // Remove scan from history
      const currentHistory = userData.scan_history || [];
      const updatedHistory = currentHistory.filter((scan: ScanHistoryItem) => scan.id !== scanId);

      // Update user's scan history
      const { error: updateError } = await supabase
        .from('users')
        .update({ scan_history: updatedHistory })
        .eq('id', supabaseUserId);

      if (updateError) {
        console.error('❌ Error updating scan history:', updateError);
        throw updateError;
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
      console.log('🗑️ Clearing all scans...');
      
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

      // Clear scan history
      const { error } = await supabase
        .from('users')
        .update({ scan_history: [] })
        .eq('id', supabaseUserId);

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

  /**
   * Get scan statistics
   */
  static async getScanStats(): Promise<{
    totalScans: number;
    scansByType: Record<string, number>;
    recentScans: number;
  }> {
    try {
      const scans = await this.getScans();
      
      const totalScans = scans.length;
      const scansByType = scans.reduce((acc, scan) => {
        acc[scan.scan_type] = (acc[scan.scan_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Recent scans (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentScans = scans.filter(scan => 
        new Date(scan.created_at) > weekAgo
      ).length;

      return {
        totalScans,
        scansByType,
        recentScans
      };
    } catch (error) {
      console.error('❌ Failed to get scan stats:', error);
      return {
        totalScans: 0,
        scansByType: {},
        recentScans: 0
      };
    }
  }
}
