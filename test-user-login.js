// Test login with your actual credentials
const { createClient } = require('@supabase/supabase-js');

async function testUserLogin() {
  console.log('🔐 Testing User Login...\n');

  const supabaseUrl = 'https://fwqzmyrjhajpukhqdfrh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDE3OTIsImV4cCI6MjA3NjA3Nzc5Mn0.EyPG_-S0JF64iV6dK0ZJ5I_YOZPI38bgvHYv9xzwmkg';
  
  const supabase = createClient(supabaseUrl, anonKey);

  const email = '20020@virtualwimdow.co.za';
  const password = '123456';

  try {
    console.log(`Testing login for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.log('❌ Login failed:', error.message);
      return;
    }

    console.log('✅ Login successful!');
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}`);

    console.log('\n🧪 Testing favourites functionality...');
    
    // Test adding a favorite
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        slug: 'test-favorite-user',
        name: 'Test Favorite for User',
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
      
      // Try to add to favorites
      const { error: favError } = await supabase
        .from('favorites')
        .insert({
          user_id: data.user.id,
          game_id: gameData.id
        });

      if (favError) {
        console.log('❌ Favorite creation failed:', favError.message);
      } else {
        console.log('✅ Favorite added successfully!');
        console.log('🎉 Favourites feature is working!');
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testUserLogin().catch(console.error);
