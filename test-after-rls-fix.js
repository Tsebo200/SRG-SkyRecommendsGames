// Test after RLS policies are fixed
const { createClient } = require('@supabase/supabase-js');

async function testAfterRLSFix() {
  console.log('🧪 Testing After RLS Fix...\n');

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

    console.log('\n2. 🎮 Testing game creation...');
    
    // Try to create a game with authenticated user
    const { data: newGameData, error: newGameError } = await supabase
      .from('games')
      .insert({
        slug: `test-after-rls-${Date.now()}`,
        name: 'Test After RLS Fix',
        platforms: ['PC'],
        genres: ['Action'],
        store_urls: {},
        rubric: { completeness: 0.8, monetisation: 0.6, accessibility: 0.9, creativity: 0.7 },
        embedding: null
      })
      .select('id')
      .single();

    if (newGameError) {
      console.log('❌ Game creation failed:', newGameError.message);
      console.log('   Error code:', newGameError.code);
      console.log('   You still need to add the RLS policy for games table');
    } else {
      console.log('✅ Game creation successful!');
      console.log(`   Game ID: ${newGameData.id}`);

      console.log('\n3. ❤️ Testing favorite creation...');
      
      // Try to add to favorites
      const { error: favError } = await supabase
        .from('favorites')
        .insert({
          user_id: authData.user.id,
          game_id: newGameData.id
        });

      if (favError) {
        console.log('❌ Favorite creation failed:', favError.message);
        console.log('   Error code:', favError.code);
        console.log('   You still need to add the RLS policy for favorites table');
      } else {
        console.log('✅ Favorite creation successful!');
        console.log('🎉 RLS policies are working!');
        console.log('🎉 Favourites feature should now work in your app!');
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testAfterRLSFix().catch(console.error);
