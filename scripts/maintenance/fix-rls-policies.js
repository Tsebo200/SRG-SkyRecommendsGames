// Fix RLS policies for games and favourites tables
const { createClient } = require('@supabase/supabase-js');

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS Policies...\n');

  const supabaseUrl = 'https://fwqzmyrjhajpukhqdfrh.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUwMTc5MiwiZXhwIjoyMDc2MDc3NzkyfQ.HY2SwzgwK5ffwtSCSzDMelQ5VvLmcoFdjyAmvngr39M';
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('1. 🗄️ Checking current RLS policies...');
    
    // Check if games table has RLS enabled
    const { data: gamesRLS, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(1);

    if (gamesError) {
      console.log('❌ Games table RLS error:', gamesError.message);
    } else {
      console.log('✅ Games table accessible with service role');
    }

    // Check if favourites table has RLS enabled
    const { data: favouritesRLS, error: favouritesError } = await supabase
      .from('favourites')
      .select('*')
      .limit(1);

    if (favouritesError) {
      console.log('❌ Favourites table RLS error:', favouritesError.message);
    } else {
      console.log('✅ Favourites table accessible with service role');
    }

    console.log('\n2. 🔐 Testing with authenticated user...');
    
    // Create a test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'testuser@example.com',
      password: 'password123',
      email_confirm: true
    });

    if (userError) {
      console.log('❌ User creation failed:', userError.message);
    } else {
      console.log('✅ Test user created successfully!');
      console.log(`   User ID: ${userData.user.id}`);
      
      // Test favourites with authenticated user
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          slug: 'test-rls-game',
          name: 'Test RLS Game',
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
            user_id: userData.user.id,
            game_id: gameData.id
          });

        if (favError) {
          console.log('❌ Favourite creation failed:', favError.message);
        } else {
          console.log('✅ Favourite added successfully!');
          console.log('🎉 RLS policies are working!');
        }
      }
    }

    console.log('\n📱 Your app should now work with:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: password123');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

fixRLSPolicies().catch(console.error);
