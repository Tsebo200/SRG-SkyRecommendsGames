// Simple API server to serve SQLite games data to the app
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbPath = path.join(__dirname, 'games.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Starting SQLite API Server...');
console.log(`📁 Database: ${dbPath}`);

// Routes

// Get all games
app.get('/api/games', (req, res) => {
  db.all('SELECT * FROM games ORDER BY name', (err, rows) => {
    if (err) {
      console.error('Error fetching games:', err);
      res.status(500).json({ error: 'Failed to fetch games' });
    } else {
      // Parse JSON fields
      const games = rows.map(row => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        platforms: JSON.parse(row.platforms),
        genres: JSON.parse(row.genres),
        store_urls: JSON.parse(row.store_urls),
        rubric: JSON.parse(row.rubric),
        created_at: row.created_at
      }));
      res.json(games);
    }
  });
});

// Get game by slug
app.get('/api/games/:slug', (req, res) => {
  const { slug } = req.params;
  
  db.get('SELECT * FROM games WHERE slug = ?', [slug], (err, row) => {
    if (err) {
      console.error('Error fetching game:', err);
      res.status(500).json({ error: 'Failed to fetch game' });
    } else if (!row) {
      res.status(404).json({ error: 'Game not found' });
    } else {
      const game = {
        id: row.id,
        slug: row.slug,
        name: row.name,
        platforms: JSON.parse(row.platforms),
        genres: JSON.parse(row.genres),
        store_urls: JSON.parse(row.store_urls),
        rubric: JSON.parse(row.rubric),
        created_at: row.created_at
      };
      res.json(game);
    }
  });
});

// Search games
app.get('/api/games/search/:query', (req, res) => {
  const { query } = req.params;
  const searchTerm = `%${query}%`;
  
  db.all(`
    SELECT * FROM games 
    WHERE name LIKE ? OR slug LIKE ?
    ORDER BY name
  `, [searchTerm, searchTerm], (err, rows) => {
    if (err) {
      console.error('Error searching games:', err);
      res.status(500).json({ error: 'Failed to search games' });
    } else {
      const games = rows.map(row => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        platforms: JSON.parse(row.platforms),
        genres: JSON.parse(row.genres),
        store_urls: JSON.parse(row.store_urls),
        rubric: JSON.parse(row.rubric),
        created_at: row.created_at
      }));
      res.json(games);
    }
  });
});

// Get user's favourites
app.get('/api/favorites/:userId', (req, res) => {
  const { userId } = req.params;
  
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
  `, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching favorites:', err);
      res.status(500).json({ error: 'Failed to fetch favorites' });
    } else {
      const favorites = rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        game_id: row.game_id,
        created_at: row.created_at,
        game_name: row.game_name,
        game_slug: row.game_slug,
        platforms: JSON.parse(row.platforms),
        genres: JSON.parse(row.genres)
      }));
      res.json(favorites);
    }
  });
});

// Add favourite
app.post('/api/favorites', (req, res) => {
  const { userId, gameId } = req.body;
  
  if (!userId || !gameId) {
    return res.status(400).json({ error: 'userId and gameId are required' });
  }
  
  db.run(`
    INSERT OR IGNORE INTO favorites (user_id, game_id)
    VALUES (?, ?)
  `, [userId, gameId], function(err) {
    if (err) {
      console.error('Error adding favorite:', err);
      res.status(500).json({ error: 'Failed to add favorite' });
    } else {
      res.json({ 
        success: true, 
        message: 'Favorite added successfully',
        changes: this.changes 
      });
    }
  });
});

// Remove favourite
app.delete('/api/favorites/:userId/:gameId', (req, res) => {
  const { userId, gameId } = req.params;
  
  db.run(`
    DELETE FROM favorites 
    WHERE user_id = ? AND game_id = ?
  `, [userId, gameId], function(err) {
    if (err) {
      console.error('Error removing favorite:', err);
      res.status(500).json({ error: 'Failed to remove favorite' });
    } else {
      res.json({ 
        success: true, 
        message: 'Favorite removed successfully',
        changes: this.changes 
      });
    }
  });
});

// Check if game is favourited
app.get('/api/favorites/:userId/:gameId', (req, res) => {
  const { userId, gameId } = req.params;
  
  db.get(`
    SELECT id FROM favorites 
    WHERE user_id = ? AND game_id = ?
  `, [userId, gameId], (err, row) => {
    if (err) {
      console.error('Error checking favorite:', err);
      res.status(500).json({ error: 'Failed to check favorite' });
    } else {
      res.json({ isFavorited: !!row });
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SQLite API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ SQLite API Server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/games - Get all games`);
  console.log(`   GET  /api/games/:slug - Get game by slug`);
  console.log(`   GET  /api/games/search/:query - Search games`);
  console.log(`   GET  /api/favorites/:userId - Get user's favourites`);
  console.log(`   POST /api/favorites - Add favourite`);
  console.log(`   DELETE /api/favorites/:userId/:gameId - Remove favourite`);
  console.log(`   GET  /api/favorites/:userId/:gameId - Check if favourited`);
  console.log('\n🎮 Ready to serve games data to the app!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SQLite API Server...');
  db.close();
  process.exit(0);
});
