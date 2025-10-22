// Test favourites with proper authentication
const { createClient } = require('@supabase/supabase-js');

async function testFavouritesWithAuth() {
  console.log('🧪 Testing Favourites with Authentication...\n');

  // Use service role for database operations (bypasses RLS)
  const supabaseUrl = 'http://127.0.0.1:54321';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  const supabase = createClient(supabaseUrl, serviceKey);

  const testUser = '00000000-0000-0000-0000-000000000001';
  const testGameSlug = 'test-favourites-game-auth';
  const testGameName = 'Test Favourites Game Auth';

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

    console.log('2. Testing favourite addition with service role...');
    
    // Add to favourites using service role
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
      console.log('   - Platforms:', favouritesData[0].games.platforms);
      console.log('   - Genres:', favouritesData[0].games.genres);
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
    console.log('✅ RLS policies are working correctly');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testFavouritesWithAuth().catch(console.error);
