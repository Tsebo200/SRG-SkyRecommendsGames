// Comprehensive RLS debugging
const { createClient } = require('@supabase/supabase-js');

async function debugRLS() {
  console.log('🔍 Comprehensive RLS Debugging...\n');

  const supabaseUrl = 'https://fwqzmyrjhajpukhqdfrh.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUwMTc5MiwiZXhwIjoyMDc2MDc3NzkyfQ.HY2SwzgwK5ffwtSCSzDMelQ5VvLmcoFdjyAmvngr39M';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDE3OTIsImV4cCI6MjA3NjA3Nzc5Mn0.EyPG_-S0JF64iV6dK0ZJ5I_YOZPI38bgvHYv9xzwmkg';
  
  const supabaseService = createClient(supabaseUrl, serviceRoleKey);
  const supabaseAnon = createClient(supabaseUrl, anonKey);

  try {
    console.log('1. 🔐 Testing authentication flow...');
    
    // Sign in with the test user
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'password123'
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful!');
    console.log(`   User ID: ${authData.user.id}`);

    console.log('\n2. 🗄️ Testing games table access...');
    
    // Test games table with authenticated user
    const { data: gamesData, error: gamesError } = await supabaseAnon
      .from('games')
      .select('id, name, slug')
      .limit(3);

    if (gamesError) {
      console.log('❌ Games table error:', gamesError.message);
      console.log('   Error code:', gamesError.code);
      console.log('   Error details:', gamesError.details);
    } else {
      console.log('✅ Games table accessible!');
      console.log(`   Found ${gamesData.length} games`);
    }

    console.log('\n3. ❤️ Testing favourites table access...');
    
    // Test favourites table with authenticated user
    const { data: favouritesData, error: favouritesError } = await supabaseAnon
      .from('favourites')
      .select('user_id, game_id')
      .limit(3);

    if (favouritesError) {
      console.log('❌ Favourites table error:', favouritesError.message);
      console.log('   Error code:', favouritesError.code);
      console.log('   Error details:', favouritesError.details);
    } else {
      console.log('✅ Favourites table accessible!');
      console.log(`   Found ${favouritesData.length} favourites`);
    }

    console.log('\n4. 🎮 Testing game creation with authenticated user...');
    
    // Try to create a game with authenticated user
    const { data: newGameData, error: newGameError } = await supabaseAnon
      .from('games')
      .insert({
        slug: `test-game-${Date.now()}`,
        name: 'Test Game for RLS',
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
    } else {
      console.log('✅ Game creation successful!');
      console.log(`   Game ID: ${newGameData.id}`);

      console.log('\n5. ❤️ Testing favourite creation...');
      
      // Try to add to favourites
      const { error: favError } = await supabaseAnon
        .from('favourites')
        .insert({
          user_id: authData.user.id,
          game_id: newGameData.id
        });

      if (favError) {
        console.log('❌ Favourite creation failed:', favError.message);
        console.log('   Error code:', favError.code);
        console.log('   Error details:', favError.details);
      } else {
        console.log('✅ Favourite creation successful!');
        console.log('🎉 All RLS tests passed!');
      }
    }

    console.log('\n6. 🔍 Checking RLS policies...');
    
    // Check if RLS is enabled on tables
    const { data: rlsInfo, error: rlsError } = await supabaseService
      .rpc('get_table_info', { table_name: 'games' })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (rlsError) {
      console.log('⚠️  Could not check RLS info:', rlsError.message);
    } else {
      console.log('✅ RLS info retrieved');
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugRLS().catch(console.error);
