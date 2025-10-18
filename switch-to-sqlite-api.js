// Script to switch the app to use SQLite API instead of Supabase
const fs = require('fs');
const path = require('path');

console.log('🔄 Switching app to use SQLite API...');

// Update the API client to use SQLite API
const apiClientPath = path.join(__dirname, 'frontend/SRG/lib/api.ts');

const sqliteApiClient = `
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Game {
  id: number;
  slug: string;
  name: string;
  platforms: string[];
  genres: string[];
  store_urls: Record<string, string>;
  rubric: {
    completeness: number;
    monetisation: number;
    accessibility: number;
    creativity: number;
  };
  created_at: string;
}

export interface FavoriteGame {
  id: number;
  user_id: string;
  game_id: number;
  created_at: string;
  game_name: string;
  game_slug: string;
  platforms: string[];
  genres: string[];
}

// Search games
export async function searchGames(query: string): Promise<Game[]> {
  try {
    const response = await axios.get(\`\${API_BASE_URL}/games/search/\${encodeURIComponent(query)}\`);
    return response.data;
  } catch (error) {
    console.error('Search games error:', error);
    return [];
  }
}

// Get all games
export async function getAllGames(): Promise<Game[]> {
  try {
    const response = await axios.get(\`\${API_BASE_URL}/games\`);
    return response.data;
  } catch (error) {
    console.error('Get games error:', error);
    return [];
  }
}

// Get game by slug
export async function getGameBySlug(slug: string): Promise<Game | null> {
  try {
    const response = await axios.get(\`\${API_BASE_URL}/games/\${slug}\`);
    return response.data;
  } catch (error) {
    console.error('Get game error:', error);
    return null;
  }
}

// Favourites API
export class FavoritesService {
  static async addFavorite(userId: string, gameId: number): Promise<void> {
    try {
      await axios.post(\`\${API_BASE_URL}/favorites\`, {
        userId,
        gameId
      });
    } catch (error) {
      console.error('Add favorite error:', error);
      throw error;
    }
  }

  static async removeFavorite(userId: string, gameId: number): Promise<void> {
    try {
      await axios.delete(\`\${API_BASE_URL}/favorites/\${userId}/\${gameId}\`);
    } catch (error) {
      console.error('Remove favorite error:', error);
      throw error;
    }
  }

  static async getFavorites(userId: string): Promise<FavoriteGame[]> {
    try {
      const response = await axios.get(\`\${API_BASE_URL}/favorites/\${userId}\`);
      return response.data;
    } catch (error) {
      console.error('Get favorites error:', error);
      return [];
    }
  }

  static async isFavorited(userId: string, gameId: number): Promise<boolean> {
    try {
      const response = await axios.get(\`\${API_BASE_URL}/favorites/\${userId}/\${gameId}\`);
      return response.data.isFavorited;
    } catch (error) {
      console.error('Check favorite error:', error);
      return false;
    }
  }

  static async toggleFavorite(userId: string, gameId: number): Promise<boolean> {
    const isFavorited = await this.isFavorited(userId, gameId);
    
    if (isFavorited) {
      await this.removeFavorite(userId, gameId);
      return false;
    } else {
      await this.addFavorite(userId, gameId);
      return true;
    }
  }
}

// Export for compatibility
export const apiClient = {
  searchGames,
  getAllGames,
  getGameBySlug
};
`;

fs.writeFileSync(apiClientPath, sqliteApiClient);
console.log('✅ API client updated to use SQLite API');
console.log('📱 Restart your Expo app to use the new API');
console.log('🎮 Available games: Black Myth: Wukong, Spider-Man, Cyberpunk 2077, etc.');
`;

// Run the script
switchToSQLiteAPI();
