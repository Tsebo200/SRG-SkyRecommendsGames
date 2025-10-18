// Complete test of favorites functionality
const { createClient } = require('@supabase/supabase-js');

async function testFavoritesComplete() {
  console.log('🧪 COMPLETE FAVORITES FEATURE TEST\n');
  console.log('=' .repeat(50));

  const supabaseUrl = 'http://127.0.0.1:54321';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  const supabase = createClient(supabaseUrl, serviceKey);

  const testUser = '00000000-0000-0000-0000-000000000001';
  const testGameSlug = 'complete-test-game';
  const testGameName = 'Complete Test Game';

  let testResults = {
    databaseConnection: false,
    gameCreation: false,
    favoriteAddition: false,
    favoriteRetrieval: false,
    favoriteRemoval: false,
    dataIntegrity: false,
    cleanup: false
  };

  try {
    console.log('1. 🗄️  Testing Database Connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('games')
      .select('count')
      .limit(1);
    
    if (connectionError) throw connectionError;
    testResults.databaseConnection = true;
    console.log('✅ Database connection successful');

    console.log('\n2. 🎮 Testing Game Creation...');
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: testGameSlug,
        name: testGameName,
        platforms: ['PC', 'PS5', 'Xbox'],
        genres: ['Action', 'Adventure', 'RPG'],
        store_urls: {
          steam: 'https://store.steampowered.com/app/test',
          epic: 'https://store.epicgames.com/test'
        },
        rubric: {
          completeness: 0.8,
          monetisation: 0.6,
          accessibility: 0.9,
          creativity: 0.7
        },
        embedding: null
      })
      .select('id, slug, name, platforms, genres')
      .single();

    if (gameError) throw gameError;
    testResults.gameCreation = true;
    console.log('✅ Game created successfully');
    console.log(`   - ID: ${gameData.id}`);
    console.log(`   - Name: ${gameData.name}`);
    console.log(`   - Platforms: ${gameData.platforms.join(', ')}`);
    console.log(`   - Genres: ${gameData.genres.join(', ')}`);

    console.log('\n3. ❤️  Testing Favorite Addition...');
    const { error: favoriteError } = await supabase
      .from('favorites')
      .insert({
        user_id: testUser,
        game_id: gameData.id
      });

    if (favoriteError) throw favoriteError;
    testResults.favoriteAddition = true;
    console.log('✅ Favorite added successfully');

    console.log('\n4. 📋 Testing Favorites Retrieval...');
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
          genres,
          store_urls
        )
      `)
      .eq('user_id', testUser)
      .order('created_at', { ascending: false });

    if (favoritesError) throw favoritesError;
    testResults.favoriteRetrieval = true;
    console.log('✅ Favorites retrieved successfully');
    console.log(`   - Found ${favoritesData.length} favorites`);
    
    if (favoritesData.length > 0) {
      const fav = favoritesData[0];
      console.log(`   - Game: ${fav.games.name}`);
      console.log(`   - Slug: ${fav.games.slug}`);
      console.log(`   - Platforms: ${fav.games.platforms.join(', ')}`);
      console.log(`   - Genres: ${fav.games.genres.join(', ')}`);
      console.log(`   - Added: ${new Date(fav.created_at).toLocaleString()}`);
    }

    console.log('\n5. 🗑️  Testing Favorite Removal...');
    const { error: removeError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', testUser)
      .eq('game_id', gameData.id);

    if (removeError) throw removeError;
    testResults.favoriteRemoval = true;
    console.log('✅ Favorite removed successfully');

    console.log('\n6. 🔍 Testing Data Integrity...');
    const { data: remainingFavorites, error: integrityError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', testUser)
      .eq('game_id', gameData.id);

    if (integrityError) throw integrityError;
    testResults.dataIntegrity = (remainingFavorites.length === 0);
    console.log(`✅ Data integrity verified (${remainingFavorites.length} remaining favorites)`);

    console.log('\n7. 🧹 Testing Cleanup...');
    const { error: cleanupError } = await supabase
      .from('games')
      .delete()
      .eq('id', gameData.id);

    if (cleanupError) {
      console.log('⚠️  Cleanup warning:', cleanupError.message);
    } else {
      testResults.cleanup = true;
      console.log('✅ Test data cleaned up successfully');
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }

  // Final Results
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  console.log('\n' + '=' .repeat(50));
  console.log(`🎯 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Favorites feature is working correctly.');
    console.log('✅ Database operations: WORKING');
    console.log('✅ Game creation: WORKING');
    console.log('✅ Favorite management: WORKING');
    console.log('✅ Data retrieval: WORKING');
    console.log('✅ Data integrity: WORKING');
    console.log('\n🚀 The favorites feature is ready for production use!');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
  }
  
  console.log('=' .repeat(50));
}

// Run the complete test
testFavoritesComplete().catch(console.error);
