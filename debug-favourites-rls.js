// Debug favourites RLS policy specifically
const { createClient } = require('@supabase/supabase-js');

async function debugFavouritesRLS() {
  console.log('🔍 Debugging Favourites RLS Policy...\n');

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
    
    // Create a test game first
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: `favourites-test-${Date.now()}`,
        name: 'Favourites Test Game',
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
      return;
    }

    console.log('✅ Game created successfully!');
    console.log(`   Game ID: ${gameData.id}`);

    console.log('\n3. ❤️ Testing favourite creation with explicit user_id...');
    
    // Try to add to favourites with explicit user_id
    const { error: favError } = await supabase
      .from('favourites')
      .insert({
        user_id: authData.user.id,  // Explicitly set user_id
        game_id: gameData.id
      });

    if (favError) {
      console.log('❌ Favourite creation failed:', favError.message);
      console.log('   Error code:', favError.code);
      console.log('   Error details:', favError.details);
      
      console.log('\n🔧 The issue is with the favourites RLS policy.');
      console.log('   The policy might not be correctly configured.');
      console.log('   Let me check what the current policy looks like...');
      
    } else {
      console.log('✅ Favourite creation successful!');
      console.log('🎉 Favourites RLS policy is working!');
    }

    console.log('\n4. 🔍 Testing auth.uid() function...');
    
    // Test if auth.uid() is working
    const { data: authTest, error: authTestError } = await supabase
      .rpc('auth.uid')
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (authTestError) {
      console.log('⚠️  Could not test auth.uid():', authTestError.message);
    } else {
      console.log('✅ auth.uid() test result:', authTest);
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugFavouritesRLS().catch(console.error);
