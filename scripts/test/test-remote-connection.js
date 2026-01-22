// Test connection to remote Supabase
const { createClient } = require('@supabase/supabase-js');

async function testRemoteConnection() {
  console.log('🔍 Testing Remote Supabase Connection...\n');

  const supabaseUrl = 'https://fwqzmyrjhajpukhqdfrh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXpteXJqaGFqcHVraHFkZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDE3OTIsImV4cCI6MjA3NjA3Nzc5Mn0.EyPG_-S0JF64iV6dK0ZJ5I_YOZPI38bgvHYv9xzwmkg';
  
  const supabase = createClient(supabaseUrl, anonKey);

  try {
    console.log('1. 🔗 Testing basic connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('games')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
    } else {
      console.log('✅ Connection successful!');
    }

    console.log('\n2. 🔐 Testing authentication...');
    
    // Try to get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else {
      console.log('✅ Session check successful!');
      console.log('   Has session:', !!sessionData.session);
      if (sessionData.session) {
        console.log('   User ID:', sessionData.session.user.id);
      }
    }

    console.log('\n3. 🗄️ Testing table access...');
    
    // Test games table
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('id, name, slug')
      .limit(3);

    if (gamesError) {
      console.log('❌ Games table error:', gamesError.message);
    } else {
      console.log('✅ Games table accessible!');
      console.log('   Games found:', gamesData?.length || 0);
    }

    // Test favourites table
    const { data: favouritesData, error: favouritesError } = await supabase
      .from('favourites')
      .select('user_id, game_id')
      .limit(3);

    if (favouritesError) {
      console.log('❌ Favourites table error:', favouritesError.message);
    } else {
      console.log('✅ Favourites table accessible!');
      console.log('   Favourites found:', favouritesData?.length || 0);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testRemoteConnection().catch(console.error);
