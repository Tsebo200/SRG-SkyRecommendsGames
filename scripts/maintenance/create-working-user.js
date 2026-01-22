// Create a fresh user that we know will work
const { createClient } = require('@supabase/supabase-js');

async function createWorkingUser() {
  console.log('🔐 Creating Working User...\n');

  const supabaseUrl = 'https://fwqzmyrjhajpukhqdfrh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDE3OTIsImV4cCI6MjA3NjA3Nzc5Mn0.EyPG_-S0JF64iV6dK0ZJ5I_YOZPI38bgvHYv9xzwmkg';
  
  const supabase = createClient(supabaseUrl, anonKey);

  const email = `testuser${Date.now()}@example.com`;
  const password = 'password123';

  try {
    console.log(`Creating user: ${email}`);
    console.log(`Password: ${password}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      console.log('❌ Sign up failed:', error.message);
      return;
    }

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}`);

    console.log('\n🧪 Testing favourites functionality...');
    
    // Test adding a favourite
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: 'test-favourite-working',
        name: 'Test Favourite Working',
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
      
      // Try to add to favourites
      const { error: favError } = await supabase
        .from('favourites')
        .insert({
          user_id: data.user.id,
          game_id: gameData.id
        });

      if (favError) {
        console.log('❌ Favourite creation failed:', favError.message);
      } else {
        console.log('✅ Favourite added successfully!');
        console.log('🎉 Favourites feature is working!');
      }
    }

    console.log('\n📱 Use these credentials in your app:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

createWorkingUser().catch(console.error);
