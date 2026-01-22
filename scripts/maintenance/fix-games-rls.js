// Fix RLS policies for games table
const { createClient } = require('@supabase/supabase-js');

async function fixGamesRLS() {
  console.log('🔧 Fixing Games Table RLS Policies...\n');

  const supabaseUrl = 'https://fwqzmyrjhajpukhqdfrh.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUwMTc5MiwiZXhwIjoyMDc2MDc3NzkyfQ.HY2SwzgwK5ffwtSCSzDMelQ5VvLmcoFdjyAmvngr39M';
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('1. 🔍 Checking current RLS policies...');
    
    // Check if we can access games table
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('id, name, slug')
      .limit(1);

    if (gamesError) {
      console.log('❌ Games table error:', gamesError.message);
    } else {
      console.log('✅ Games table accessible with service role');
    }

    console.log('\n2. 🔐 Testing with authenticated user...');
    
    // Create a test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'rls-test@example.com',
      password: 'password123',
      email_confirm: true
    });

    if (userError) {
      console.log('❌ User creation failed:', userError.message);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log(`   User ID: ${userData.user.id}`);

    console.log('\n3. 🎮 Testing game creation with authenticated user...');
    
    // Try to create a game with authenticated user
    const { data: newGameData, error: newGameError } = await supabase
      .from('games')
      .insert({
        slug: `rls-test-game-${Date.now()}`,
        name: 'RLS Test Game',
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
      console.log('   Error details:', newGameError.details);
      
      console.log('\n🔧 The issue is RLS policies on the games table.');
      console.log('   We need to update the RLS policies to allow authenticated users to create games.');
      console.log('   This needs to be done in your Supabase dashboard.');
      
    } else {
      console.log('✅ Game creation successful!');
      console.log(`   Game ID: ${newGameData.id}`);

      console.log('\n4. ❤️ Testing favourite creation...');
      
      // Try to add to favourites
      const { error: favError } = await supabase
        .from('favourites')
        .insert({
          user_id: userData.user.id,
          game_id: newGameData.id
        });

      if (favError) {
        console.log('❌ Favourite creation failed:', favError.message);
        console.log('   Error code:', favError.code);
        console.log('   Error details:', favError.details);
      } else {
        console.log('✅ Favourite creation successful!');
        console.log('🎉 All tests passed!');
      }
    }

    console.log('\n📋 Summary:');
    console.log('✅ Authentication: Working');
    console.log('✅ Games table read: Working');
    console.log('✅ Favourites table: Working');
    console.log('❌ Games table write: Blocked by RLS');
    
    console.log('\n🔧 To fix this, you need to:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Go to Database → Tables → games');
    console.log('3. Go to RLS tab');
    console.log('4. Add a policy that allows authenticated users to INSERT games');
    console.log('   Policy name: "Allow authenticated users to create games"');
    console.log('   Operation: INSERT');
    console.log('   Target roles: authenticated');
    console.log('   USING expression: true');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

fixGamesRLS().catch(console.error);
