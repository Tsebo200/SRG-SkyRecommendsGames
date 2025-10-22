import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { GameQRData } from './qr-scanner';
import { HybridAuthService } from './hybrid-auth';

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

// Generate UUID for React Native compatibility
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class ScanHistoryService {
  private static readonly STORAGE_KEY = 'scan_history';
  private static readonly MAX_LOCAL_SCANS = 50;

  /**
   * Save scan with hybrid storage (Supabase + AsyncStorage fallback)
   */
  static async saveScan(scanData: GameQRData, scanType: 'qr_code' | 'barcode' | 'manual' = 'qr_code'): Promise<ScanHistoryItem> {
    try {
      console.log('💾 Saving scan with hybrid storage:', scanData);
      
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

      // Try Supabase first
      try {
        await this.saveToSupabase(scanItem);
        console.log('✅ Saved to Supabase');
      } catch (supabaseError) {
        console.warn('⚠️ Supabase save failed, using local storage:', supabaseError);
        await this.saveToLocalStorage(scanItem);
        console.log('✅ Saved to local storage as fallback');
      }

      // Always save to local storage as backup
      await this.saveToLocalStorage(scanItem);
      
      return scanItem;
    } catch (error) {
      console.error('❌ Failed to save scan:', error);
      throw error;
    }
  }

  /**
   * Get scans with hybrid loading (Supabase + AsyncStorage fallback)
   */
  static async getScans(): Promise<ScanHistoryItem[]> {
    try {
      console.log('📱 Loading scans with hybrid approach...');
      
      // Try Supabase first
      try {
        const supabaseScans = await this.getFromSupabase();
        if (supabaseScans.length > 0) {
          console.log('✅ Loaded from Supabase:', supabaseScans.length);
          return supabaseScans;
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase load failed, trying local storage:', supabaseError);
      }

      // Fallback to local storage
      const localScans = await this.getFromLocalStorage();
      console.log('✅ Loaded from local storage:', localScans.length);
      return localScans;
    } catch (error) {
      console.error('❌ Failed to load scans:', error);
      return [];
    }
  }

  /**
   * Save to Supabase
   */
  private static async saveToSupabase(scanItem: ScanHistoryItem): Promise<void> {
    const firebaseUser = HybridAuthService.getCurrentUser();
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    await HybridAuthService.syncUserToSupabase(firebaseUser);
    const supabaseUserId = await HybridAuthService.getSupabaseUserId();
    if (!supabaseUserId) {
      throw new Error('User not found in Supabase');
    }

    const { error } = await supabase
      .from('scan_history')
      .insert([{ ...scanItem, user_id: supabaseUserId }]);

    if (error) throw error;
  }

  /**
   * Get from Supabase
   */
  private static async getFromSupabase(): Promise<ScanHistoryItem[]> {
    const firebaseUser = HybridAuthService.getCurrentUser();
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    const supabaseUserId = await HybridAuthService.getSupabaseUserId();
    if (!supabaseUserId) {
      throw new Error('User not found in Supabase');
    }

    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  }

  /**
   * Save to local storage
   */
  private static async saveToLocalStorage(scanItem: ScanHistoryItem): Promise<void> {
    try {
      const existingScans = await this.getFromLocalStorage();
      const updatedScans = [scanItem, ...existingScans].slice(0, this.MAX_LOCAL_SCANS);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedScans));
    } catch (error) {
      console.error('❌ Failed to save to local storage:', error);
      throw error;
    }
  }

  /**
   * Get from local storage
   */
  private static async getFromLocalStorage(): Promise<ScanHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Failed to load from local storage:', error);
      return [];
    }
  }

  /**
   * Delete scan
   */
  static async deleteScan(scanId: string): Promise<void> {
    try {
      // Delete from both Supabase and local storage
      try {
        await this.deleteFromSupabase(scanId);
      } catch (error) {
        console.warn('⚠️ Supabase delete failed:', error);
      }

      await this.deleteFromLocalStorage(scanId);
      console.log('✅ Scan deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete scan:', error);
      throw error;
    }
  }

  /**
   * Clear all scans
   */
  static async clearAllScans(): Promise<void> {
    try {
      // Clear from both Supabase and local storage
      try {
        await this.clearFromSupabase();
      } catch (error) {
        console.warn('⚠️ Supabase clear failed:', error);
      }

      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ All scans cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear scans:', error);
      throw error;
    }
  }

  private static async deleteFromSupabase(scanId: string): Promise<void> {
    const supabaseUserId = await HybridAuthService.getSupabaseUserId();
    if (!supabaseUserId) return;

    const { error } = await supabase
      .from('scan_history')
      .delete()
      .eq('id', scanId)
      .eq('user_id', supabaseUserId);

    if (error) throw error;
  }

  private static async deleteFromLocalStorage(scanId: string): Promise<void> {
    const scans = await this.getFromLocalStorage();
    const updatedScans = scans.filter(scan => scan.id !== scanId);
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedScans));
  }

  private static async clearFromSupabase(): Promise<void> {
    const supabaseUserId = await HybridAuthService.getSupabaseUserId();
    if (!supabaseUserId) return;

    const { error } = await supabase
      .from('scan_history')
      .delete()
      .eq('user_id', supabaseUserId);

    if (error) throw error;
  }
}
