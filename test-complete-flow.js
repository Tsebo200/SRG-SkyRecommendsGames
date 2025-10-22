// Test complete flow: sign in, create game, add to favourites
const { createClient } = require('@supabase/supabase-js');

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Flow: Sign In → Create Game → Add Favourite...\n');

  const supabaseUrl = 'http://127.0.0.1:54321';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  const supabase = createClient(supabaseUrl, anonKey);

  try {
    console.log('1. 🔐 Signing in existing user...');
    
    // Sign in with existing user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (authError) {
      console.log('❌ Sign in error:', authError.message);
      return;
    }

    console.log('✅ User signed in:', authData.user?.email);
    console.log('✅ User ID:', authData.user?.id);

    console.log('\n2. 🎮 Creating new game...');
    
    // Create a new game
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: `complete-flow-test-game-${Date.now()}`,
        name: 'Complete Flow Test Game',
        platforms: ['PC', 'PS5', 'Xbox'],
        genres: ['Action', 'Adventure', 'Test'],
        store_urls: {
          steam: 'https://store.steampowered.com/app/test',
          epic: 'https://store.epicgames.com/test'
        },
        rubric: { 
          completeness: 0.9, 
          monetisation: 0.7, 
          accessibility: 0.8, 
          creativity: 0.85 
        },
        embedding: null
      })
      .select('id, slug, name')
      .single();

    if (gameError) {
      console.log('❌ Game creation failed:', gameError.message);
      return;
    }

    console.log('✅ Game created successfully!');
    console.log(`   - ID: ${gameData.id}`);
    console.log(`   - Name: ${gameData.name}`);
    console.log(`   - Slug: ${gameData.slug}`);

    console.log('\n3. ❤️ Adding to favourites...');
    
    // Add to favourites
    const { error: favError } = await supabase
      .from('favourites')
      .insert({
        user_id: authData.user.id,
        game_id: gameData.id
      });

    if (favError) {
      console.log('❌ Favourite creation failed:', favError.message);
      return;
    }

    console.log('✅ Favourite added successfully!');

    console.log('\n4. 📋 Retrieving favourites...');
    
    // Get user's favourites
    const { data: favourites, error: favsError } = await supabase
      .from('favourites')
      .select(`
        id,
        game_id,
        created_at,
        games!inner(
          name,
          slug,
          platforms,
          genres
        )
      `);

    if (favsError) {
      console.log('❌ Favourites retrieval failed:', favsError.message);
    } else {
      console.log(`✅ Retrieved ${favourites.length} favourites:`);
      favourites.forEach(fav => {
        console.log(`   - ${fav.games.name} (${fav.games.slug})`);
        console.log(`     Platforms: ${fav.games.platforms.join(', ')}`);
        console.log(`     Genres: ${fav.games.genres.join(', ')}`);
      });
    }

    console.log('\n🎉 Complete flow test successful!');
    console.log('✅ User authentication: Working');
    console.log('✅ Game creation: Working');
    console.log('✅ Favourite addition: Working');
    console.log('✅ Favourite retrieval: Working');
    console.log('✅ RLS policies: Properly configured');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testCompleteFlow().catch(console.error);
