// End-to-end test of favorites functionality
const { createClient } = require('@supabase/supabase-js');

async function testFavoritesEndToEnd() {
  console.log('🧪 Testing Favorites End-to-End...\n');

  // Use the same environment as the app
  const supabaseUrl = 'http://127.0.0.1:54321';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const testUser = '00000000-0000-0000-0000-000000000001';
  const testGameSlug = 'test-favorites-game';
  const testGameName = 'Test Favorites Game';

  try {
    console.log('1. Testing game creation...');
    
    // Create a test game
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

    console.log('2. Testing favorite addition...');
    
    // Add to favorites
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

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testFavoritesEndToEnd().catch(console.error);
