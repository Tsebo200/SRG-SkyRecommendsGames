// Import games from RAWG API to populate database for testing
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

async function importGamesFromRAWG() {
  console.log('🎮 Importing Games from RAWG API...\n');

  // Supabase configuration
  const supabaseUrl = 'http://127.0.0.1:54321';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  const supabase = createClient(supabaseUrl, serviceKey);

  // RAWG API configuration
  const RAWG_API_KEY = 'your-rawg-api-key-here'; // You'll need to get this from RAWG
  const RAWG_BASE_URL = 'https://api.rawg.io/api';

  try {
    console.log('1. 🔍 Fetching popular games from RAWG API...');
    
    // Fetch popular games from RAWG API
    const response = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        page_size: 20,
        ordering: '-rating',
        dates: '2020-01-01,2025-12-31'
      }
    });

    const games = response.data.results;
    console.log(`✅ Found ${games.length} games from RAWG API`);

    console.log('\n2. 🗄️ Importing games to Supabase...');
    
    let importedCount = 0;
    let errorCount = 0;

    for (const game of games) {
      try {
        // Transform RAWG game data to our database format
        const gameData = {
          slug: game.slug,
          name: game.name,
          platforms: game.platforms?.map(p => p.platform.name) || [],
          genres: game.genres?.map(g => g.name) || [],
          store_urls: {
            steam: game.stores?.find(s => s.store.name === 'Steam')?.url,
            epic: game.stores?.find(s => s.store.name === 'Epic Games')?.url,
            gog: game.stores?.find(s => s.store.name === 'GOG')?.url,
            xbox: game.stores?.find(s => s.store.name === 'Xbox Store')?.url,
            playstation: game.stores?.find(s => s.store.name === 'PlayStation Store')?.url
          },
          rubric: {
            completeness: Math.random() * 0.4 + 0.6, // 0.6-1.0
            monetisation: Math.random() * 0.4 + 0.4, // 0.4-0.8
            accessibility: Math.random() * 0.3 + 0.7, // 0.7-1.0
            creativity: Math.random() * 0.5 + 0.5 // 0.5-1.0
          },
          embedding: null // Will be populated later if needed
        };

        // Insert game into database
        const { error } = await supabase
          .from('games')
          .upsert(gameData, { onConflict: 'slug' });

        if (error) {
          console.log(`❌ Error importing ${game.name}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Imported: ${game.name}`);
          importedCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`❌ Error processing ${game.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n3. 📊 Import Summary:');
    console.log(`✅ Successfully imported: ${importedCount} games`);
    console.log(`❌ Errors: ${errorCount} games`);
    console.log(`📈 Success rate: ${((importedCount / games.length) * 100).toFixed(1)}%`);

    console.log('\n4. 🔍 Verifying imported games...');
    const { data: importedGames, error: verifyError } = await supabase
      .from('games')
      .select('name, slug, platforms, genres')
      .limit(5);

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Verification successful:');
      importedGames.forEach(game => {
        console.log(`   - ${game.name} (${game.slug})`);
        console.log(`     Platforms: ${game.platforms.join(', ')}`);
        console.log(`     Genres: ${game.genres.join(', ')}`);
      });
    }

    console.log('\n🎉 Game import completed!');
    console.log('✅ Database now has real game data for testing');
    console.log('✅ Favourites feature can be properly tested');
    console.log('✅ App should work with populated games');

  } catch (error) {
    console.log('❌ Import failed:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 To fix this:');
      console.log('1. Get a free API key from https://rawg.io/apidocs');
      console.log('2. Replace "your-rawg-api-key-here" with your actual key');
      console.log('3. Run this script again');
    }
  }
}

// Alternative: Import sample games without API key
async function importSampleGames() {
  console.log('🎮 Importing Sample Games (No API Key Required)...\n');

  const supabaseUrl = 'http://127.0.0.1:54321';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  const supabase = createClient(supabaseUrl, serviceKey);

  const sampleGames = [
    {
      slug: 'cyberpunk-2077',
      name: 'Cyberpunk 2077',
      platforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
      genres: ['Action', 'RPG', 'Sci-Fi'],
      store_urls: {
        steam: 'https://store.steampowered.com/app/1091500',
        gog: 'https://www.gog.com/game/cyberpunk_2077'
      },
      rubric: { completeness: 0.8, monetisation: 0.6, accessibility: 0.9, creativity: 0.7 }
    },
    {
      slug: 'the-witcher-3-wild-hunt',
      name: 'The Witcher 3: Wild Hunt',
      platforms: ['PC', 'PlayStation 4', 'Xbox One', 'Nintendo Switch'],
      genres: ['Action', 'RPG', 'Fantasy'],
      store_urls: {
        steam: 'https://store.steampowered.com/app/292030',
        gog: 'https://www.gog.com/game/the_witcher_3_wild_hunt'
      },
      rubric: { completeness: 0.95, monetisation: 0.8, accessibility: 0.85, creativity: 0.9 }
    },
    {
      slug: 'elden-ring',
      name: 'Elden Ring',
      platforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
      genres: ['Action', 'RPG', 'Fantasy'],
      store_urls: {
        steam: 'https://store.steampowered.com/app/1245620',
        epic: 'https://store.epicgames.com/en-US/p/elden-ring'
      },
      rubric: { completeness: 0.9, monetisation: 0.7, accessibility: 0.6, creativity: 0.95 }
    },
    {
      slug: 'baldurs-gate-3',
      name: 'Baldur\'s Gate 3',
      platforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
      genres: ['RPG', 'Strategy', 'Fantasy'],
      store_urls: {
        steam: 'https://store.steampowered.com/app/1086940',
        gog: 'https://www.gog.com/game/baldurs_gate_3'
      },
      rubric: { completeness: 0.95, monetisation: 0.8, accessibility: 0.8, creativity: 0.9 }
    },
    {
      slug: 'god-of-war',
      name: 'God of War',
      platforms: ['PC', 'PlayStation 4', 'PlayStation 5'],
      genres: ['Action', 'Adventure', 'Fantasy'],
      store_urls: {
        steam: 'https://store.steampowered.com/app/1593500',
        epic: 'https://store.epicgames.com/en-US/p/god-of-war'
      },
      rubric: { completeness: 0.9, monetisation: 0.7, accessibility: 0.85, creativity: 0.8 }
    }
  ];

  try {
    console.log('📦 Importing sample games...');
    
    for (const game of sampleGames) {
      const { error } = await supabase
        .from('games')
        .upsert(game, { onConflict: 'slug' });

      if (error) {
        console.log(`❌ Error importing ${game.name}: ${error.message}`);
      } else {
        console.log(`✅ Imported: ${game.name}`);
      }
    }

    console.log('\n✅ Sample games imported successfully!');
    console.log('🎯 You can now test the favourites feature with real game data');

  } catch (error) {
    console.log('❌ Sample import failed:', error.message);
  }
}

// Run the appropriate import function
if (process.argv.includes('--sample')) {
  importSampleGames().catch(console.error);
} else {
  importGamesFromRAWG().catch(console.error);
}
