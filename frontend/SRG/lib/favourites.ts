import { supabase } from './supabase';

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

export class FavouritesService {
  // Add a game to favourites
  static async addFavourite(gameId: string, gameName: string, gameSlug: string, gameImage?: string): Promise<void> {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Add favourite - Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });
    
    if (authError || !user) {
      throw new Error('User must be authenticated to add favourites');
    }

    // First, ensure the game exists in our database
    // We'll use the slug as a unique identifier and create a simple game record
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

    // Now add to favourites
    const { error } = await supabase
      .from('favourites')
      .insert({
        user_id: user.id,
        game_id: actualGameId,
      });
    
    if (error) throw error;
  }

  // Remove a game from favourites
  static async removeFavourite(gameSlug: string): Promise<void> {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Remove favourite - Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });
    
    if (authError || !user) {
      throw new Error('User must be authenticated to remove favourites');
    }

    // First get the game ID from the slug
    console.log('🔍 Remove favourite - Looking for game with slug:', gameSlug);
    const { data: game, error: fetchError } = await supabase
      .from('games')
      .select('id')
      .eq('slug', gameSlug)
      .single();

    if (fetchError) {
      console.log('❌ Game not found:', fetchError.message);
      console.log('   Code:', fetchError.code);
      console.log('   This means the game with slug "' + gameSlug + '" does not exist in the database');
      throw new Error(`Game not found: ${gameSlug}`);
    }
    
    console.log('✅ Game found:', game.id);

    // Check if the favourite exists before trying to delete
    console.log('🔍 Checking if favourite exists for user:', user.id, 'game:', game.id);
    const { data: existingFavourite, error: checkError } = await supabase
      .from('favourites')
      .select('game_id')
      .eq('game_id', game.id)
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Error checking favourite:', checkError.message);
      throw checkError;
    }

    if (!existingFavourite) {
      console.log('⚠️ Favourite not found - user may have already removed it');
      return; // No error, just return silently
    }

    console.log('✅ Favourite exists, proceeding with deletion');

    const { error } = await supabase
      .from('favourites')
      .delete()
      .eq('game_id', game.id)
      .eq('user_id', user.id);
    
    if (error) {
      console.log('❌ Delete error:', error.message);
      throw error;
    }

    console.log('✅ Favourite removed successfully');
  }

  // Get user's favourite games with full game data
  static async getFavourites(): Promise<FavouriteGame[]> {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Get favourites - Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });
    
    if (authError || !user) {
      throw new Error('User must be authenticated to get favourites');
    }

    const { data, error } = await supabase
      .from('favourites')
      .select(`
        user_id,
        game_id,
        created_at,
        games!inner(
          name,
          slug,
          platforms,
          genres,
          store_urls
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map((fav: any) => ({
      user_id: fav.user_id,
      game_id: fav.game_id,
      created_at: fav.created_at,
      game_name: fav.games?.name,
      game_slug: fav.games?.slug,
      platforms: fav.games?.platforms,
      genres: fav.games?.genres,
    })) || [];
  }

  // Check if a game is favourited
  static async isFavourited(gameSlug: string): Promise<boolean> {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return false; // Not authenticated, so not favourited
    }

    // First get the game ID from the slug
    const { data: game, error: fetchError } = await supabase
      .from('games')
      .select('id')
      .eq('slug', gameSlug)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // Game doesn't exist, so it's not favourited
      return false;
    }
    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('favourites')
      .select('game_id')
      .eq('game_id', game.id)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Toggle favourite status
  static async toggleFavourite(gameId: string, gameName: string, gameSlug: string, gameImage?: string): Promise<boolean> {
    const isFavourited = await this.isFavourited(gameSlug);
    
    if (isFavourited) {
      await this.removeFavourite(gameSlug);
      return false;
    } else {
      await this.addFavourite(gameId, gameName, gameSlug, gameImage);
      return true;
    }
  }
}
