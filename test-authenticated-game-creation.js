// Test if authenticated users can now create games
const { createClient } = require('@supabase/supabase-js');

async function testAuthenticatedGameCreation() {
  console.log('🧪 Testing Authenticated User Game Creation...\n');

  const supabaseUrl = 'http://127.0.0.1:54321';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  const supabase = createClient(supabaseUrl, anonKey);

  try {
    console.log('1. 🔐 Testing authentication...');
    
    // Try to create a test user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ User authenticated:', authData.user?.email);

    console.log('\n2. 🎮 Testing game creation with authenticated user...');
    
    // Try to create a game as authenticated user
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: 'test-authenticated-game',
        name: 'Test Authenticated Game',
        platforms: ['PC', 'PS5'],
        genres: ['Action', 'Test'],
        store_urls: {},
        rubric: { completeness: 0.8, monetisation: 0.6, accessibility: 0.9, creativity: 0.7 },
        embedding: null
      })
      .select('id, slug, name')
      .single();

    if (gameError) {
      console.log('❌ Game creation failed:', gameError.message);
      console.log('💡 This means authenticated users still cannot create games');
    } else {
      console.log('✅ Game created successfully!');
      console.log(`   - ID: ${gameData.id}`);
      console.log(`   - Name: ${gameData.name}`);
      console.log(`   - Slug: ${gameData.slug}`);
    }

    console.log('\n3. ❤️ Testing favourites with authenticated user...');
    
    if (gameData) {
      // Try to add to favourites
      const { error: favError } = await supabase
        .from('favorites')
        .insert({
          game_id: gameData.id
        });

      if (favError) {
        console.log('❌ Favourite creation failed:', favError.message);
      } else {
        console.log('✅ Favourite added successfully!');
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthenticatedGameCreation().catch(console.error);
