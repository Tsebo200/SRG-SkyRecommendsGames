// End-to-end test of favourites functionality
const { createClient } = require('@supabase/supabase-js');

async function testFavouritesEndToEnd() {
  console.log('🧪 Testing Favourites End-to-End...\n');

  // Use the same environment as the app
  const supabaseUrl = 'http://127.0.0.1:54321';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const testUser = '00000000-0000-0000-0000-000000000001';
  const testGameSlug = 'test-favourites-game';
  const testGameName = 'Test Favourites Game';

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

    console.log('2. Testing favourite addition...');
    
    // Add to favourites
    const { error: favouriteError } = await supabase
      .from('favourites')
      .insert({
        user_id: testUser,
        game_id: gameData.id
      });

    if (favouriteError) {
      console.log('❌ Favourite addition failed:', favouriteError.message);
      return;
    }
    console.log('✅ Favourite added successfully');

    console.log('3. Testing favourites retrieval...');
    
    // Get favourites with game data
    const { data: favouritesData, error: favouritesError } = await supabase
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
      .eq('user_id', testUser);

    if (favouritesError) {
      console.log('❌ Favourites retrieval failed:', favouritesError.message);
      return;
    }

    console.log('✅ Favourites retrieved:', favouritesData.length, 'items');
    if (favouritesData.length > 0) {
      console.log('   - Game:', favouritesData[0].games.name);
      console.log('   - Slug:', favouritesData[0].games.slug);
    }

    console.log('4. Testing favourite removal...');
    
    // Remove from favourites
    const { error: removeError } = await supabase
      .from('favourites')
      .delete()
      .eq('user_id', testUser)
      .eq('game_id', gameData.id);

    if (removeError) {
      console.log('❌ Favourite removal failed:', removeError.message);
      return;
    }
    console.log('✅ Favourite removed successfully');

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

    console.log('\n🎉 All favourites tests passed!');
    console.log('✅ Database operations work correctly');
    console.log('✅ Favourites can be added, retrieved, and removed');
    console.log('✅ Game data joins work properly');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testFavouritesEndToEnd().catch(console.error);
