import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { HybridAuthService } from './hybrid-auth';
import { UserMappingService } from './user-mapping';

export interface FavouriteGame {
  user_id: string;
  game_id: string;
  created_at: string;
  // Joined game data
  game_name?: string;
  game_slug?: string;
  game_image?: string;
  platforms?: string[];
  genres?: string[];
}

export interface LocalFavourite {
  game_id: string;
  game_name: string;
  game_slug: string;
  game_image?: string;
  platforms?: string[];
  genres?: string[];
  added_at: string;
}

const FAVOURITES_STORAGE_KEY = 'user_favourites';
const SYNC_STATUS_KEY = 'favourites_sync_status';

export class HybridFavouritesService {
  // Get user's ID for storage keys (from Firebase)
  private static async getUserId(): Promise<string | null> {
    try {
      return HybridAuthService.getUserId();
    } catch (error) {
      console.log('🔍 Auth error in getUserId:', error);
      return null;
    }
  }

  // Get Supabase user ID for database operations
  private static async getSupabaseUserId(): Promise<string | null> {
    try {
      return await UserMappingService.getSupabaseUserId();
    } catch (error) {
      console.log('🔍 Supabase user ID error:', error);
      return null;
    }
  }

  // Get storage key for current user
  private static async getStorageKey(): Promise<string> {
    const userId = await this.getUserId();
    return userId ? `${FAVOURITES_STORAGE_KEY}_${userId}` : FAVOURITES_STORAGE_KEY;
  }

