// Create a fresh test user and test authentication
const { createClient } = require('@supabase/supabase-js');

async function createFreshTestUser() {
  console.log('🔐 Creating Fresh Test User...\n');

  const supabaseUrl = 'http://127.0.0.1:54321';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  const supabase = createClient(supabaseUrl, anonKey);

  const testEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  try {
    console.log('1. 📧 Creating new user...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signUpError) {
      console.log('❌ Sign up error:', signUpError.message);
      return;
    }

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${signUpData.user?.id}`);

    console.log('\n2. 🔑 Testing sign in...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('❌ Sign in error:', signInError.message);
      return;
    }

    console.log('✅ Sign in successful!');
    console.log(`   User ID: ${signInData.user?.id}`);
    console.log(`   Email: ${signInData.user?.email}`);

    console.log('\n3. 🎮 Testing game creation...');
    
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: `test-game-${Date.now()}`,
        name: 'Test Game for Fresh User',
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
      return;
    }

    console.log('✅ Game created successfully!');
    console.log(`   Game: ${gameData.name} (${gameData.slug})`);

    console.log('\n4. ❤️ Testing favourite addition...');
    
    const { error: favError } = await supabase
      .from('favorites')
      .insert({
        user_id: signInData.user.id,
        game_id: gameData.id
      });

    if (favError) {
      console.log('❌ Favourite creation failed:', favError.message);
      return;
    }

    console.log('✅ Favourite added successfully!');

    console.log('\n🎉 Fresh user test completed successfully!');
    console.log('\n📱 Use these credentials in your app:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n✅ Authentication: Working');
    console.log('✅ Game creation: Working');
    console.log('✅ Favourites: Working');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
createFreshTestUser().catch(console.error);
