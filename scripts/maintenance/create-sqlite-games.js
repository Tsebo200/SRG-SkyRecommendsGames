// Create SQLite database with popular games for testing favourites feature
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function createSQLiteGames() {
  console.log('🎮 Creating SQLite Database with Popular Games...\n');

  const dbPath = path.join(__dirname, 'games.db');
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('1. 🗄️ Creating games table...');
    
    // Create games table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS games (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          platforms TEXT,
          genres TEXT,
          store_urls TEXT,
          rubric TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Games table created');

    console.log('\n2. 📦 Inserting popular games...');
    
    const popularGames = [
      {
        slug: 'black-myth-wukong',
        name: 'Black Myth: Wukong',
        platforms: JSON.stringify(['PC', 'PlayStation 5', 'Xbox Series X']),
        genres: JSON.stringify(['Action', 'RPG', 'Adventure']),
        store_urls: JSON.stringify({
          steam: 'https://store.steampowered.com/app/2358720',
          epic: 'https://store.epicgames.com/en-US/p/black-myth-wukong'
        }),
        rubric: JSON.stringify({
          completeness: 0.95,
          monetisation: 0.7,
          accessibility: 0.8,
          creativity: 0.9
        })
      },
      {
        slug: 'spider-man-2',
        name: 'Spider-Man 2',
        platforms: JSON.stringify(['PlayStation 5']),
        genres: JSON.stringify(['Action', 'Adventure', 'Superhero']),
        store_urls: JSON.stringify({
          playstation: 'https://store.playstation.com/en-us/product/UP9000-PPSA03359_00-SM2GAME0000000000'
        }),
        rubric: JSON.stringify({
          completeness: 0.9,
          monetisation: 0.8,
          accessibility: 0.85,
          creativity: 0.85
        })
      },
      {
        slug: 'cyberpunk-2077',
        name: 'Cyberpunk 2077',
        platforms: JSON.stringify(['PC', 'PlayStation 5', 'Xbox Series X']),
        genres: JSON.stringify(['Action', 'RPG', 'Sci-Fi']),
        store_urls: JSON.stringify({
          steam: 'https://store.steampowered.com/app/1091500',
          gog: 'https://www.gog.com/game/cyberpunk_2077',
          epic: 'https://store.epicgames.com/en-US/p/cyberpunk-2077'
        }),
        rubric: JSON.stringify({
          completeness: 0.8,
          monetisation: 0.6,
          accessibility: 0.9,
          creativity: 0.7
        })
      },
      {
        slug: 'the-witcher-3-wild-hunt',
        name: 'The Witcher 3: Wild Hunt',
        platforms: JSON.stringify(['PC', 'PlayStation 4', 'Xbox One', 'Nintendo Switch']),
        genres: JSON.stringify(['Action', 'RPG', 'Fantasy']),
        store_urls: JSON.stringify({
          steam: 'https://store.steampowered.com/app/292030',
          gog: 'https://www.gog.com/game/the_witcher_3_wild_hunt'
        }),
        rubric: JSON.stringify({
          completeness: 0.95,
          monetisation: 0.8,
          accessibility: 0.85,
          creativity: 0.9
        })
      },
      {
        slug: 'elden-ring',
        name: 'Elden Ring',
        platforms: JSON.stringify(['PC', 'PlayStation 5', 'Xbox Series X']),
        genres: JSON.stringify(['Action', 'RPG', 'Fantasy']),
        store_urls: JSON.stringify({
          steam: 'https://store.steampowered.com/app/1245620',
          epic: 'https://store.epicgames.com/en-US/p/elden-ring'
        }),
        rubric: JSON.stringify({
          completeness: 0.9,
          monetisation: 0.7,
          accessibility: 0.6,
          creativity: 0.95
        })
      },
      {
        slug: 'baldurs-gate-3',
        name: 'Baldur\'s Gate 3',
        platforms: JSON.stringify(['PC', 'PlayStation 5', 'Xbox Series X']),
        genres: JSON.stringify(['RPG', 'Strategy', 'Fantasy']),
        store_urls: JSON.stringify({
          steam: 'https://store.steampowered.com/app/1086940',
          gog: 'https://www.gog.com/game/baldurs_gate_3'
        }),
        rubric: JSON.stringify({
          completeness: 0.95,
          monetisation: 0.8,
          accessibility: 0.8,
          creativity: 0.9
        })
      },
      {
        slug: 'god-of-war',
        name: 'God of War',
        platforms: JSON.stringify(['PC', 'PlayStation 4', 'PlayStation 5']),
        genres: JSON.stringify(['Action', 'Adventure', 'Fantasy']),
        store_urls: JSON.stringify({
          steam: 'https://store.steampowered.com/app/1593500',
          epic: 'https://store.epicgames.com/en-US/p/god-of-war'
        }),
        rubric: JSON.stringify({
          completeness: 0.9,
          monetisation: 0.7,
          accessibility: 0.85,
          creativity: 0.8
        })
      },
      {
        slug: 'spider-man-remastered',
        name: 'Spider-Man Remastered',
        platforms: JSON.stringify(['PC', 'PlayStation 5']),
        genres: JSON.stringify(['Action', 'Adventure', 'Superhero']),
        store_urls: JSON.stringify({
          steam: 'https://store.steampowered.com/app/1817190',
          epic: 'https://store.epicgames.com/en-US/p/marvels-spider-man-remastered'
        }),
        rubric: JSON.stringify({
          completeness: 0.9,
          monetisation: 0.8,
          accessibility: 0.85,
          creativity: 0.85
        })
      },
      {
        slug: 'ghost-of-tsushima',
        name: 'Ghost of Tsushima',
        platforms: JSON.stringify(['PC', 'PlayStation 4', 'PlayStation 5']),
        genres: JSON.stringify(['Action', 'Adventure', 'Historical']),
        store_urls: JSON.stringify({
          steam: 'https://store.steampowered.com/app/2215430',
          epic: 'https://store.epicgames.com/en-US/p/ghost-of-tsushima-directors-cut'
        }),
        rubric: JSON.stringify({
          completeness: 0.9,
          monetisation: 0.8,
          accessibility: 0.85,
          creativity: 0.9
        })
      },
      {
        slug: 'horizon-zero-dawn',
        name: 'Horizon Zero Dawn',
        platforms: JSON.stringify(['PC', 'PlayStation 4', 'PlayStation 5']),
        genres: JSON.stringify(['Action', 'RPG', 'Sci-Fi']),
        store_urls: JSON.stringify({
          steam: 'https://store.steampowered.com/app/1151640',
          epic: 'https://store.epicgames.com/en-US/p/horizon-zero-dawn-complete-edition'
        }),
        rubric: JSON.stringify({
          completeness: 0.9,
          monetisation: 0.8,
          accessibility: 0.85,
          creativity: 0.85
        })
      }
    ];

    // Insert games
    for (const game of popularGames) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO games (slug, name, platforms, genres, store_urls, rubric)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [game.slug, game.name, game.platforms, game.genres, game.store_urls, game.rubric], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`✅ Inserted: ${game.name}`);
    }

    console.log('\n3. 🔍 Verifying database...');
    
    // Count games
    const gameCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM games', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    console.log(`✅ Database contains ${gameCount} games`);

    // Show sample games
    const sampleGames = await new Promise((resolve, reject) => {
      db.all('SELECT name, slug, platforms, genres FROM games LIMIT 5', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('\n📋 Sample games in database:');
    sampleGames.forEach(game => {
      const platforms = JSON.parse(game.platforms);
      const genres = JSON.parse(game.genres);
      console.log(`   - ${game.name} (${game.slug})`);
      console.log(`     Platforms: ${platforms.join(', ')}`);
      console.log(`     Genres: ${genres.join(', ')}`);
    });

    console.log('\n🎉 SQLite database created successfully!');
    console.log('✅ Database file: games.db');
    console.log('✅ Contains popular games including Black Myth: Wukong and Spider-Man');
    console.log('✅ Ready for favourites testing without RLS restrictions');

  } catch (error) {
    console.log('❌ Error creating database:', error.message);
  } finally {
    db.close();
  }
}

// Run the script
createSQLiteGames().catch(console.error);
