/**
 * Xbox API Integration
 * Fetches user gaming data including achievements, games, and playtime
 */

export interface XboxGame {
  id: string;
  name: string;
  imageUrl: string;
  platform: string;
  playtime: number; // minutes
  lastPlayedDate: string;
  achievements: XboxAchievement[];
  totalAchievements: number;
  earnedAchievements: number;
}

export interface XboxAchievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: string;
  rarityPercentage: number;
  earned: boolean;
  earnedDate?: string;
  gamerscore: number;
}

export interface XboxProfile {
  gamertag: string;
  displayName: string;
  avatarUrl: string;
  gamerscore: number;
  tier: string;
  reputation: string;
  location: string;
  bio: string;
  isOnline: boolean;
  lastSeen: string;
  followers: number;
  following: number;
}

export interface XboxGamingStats {
  totalGames: number;
  totalPlaytime: number; // minutes
  totalGamerscore: number;
  totalAchievements: number;
  earnedAchievements: number;
  completionRate: number;
}

export class XboxAPIService {
  private baseUrl = 'https://xbl.io/api/v2';
  private backendUrl = 'http://10.0.0.14:8080'; // Use IP address for phone access

  constructor() {}

  /**
   * Get Xbox user profile by gamertag
   */
  async getPlayerProfile(gamertag: string): Promise<XboxProfile> {
    const url = `${this.backendUrl}/xbox/profile/${encodeURIComponent(gamertag)}`;
    
    try {
      console.log('🔄 Fetching Xbox profile...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Xbox user not found. Please check the gamertag.');
        } else if (response.status === 403) {
          throw new Error('This Xbox profile is private. Gaming data cannot be accessed.');
        } else {
          throw new Error(`Xbox API request failed: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Xbox profile API successful');
      return data;
    } catch (error) {
      console.error('Error fetching Xbox profile:', error);
      throw error;
    }
  }

  /**
   * Get user's game library with playtime
   */
  async getOwnedGames(gamertag: string): Promise<XboxGame[]> {
    const url = `${this.backendUrl}/xbox/games/${encodeURIComponent(gamertag)}`;
    
    try {
      console.log('🔄 Fetching Xbox games...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Xbox user not found. Please check the gamertag.');
        } else if (response.status === 403) {
          throw new Error('This Xbox profile is private. Gaming data cannot be accessed.');
        } else {
          throw new Error(`Xbox games API request failed: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Xbox games API successful');
      return data.games || [];
    } catch (error) {
      console.error('Error fetching Xbox games:', error);
      throw error;
    }
  }

  /**
   * Get achievements for a specific game
   */
  async getGameAchievements(gamertag: string, gameId: string): Promise<XboxAchievement[]> {
    const url = `${this.backendUrl}/xbox/achievements/${encodeURIComponent(gamertag)}/${gameId}`;
    
    try {
      console.log('🔄 Fetching Xbox achievements...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Xbox user not found. Please check the gamertag.');
        } else if (response.status === 403) {
          throw new Error('This Xbox profile is private. Gaming data cannot be accessed.');
        } else {
          throw new Error(`Xbox achievements API request failed: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Xbox achievements API successful');
      return data.achievements || [];
    } catch (error) {
      console.error('Error fetching Xbox achievements:', error);
      throw error;
    }
  }

  /**
   * Get top played games by hours
   */
  async getTopPlayedGames(gamertag: string, limit: number = 10): Promise<XboxGame[]> {
    const games = await this.getOwnedGames(gamertag);
    
    // Sort by playtime and return top games
    return games
      .filter(game => game.playtime > 0)
      .sort((a, b) => b.playtime - a.playtime)
      .slice(0, limit);
  }

  /**
   * Get total gaming hours across all games
   */
  async getTotalGamingHours(gamertag: string): Promise<number> {
    const games = await this.getOwnedGames(gamertag);
    
    const totalMinutes = games.reduce((total, game) => total + game.playtime, 0);
    return Math.round(totalMinutes / 60 * 100) / 100; // Convert to hours with 2 decimal places
  }

  /**
   * Get gaming statistics summary
   */
  async getGamingStats(gamertag: string) {
    const [player, games, totalHours] = await Promise.all([
      this.getPlayerProfile(gamertag),
      this.getOwnedGames(gamertag),
      this.getTotalGamingHours(gamertag)
    ]);

    const topGames = await this.getTopPlayedGames(gamertag, 5);
    
    // Calculate gaming stats
    const totalGamerscore = games.reduce((total, game) => total + (game.earnedAchievements * 10), 0);
    const totalAchievements = games.reduce((total, game) => total + game.totalAchievements, 0);
    const earnedAchievements = games.reduce((total, game) => total + game.earnedAchievements, 0);
    const completionRate = totalAchievements > 0 ? Math.round((earnedAchievements / totalAchievements) * 100) : 0;
    
    return {
      player,
      totalGames: games.length,
      totalHours,
      topGames,
      recentlyPlayed: games
        .filter(game => game.lastPlayedDate)
        .sort((a, b) => new Date(b.lastPlayedDate).getTime() - new Date(a.lastPlayedDate).getTime())
        .slice(0, 5),
      hasGames: games.length > 0,
      isPrivate: games.length === 0 && player.reputation === 'private',
      gamingStats: {
        totalGames: games.length,
        totalPlaytime: totalHours,
        totalGamerscore,
        totalAchievements,
        earnedAchievements,
        completionRate
      }
    };
  }

  /**
   * Extract gamertag from Xbox profile URL
   */
  static extractGamertagFromUrl(url: string): string | null {
    // Match Xbox profile URLs
    const patterns = [
      /xbox\.com\/.*\/profile\/([^\/\?]+)/,
      /xbox\.com\/.*\/gamertag\/([^\/\?]+)/,
      /xbl\.io\/.*\/([^\/\?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    
    return null;
  }

  /**
   * Validate gamertag format
   */
  static validateGamertag(gamertag: string): boolean {
    // Xbox gamertags are typically 1-15 characters, alphanumeric and some special chars
    const cleanTag = gamertag.trim();
    return cleanTag.length >= 1 && cleanTag.length <= 15 && /^[a-zA-Z0-9\s_-]+$/.test(cleanTag);
  }
}
