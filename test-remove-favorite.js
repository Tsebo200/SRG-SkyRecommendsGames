// Test remove favorite functionality
const { createClient } = require('@supabase/supabase-js');

async function testRemoveFavorite() {
  console.log('🧪 Testing Remove Favorite Functionality...\n');

  const supabaseUrl = 'https://fwqzmyrjhajpukhqdfrh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDE3OTIsImV4cCI6MjA3NjA3Nzc5Mn0.EyPG_-S0JF64iV6dK0ZJ5I_YOZPI38bgvHYv9xzwmkg';
  
  const supabase = createClient(supabaseUrl, anonKey);

  try {
    console.log('1. 🔐 Testing authentication...');
    
    // Sign in with the test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'password123'
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful!');
    console.log(`   User ID: ${authData.user.id}`);

    console.log('\n2. 🎮 Creating a test game...');
    
    // Create a test game
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: `remove-test-${Date.now()}`,
        name: 'Remove Test Game',
        platforms: ['PC'],
        genres: ['Action'],
        store_urls: {},
        rubric: { completeness: 0.8, monetisation: 0.6, accessibility: 0.9, creativity: 0.7 },
        embedding: null
      })
      .select('id, slug')
      .single();

    if (gameError) {
      console.log('❌ Game creation failed:', gameError.message);
      return;
    }

    console.log('✅ Game created successfully!');
    console.log(`   Game ID: ${gameData.id}`);
    console.log(`   Game Slug: ${gameData.slug}`);

    console.log('\n3. ❤️ Adding to favorites...');
    
    // Add to favorites
    const { error: addError } = await supabase
      .from('favorites')
      .insert({
        user_id: authData.user.id,
        game_id: gameData.id
      });

    if (addError) {
      console.log('❌ Add favorite failed:', addError.message);
      return;
    }

    console.log('✅ Favorite added successfully!');

    console.log('\n4. 🗑️ Testing remove favorite...');
    
    // Test remove favorite with user_id filter
    const { error: removeError } = await supabase
      .from('favorites')
      .delete()
      .eq('game_id', gameData.id)
      .eq('user_id', authData.user.id);

    if (removeError) {
      console.log('❌ Remove favorite failed:', removeError.message);
      console.log('   Error code:', removeError.code);
      console.log('   Error details:', removeError.details);
    } else {
      console.log('✅ Remove favorite successful!');
      console.log('🎉 Remove favorite functionality is working!');
    }

    console.log('\n5. 🔍 Verifying removal...');
    
    // Check if favorite was actually removed
    const { data: checkData, error: checkError } = await supabase
      .from('favorites')
      .select('game_id')
      .eq('game_id', gameData.id)
      .eq('user_id', authData.user.id)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Favorite successfully removed (not found in database)');
    } else if (checkError) {
      console.log('❌ Error checking removal:', checkError.message);
    } else {
      console.log('⚠️  Favorite still exists after removal attempt');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testRemoveFavorite().catch(console.error);