  // Save favourites to local storage
  private static async saveToLocalStorage(favourites: LocalFavourite[]): Promise<void> {
    try {
      const storageKey = await this.getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(favourites));
      console.log('💾 Saved favourites to local storage:', favourites.length, 'items');
    } catch (error) {
      console.error('❌ Failed to save favourites to local storage:', error);
    }
  }

  // Load favourites from local storage
  private static async loadFromLocalStorage(): Promise<LocalFavourite[]> {
    try {
      const storageKey = await this.getStorageKey();
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const favourites = JSON.parse(stored);
        console.log('📱 Loaded favourites from local storage:', favourites.length, 'items');
        return favourites;
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to load favourites from local storage:', error);
      return [];
    }
  }

  // Sync local favourites with Supabase
  private static async syncWithSupabase(): Promise<void> {
    try {
      const supabaseUserId = await this.getSupabaseUserId();
      if (!supabaseUserId) {
        console.log('⚠️ No Supabase user ID, skipping sync');
        return;
      }

      console.log('🔄 Syncing favourites with Supabase...');
      
      // Get local favourites
      const localFavourites = await this.loadFromLocalStorage();
      
      // Get Supabase favourites
      const { data: supabaseFavourites, error } = await supabase
        .from('favourites')
        .select(`
          user_id,
          game_id,
          created_at,
          games!inner(
            name,
            slug,
            platforms,
            genres
          )
        `)
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('❌ Failed to fetch Supabase favourites:', error.message);
        return;
      }

      // Convert Supabase favourites to local format
      const supabaseLocal = supabaseFavourites?.map((fav: any) => ({
        game_id: fav.game_id,
        game_name: fav.games?.name,
        game_slug: fav.games?.slug,
        platforms: fav.games?.platforms,
        genres: fav.games?.genres,
        added_at: fav.created_at
      })) || [];

      // Merge local and Supabase favourites (Supabase takes precedence)
      const mergedFavourites = [...supabaseLocal];
      
      // Add any local favourites that aren't in Supabase (by game_slug to avoid duplicates)
      for (const local of localFavourites) {
        const exists = supabaseLocal.some(sup => sup.game_slug === local.game_slug);
        if (!exists) {
          mergedFavourites.push(local);
        }
      }

      // Deduplicate by game_slug to prevent duplicates
      const deduplicatedFavourites = mergedFavourites.reduce((acc: LocalFavourite[], current) => {
        const exists = acc.some(fav => fav.game_slug === current.game_slug);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      // Save deduplicated favourites to local storage
      await this.saveToLocalStorage(deduplicatedFavourites);
      
      console.log('✅ Favourites synced and deduplicated successfully');
    } catch (error) {
      console.error('❌ Failed to sync favourites:', error);
    }
  }

  // Add a game to favourites (with local storage backup)
  static async addFavorite(gameId: string, gameName: string, gameSlug: string, gameImage?: string): Promise<void> {
    console.log('🔍 Adding favourite with hybrid persistence...');
    
    // First, add to local storage immediately
    const localFavourite: LocalFavourite = {
      game_id: gameId,
      game_name: gameName,
      game_slug: gameSlug,
      game_image: gameImage,
      added_at: new Date().toISOString()
    };

    try {
      // Add to local storage first
      const currentFavourites = await this.loadFromLocalStorage();
      const updatedFavourites = [...currentFavourites, localFavourite];
      await this.saveToLocalStorage(updatedFavourites);
      console.log('✅ Added to local storage');

      // Try to sync with Supabase
      const supabaseUserId = await this.getSupabaseUserId();
      if (supabaseUserId) {
        try {
          // Ensure the game exists in Supabase
          const { data: existingGame, error: fetchError } = await supabase
            .from('games')
            .select('id')
            .eq('slug', gameSlug)
            .single();

          let actualGameId: string;

          if (fetchError && fetchError.code === 'PGRST116') {
            // Game doesn't exist, create it
            const { data: newGame, error: insertError } = await supabase
              .from('games')
              .insert({
                slug: gameSlug,
                name: gameName,
                platforms: [],
                genres: [],
                store_urls: {},
                rubric: {},
                embedding: null
              })
              .select('id')
              .single();

            if (insertError) throw insertError;
            actualGameId = newGame.id;
          } else if (fetchError) {
            throw fetchError;
          } else {
            actualGameId = existingGame.id;
          }

          // Add to Supabase favourites using Supabase user ID
          const { error } = await supabase
            .from('favourites')
            .insert({
              user_id: supabaseUserId, // Use Supabase user ID
              game_id: actualGameId,
            });

          if (error) {
            console.log('⚠️ Failed to sync with Supabase, but saved locally:', error.message);
          } else {
            console.log('✅ Synced with Supabase');
          }
        } catch (error) {
          console.log('⚠️ Supabase sync failed, but saved locally:', error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to add favourite:', error);
      throw error;
    }
  }

  // Remove a game from favourites (with local storage backup)
  static async removeFavorite(gameSlug: string): Promise<void> {
    console.log('🔍 Removing favourite with hybrid persistence...');
    
    try {
      // Remove from local storage first
      const currentFavourites = await this.loadFromLocalStorage();
      const updatedFavourites = currentFavourites.filter(fav => fav.game_slug !== gameSlug);
      await this.saveToLocalStorage(updatedFavourites);
      console.log('✅ Removed from local storage');

      // Try to sync with Supabase
      const supabaseUserId = await this.getSupabaseUserId();
      if (supabaseUserId) {
        try {
          const { data: game, error: fetchError } = await supabase
            .from('games')
            .select('id')
            .eq('slug', gameSlug)
            .single();

          if (fetchError) {
            console.log('⚠️ Game not found in Supabase, but removed locally');
            return;
          }

          const { error } = await supabase
            .from('favourites')
            .delete()
            .eq('game_id', game.id)
            .eq('user_id', supabaseUserId); // Use Supabase user ID

          if (error) {
            console.log('⚠️ Failed to sync removal with Supabase, but removed locally:', error.message);
          } else {
            console.log('✅ Synced removal with Supabase');
          }
        } catch (error) {
          console.log('⚠️ Supabase sync failed, but removed locally:', error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to remove favourite:', error);
      throw error;
    }
  }

  // Get user's favourite games (from local storage with Supabase sync)
  static async getFavorites(): Promise<FavouriteGame[]> {
    console.log('🔍 Getting favourites with hybrid persistence...');
    
    try {
      // First, try to sync with Supabase
      await this.syncWithSupabase();
      
      // Load from local storage
      const localFavourites = await this.loadFromLocalStorage();
      
      // Convert to FavouriteGame format and deduplicate
      const favourites: FavouriteGame[] = localFavourites
        .reduce((acc: LocalFavourite[], current) => {
          const exists = acc.some(fav => fav.game_slug === current.game_slug);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, [])
        .map(fav => ({
          user_id: '', // Will be filled by auth
          game_id: fav.game_id,
          created_at: fav.added_at,
          game_name: fav.game_name,
          game_slug: fav.game_slug,
          game_image: fav.game_image,
          platforms: fav.platforms,
          genres: fav.genres
        }));

      console.log('✅ Loaded favourites (hybrid, deduplicated):', favourites.length, 'items');
      return favourites;
    } catch (error) {
      console.error('❌ Failed to get favourites:', error);
      // Return local favourites even if sync fails
      const localFavourites = await this.loadFromLocalStorage();
      return localFavourites.map(fav => ({
        user_id: '',
        game_id: fav.game_id,
        created_at: fav.added_at,
        game_name: fav.game_name,
        game_slug: fav.game_slug,
        game_image: fav.game_image,
        platforms: fav.platforms,
        genres: fav.genres
      }));
    }
  }

  // Check if a game is favourited (from local storage)
  static async isFavorited(gameSlug: string): Promise<boolean> {
    try {
      const localFavourites = await this.loadFromLocalStorage();
      return localFavourites.some(fav => fav.game_slug === gameSlug);
    } catch (error) {
      console.error('❌ Failed to check favourite status:', error);
      return false;
    }
  }

  // Toggle favorite status (with persistence)
  static async toggleFavorite(gameId: string, gameName: string, gameSlug: string, gameImage?: string): Promise<boolean> {
    const isFavorited = await this.isFavorited(gameSlug);
    
    if (isFavorited) {
      await this.removeFavorite(gameSlug);
      return false;
    } else {
      await this.addFavorite(gameId, gameName, gameSlug, gameImage);
      return true;
    }
  }

  // Remove duplicates from existing favourites
  static async removeDuplicates(): Promise<void> {
    try {
      console.log('🔧 Removing duplicates from favourites...');
      
      // Load current favourites
      const localFavourites = await this.loadFromLocalStorage();
      
      // Deduplicate by game_slug
      const deduplicated = localFavourites.reduce((acc: LocalFavourite[], current) => {
        const exists = acc.some(fav => fav.game_slug === current.game_slug);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      // Save deduplicated favourites
      await this.saveToLocalStorage(deduplicated);
      
      console.log(`✅ Removed ${localFavourites.length - deduplicated.length} duplicates`);
    } catch (error) {
      console.error('❌ Failed to remove duplicates:', error);
    }
  }
}
