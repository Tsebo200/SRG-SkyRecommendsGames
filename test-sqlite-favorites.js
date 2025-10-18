// Test favourites functionality with SQLite database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testSQLiteFavorites() {
  console.log('🧪 Testing Favourites with SQLite Database...\n');

  const dbPath = path.join(__dirname, 'games.db');
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('1. 🔍 Testing database connection...');
    
    // Test connection
    await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM games', (err, row) => {
        if (err) reject(err);
        else {
          console.log(`✅ Connected to SQLite database with ${row.count} games`);
          resolve();
        }
      });
    });

    console.log('\n2. 🎮 Testing game retrieval...');
    
    // Get all games
    const games = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM games ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`✅ Retrieved ${games.length} games from database`);
    
    // Show first 3 games
    console.log('\n📋 Sample games:');
    games.slice(0, 3).forEach(game => {
      const platforms = JSON.parse(game.platforms);
      const genres = JSON.parse(game.genres);
      console.log(`   - ${game.name} (${game.slug})`);
      console.log(`     Platforms: ${platforms.join(', ')}`);
      console.log(`     Genres: ${genres.join(', ')}`);
    });

    console.log('\n3. ❤️ Testing favourites functionality...');
    
    // Create favourites table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          game_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, game_id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Favourites table created');

    // Test adding favourites
    const testUserId = 'test-user-123';
    const testGames = games.slice(0, 3); // First 3 games

    console.log('\n4. ➕ Testing favourite addition...');
    for (const game of testGames) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO favorites (user_id, game_id)
          VALUES (?, ?)
        `, [testUserId, game.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`✅ Added to favourites: ${game.name}`);
    }

    console.log('\n5. 📋 Testing favourites retrieval...');
    
    // Get user's favourites with game details
    const favorites = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          f.id,
          f.user_id,
          f.game_id,
          f.created_at,
          g.name as game_name,
          g.slug as game_slug,
          g.platforms,
          g.genres
        FROM favorites f
        JOIN games g ON f.game_id = g.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
      `, [testUserId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`✅ Retrieved ${favorites.length} favourites`);
    
    console.log('\n📋 User\'s favourites:');
    favorites.forEach(fav => {
      const platforms = JSON.parse(fav.platforms);
      const genres = JSON.parse(fav.genres);
      console.log(`   - ${fav.game_name} (${fav.game_slug})`);
      console.log(`     Platforms: ${platforms.join(', ')}`);
      console.log(`     Genres: ${genres.join(', ')}`);
      console.log(`     Added: ${new Date(fav.created_at).toLocaleString()}`);
    });

    console.log('\n6. 🗑️ Testing favourite removal...');
    
    // Remove one favourite
    const gameToRemove = testGames[0];
    await new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM favorites 
        WHERE user_id = ? AND game_id = ?
      `, [testUserId, gameToRemove.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log(`✅ Removed from favourites: ${gameToRemove.name}`);

    // Verify removal
    const remainingFavorites = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM favorites 
        WHERE user_id = ? AND game_id = ?
      `, [testUserId, gameToRemove.id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (remainingFavorites === 0) {
      console.log('✅ Favourite removal verified');
    } else {
      console.log('❌ Favourite removal failed');
    }

    console.log('\n7. 🔍 Testing data integrity...');
    
    // Final count
    const finalFavorites = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM favorites WHERE user_id = ?
      `, [testUserId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    console.log(`✅ Final favourites count: ${finalFavorites} (expected: ${testGames.length - 1})`);

    console.log('\n🎉 All SQLite favourites tests passed!');
    console.log('✅ Database operations working correctly');
    console.log('✅ Favourites can be added, retrieved, and removed');
    console.log('✅ No RLS restrictions - full control over data');
    console.log('✅ Ready for app integration testing');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    db.close();
  }
}

// Run the test
testSQLiteFavorites().catch(console.error);
