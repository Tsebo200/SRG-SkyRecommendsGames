// Check current RLS policies on favourites table
const { createClient } = require('@supabase/supabase-js');

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS Policies on Favourites Table...\n');

  const supabaseUrl = 'https://fwqzmyrjhajpukhqdfrh.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUwMTc5MiwiZXhwIjoyMDc2MDc3NzkyfQ.HY2SwzgwK5ffwtSCSzDMelQ5VvLmcoFdjyAmvngr39M';
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('1. 🔍 Checking current RLS policies...');
    
    // Check if RLS is enabled on favourites table
    const { data: rlsEnabled, error: rlsError } = await supabase
      .rpc('get_table_rls_status', { table_name: 'favourites' })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (rlsError) {
      console.log('⚠️  Could not check RLS status:', rlsError.message);
    } else {
      console.log('✅ RLS status:', rlsEnabled);
    }

    console.log('\n2. 🧪 Testing DELETE operation with service role...');
    
    // Test DELETE with service role (should work)
    const { data: testData, error: testError } = await supabase
      .from('favourites')
      .select('user_id, game_id')
      .limit(1);

    if (testError) {
      console.log('❌ Cannot access favourites table:', testError.message);
    } else {
      console.log('✅ Favourites table accessible with service role');
      console.log(`   Found ${testData.length} favourites`);
      
      if (testData.length > 0) {
        console.log('\n3. 🗑️ Testing DELETE with service role...');
        
        const { error: deleteError } = await supabase
          .from('favourites')
          .delete()
          .eq('user_id', testData[0].user_id)
          .eq('game_id', testData[0].game_id);

        if (deleteError) {
          console.log('❌ DELETE failed with service role:', deleteError.message);
        } else {
          console.log('✅ DELETE successful with service role');
        }
      }
    }

    console.log('\n4. 🔐 Testing with authenticated user...');
    
    // Create a test user and test DELETE
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'rls-test-delete@example.com',
      password: 'password123',
      email_confirm: true
    });

    if (userError) {
      console.log('❌ User creation failed:', userError.message);
    } else {
      console.log('✅ Test user created successfully!');
      console.log(`   User ID: ${userData.user.id}`);
      
      // Create a test game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          slug: `rls-delete-test-${Date.now()}`,
          name: 'RLS Delete Test Game',
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
        
        // Add to favourites
        const { error: addError } = await supabase
          .from('favourites')
          .insert({
            user_id: userData.user.id,
            game_id: gameData.id
          });

        if (addError) {
          console.log('❌ Add favourite failed:', addError.message);
        } else {
          console.log('✅ Favourite added successfully!');
          
          // Test DELETE with authenticated user
          const { error: deleteError } = await supabase
            .from('favourites')
            .delete()
            .eq('user_id', userData.user.id)
            .eq('game_id', gameData.id);

          if (deleteError) {
            console.log('❌ DELETE failed with authenticated user:', deleteError.message);
            console.log('   Error code:', deleteError.code);
            console.log('   Error details:', deleteError.details);
            
            console.log('\n🔧 The issue is with the RLS policy for DELETE operations.');
            console.log('   You need to add a DELETE policy for the favourites table.');
            console.log('   Go to your Supabase dashboard and add:');
            console.log('   - Policy name: "Allow authenticated users to delete favourites"');
            console.log('   - Operation: DELETE');
            console.log('   - Target roles: authenticated');
            console.log('   - USING expression: auth.uid() = user_id');
            
          } else {
            console.log('✅ DELETE successful with authenticated user!');
            console.log('🎉 RLS policies are working correctly!');
          }
        }
      }
    }

  } catch (error) {
    console.log('❌ Check failed:', error.message);
  }
}

checkRLSPolicies().catch(console.error);
