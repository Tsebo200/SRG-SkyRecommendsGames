// Test favorites database operations directly
const { createClient } = require('@supabase/supabase-js');

// Test database connection and favorites table
async function testFavoritesDatabase() {
  console.log('🧪 Testing Favorites Database Operations...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('1. Testing database connection...');
    const { data, error } = await supabase.from('games').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');

    console.log('2. Testing favorites table structure...');
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select('*')
      .limit(1);
    
    if (favoritesError) {
      console.log('❌ Favorites table error:', favoritesError.message);
      return;
    }
    console.log('✅ Favorites table accessible');

    console.log('3. Testing games table structure...');
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('id, slug, name')
      .limit(1);
    
    if (gamesError) {
      console.log('❌ Games table error:', gamesError.message);
      return;
    }
    console.log('✅ Games table accessible');

    console.log('4. Testing sample data...');
    if (gamesData && gamesData.length > 0) {
      console.log('✅ Sample game found:', gamesData[0]);
    } else {
      console.log('⚠️  No sample games found');
    }

    console.log('5. Testing favorites query...');
    const { data: allFavorites, error: allFavoritesError } = await supabase
      .from('favorites')
      .select(`
        user_id,
        game_id,
        created_at,
        games!inner(
          name,
          slug,
          platforms,
          genres
        )
      `)
      .limit(5);

    if (allFavoritesError) {
      console.log('❌ Favorites query error:', allFavoritesError.message);
    } else {
      console.log('✅ Favorites query successful, found', allFavorites?.length || 0, 'favorites');
    }

  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }

  console.log('\n🏁 Database test completed');
}

// Run the test
testFavoritesDatabase().catch(console.error);
