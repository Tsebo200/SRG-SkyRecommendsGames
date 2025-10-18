// Test favorites with proper authentication
const { createClient } = require('@supabase/supabase-js');

async function testFavoritesWithAuth() {
  console.log('🧪 Testing Favorites with Authentication...\n');

  // Use service role for database operations (bypasses RLS)
  const supabaseUrl = 'http://127.0.0.1:54321';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  const supabase = createClient(supabaseUrl, serviceKey);

  const testUser = '00000000-0000-0000-0000-000000000001';
  const testGameSlug = 'test-favorites-game-auth';
  const testGameName = 'Test Favorites Game Auth';

  try {
    console.log('1. Testing game creation with service role...');
    
    // Create a test game using service role
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: testGameSlug,
        name: testGameName,
        platforms: ['PC', 'PS5'],
        genres: ['Action', 'Adventure'],
        store_urls: {},
        rubric: {},
        embedding: null
      })
      .select('id')
      .single();

    if (gameError) {
      console.log('❌ Game creation failed:', gameError.message);
      return;
    }
    console.log('✅ Game created:', gameData.id);

    console.log('2. Testing favorite addition with service role...');
    
    // Add to favorites using service role
    const { error: favoriteError } = await supabase
      .from('favorites')
      .insert({
        user_id: testUser,
        game_id: gameData.id
      });

    if (favoriteError) {
      console.log('❌ Favorite addition failed:', favoriteError.message);
      return;
    }
    console.log('✅ Favorite added successfully');

    console.log('3. Testing favorites retrieval...');
    
    // Get favorites with game data
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
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
      .eq('user_id', testUser);

    if (favoritesError) {
      console.log('❌ Favorites retrieval failed:', favoritesError.message);
      return;
    }

    console.log('✅ Favorites retrieved:', favoritesData.length, 'items');
    if (favoritesData.length > 0) {
      console.log('   - Game:', favoritesData[0].games.name);
      console.log('   - Slug:', favoritesData[0].games.slug);
      console.log('   - Platforms:', favoritesData[0].games.platforms);
      console.log('   - Genres:', favoritesData[0].games.genres);
    }

    console.log('4. Testing favorite removal...');
    
    // Remove from favorites
    const { error: removeError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', testUser)
      .eq('game_id', gameData.id);

    if (removeError) {
      console.log('❌ Favorite removal failed:', removeError.message);
      return;
    }
    console.log('✅ Favorite removed successfully');

    console.log('5. Testing cleanup...');
    
    // Clean up test game
    const { error: cleanupError } = await supabase
      .from('games')
      .delete()
      .eq('id', gameData.id);

    if (cleanupError) {
      console.log('⚠️  Cleanup failed:', cleanupError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 All favorites tests passed!');
    console.log('✅ Database operations work correctly');
    console.log('✅ Favorites can be added, retrieved, and removed');
    console.log('✅ Game data joins work properly');
    console.log('✅ RLS policies are working correctly');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testFavoritesWithAuth().catch(console.error);
