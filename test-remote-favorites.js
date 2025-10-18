// Test favourites functionality with remote Supabase
const { createClient } = require('@supabase/supabase-js');

async function testRemoteFavorites() {
  console.log('🔍 Testing Remote Supabase Favourites...\n');

  const supabaseUrl = 'https://fwqzmyrjhajpukhqdfrh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDE3OTIsImV4cCI6MjA3NjA3Nzc5Mn0.EyPG_-S0JF64iV6dK0ZJ5I_YOZPI38bgvHYv9xzwmkg';
  
  const supabase = createClient(supabaseUrl, anonKey);

  try {
    console.log('1. 🔐 Testing authentication...');
    
    // Try to sign in with a test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'user@test.com', // Use one of your remote users
      password: 'password123'
    });

    if (signInError) {
      console.log('❌ Authentication failed:', signInError.message);
      return;
    }

    console.log('✅ Authentication successful!');
    console.log(`   User ID: ${signInData.user?.id}`);

    console.log('\n2. 🗄️ Checking database tables...');
    
    // Check if games table exists
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('count')
      .limit(1);

    if (gamesError) {
      console.log('❌ Games table error:', gamesError.message);
    } else {
      console.log('✅ Games table accessible');
    }

    // Check if favorites table exists
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select('count')
      .limit(1);

    if (favoritesError) {
      console.log('❌ Favorites table error:', favoritesError.message);
    } else {
      console.log('✅ Favorites table accessible');
    }

    console.log('\n3. ❤️ Testing favourite operations...');
    
    // Try to add a test game
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: 'test-favorite-game',
        name: 'Test Favorite Game',
        platforms: ['PC'],
        genres: ['Action'],
        store_urls: {},
        rubric: { completeness: 0.8, monetisation: 0.6, accessibility: 0.9, creativity: 0.7 },
        embedding: null
      })
      .select('id')
      .single();

    if (gameError) {
      console.log('❌ Game creation failed:', gameError.message);
    } else {
      console.log('✅ Game created successfully!');
      console.log(`   Game ID: ${gameData.id}`);

      // Try to add to favorites
      const { error: favError } = await supabase
        .from('favorites')
        .insert({
          user_id: signInData.user.id,
          game_id: gameData.id
        });

      if (favError) {
        console.log('❌ Favorite creation failed:', favError.message);
      } else {
        console.log('✅ Favorite added successfully!');
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testRemoteFavorites().catch(console.error);
