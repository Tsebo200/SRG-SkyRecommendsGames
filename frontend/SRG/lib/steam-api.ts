/**
 * Steam API Integration
 * Fetches user gaming data including hours played, achievements, and game library
 */

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  playtime_2weeks?: number; // minutes
  img_icon_url: string;
  img_logo_url: string;
  has_community_visible_stats: boolean;
}

export interface SteamPlayer {
  steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  personastateflags?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

export interface SteamPlayerSummary {
  response: {
    players: SteamPlayer[];
  };
}

export interface SteamOwnedGames {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

export interface SteamAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
  name: string;
  description: string;
}

export interface SteamGameStats {
  playerstats: {
    steamID: string;
    gameName: string;
    achievements: SteamAchievement[];
    stats?: any[];
  };
}

export class SteamAPIService {
  private apiKey: string;
  private baseUrl = 'https://api.steampowered.com';
  private backendUrl = 'http://10.0.0.14:8080'; // Use IP address for phone access

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get Steam user profile by Steam ID
   */
  async getPlayerSummary(steamId: string): Promise<SteamPlayer> {
    // Try backend first, fallback to direct API
    const backendUrl = `${this.backendUrl}/steam/player/${steamId}`;
    const directUrl = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${steamId}`;
    
    try {
      // Try backend first
      console.log('🔄 Trying backend Steam API...');
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.status}`);
      }
      
      const data: SteamPlayerSummary = await response.json();
      
      if (data.response.players.length === 0) {
        throw new Error('Steam user not found');
      }
      
      console.log('✅ Backend Steam API successful');
      return data.response.players[0];
    } catch (backendError) {
      console.log('⚠️ Backend failed, trying direct Steam API...', backendError);
      
      try {
        // Fallback to direct Steam API
        const response = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
        
        if (!response.ok) {
          if (response.status === 400) {
            throw new Error('Invalid Steam ID format. Please check the Steam ID or URL.');
          } else if (response.status === 401) {
            throw new Error('Steam API key is invalid or expired.');
          } else if (response.status === 403) {
            throw new Error('Steam API access denied. The profile may be private.');
          } else {
            throw new Error(`Steam API request failed: ${response.status}`);
          }
        }
        
        const data: SteamPlayerSummary = await response.json();
        
        if (data.response.players.length === 0) {
          throw new Error('Steam user not found. Please check the Steam ID or URL.');
        }
        
        console.log('✅ Direct Steam API successful');
        return data.response.players[0];
      } catch (directError) {
        console.error('❌ Both backend and direct API failed:', directError);
        
        // Provide more specific error messages
        if (directError.message.includes('Invalid Steam ID')) {
          throw new Error('Invalid Steam ID format. Please enter a valid Steam ID or profile URL.');
        } else if (directError.message.includes('Steam API key')) {
          throw new Error('Steam API configuration error. Please contact support.');
        } else if (directError.message.includes('private')) {
          throw new Error('This Steam profile is private. Gaming data cannot be accessed.');
        } else if (directError.message.includes('not found')) {
          throw new Error('Steam user not found. Please check the Steam ID or URL.');
        } else {
          throw new Error('Failed to fetch Steam profile. Please check your internet connection and try again.');
        }
      }
    }
  }

  /**
   * Get user's game library with playtime
   */
  async getOwnedGames(steamId: string, includePlaytime: boolean = true): Promise<SteamGame[]> {
    // Try backend first, fallback to direct API
    const backendUrl = `${this.backendUrl}/steam/games/${steamId}`;
    const directUrl = `${this.baseUrl}/IPlayerService/GetOwnedGames/v0001/?key=${this.apiKey}&steamid=${steamId}&include_played_free_games=true&include_appinfo=true&format=json`;
    
    try {
      // Try backend first
      console.log('🔄 Trying backend Steam games API...');
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 second timeout for games (larger response)
      });
      
      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.status}`);
      }
      
      const data: SteamOwnedGames = await response.json();
      
      if (!data.response.games) {
        return [];
      }
      
      console.log('✅ Backend Steam games API successful');
      return data.response.games;
    } catch (backendError) {
      console.log('⚠️ Backend failed, trying direct Steam games API...', backendError);
      
      try {
        // Fallback to direct Steam API
        const response = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        });
        
        if (!response.ok) {
          throw new Error(`Direct API request failed: ${response.status}`);
        }
        
        const data: SteamOwnedGames = await response.json();
        
        if (!data.response.games) {
          return [];
        }
        
        console.log('✅ Direct Steam games API successful');
        return data.response.games;
      } catch (directError) {
        console.error('❌ Both backend and direct API failed:', directError);
        throw new Error('Failed to fetch Steam games. Please check your internet connection and try again.');
      }
    }
  }

  /**
   * Get game achievements for a specific game
   */
  async getGameAchievements(steamId: string, appId: number): Promise<SteamAchievement[]> {
    const url = `${this.baseUrl}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${this.apiKey}&steamid=${steamId}`;
    
    try {
      const response = await fetch(url);
      const data: SteamGameStats = await response.json();
      
      if (!data.playerstats.achievements) {
        return [];
      }
      
      return data.playerstats.achievements;
    } catch (error) {
      console.error('Error fetching Steam achievements:', error);
      return [];
    }
  }

  /**
   * Get top played games by hours
   */
  async getTopPlayedGames(steamId: string, limit: number = 10): Promise<SteamGame[]> {
    const games = await this.getOwnedGames(steamId);
    
    // Sort by playtime and return top games
    return games
      .filter(game => game.playtime_forever > 0)
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, limit);
  }

  /**
   * Get total gaming hours across all games
   */
  async getTotalGamingHours(steamId: string): Promise<number> {
    const games = await this.getOwnedGames(steamId);
    
    const totalMinutes = games.reduce((total, game) => total + game.playtime_forever, 0);
    return Math.round(totalMinutes / 60 * 100) / 100; // Convert to hours with 2 decimal places
  }

  /**
   * Get gaming statistics summary
   */
  async getGamingStats(steamId: string) {
    const [player, games, totalHours] = await Promise.all([
      this.getPlayerSummary(steamId),
      this.getOwnedGames(steamId),
      this.getTotalGamingHours(steamId)
    ]);

    const topGames = await this.getTopPlayedGames(steamId, 5);
    
    return {
      player,
      totalGames: games.length,
      totalHours,
      topGames,
      recentlyPlayed: games
        .filter(game => game.playtime_2weeks && game.playtime_2weeks > 0)
        .sort((a, b) => (b.playtime_2weeks || 0) - (a.playtime_2weeks || 0))
        .slice(0, 5),
      hasGames: games.length > 0,
      isPrivate: games.length === 0 && player.communityvisibilitystate === 1
    };
  }

  /**
   * Get personalised game recommendations based on Steam profile
   */
  async getPersonalisedRecommendations(steamId: string): Promise<{
    recommendations: Array<{
      gameName: string;
      reason: string;
      confidence: number;
      genre: string;
      estimatedPlaytime: string;
    }>;
    gamingProfile: {
      preferredGenres: string[];
      playStyle: string;
      gamingLevel: string;
      interests: string[];
    };
  }> {
    const backendUrl = `${this.backendUrl}/steam/recommendations/${steamId}`;
    
    try {
      console.log('🔄 Fetching personalised recommendations...');
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      
      if (!response.ok) {
        throw new Error(`Recommendations API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Personalised recommendations API successful');
      return data;
    } catch (error) {
      console.error('Error fetching personalised recommendations:', error);
      throw error;
    }
  }

  /**
   * Analyse gaming patterns from Steam data
   */
  analyseGamingPatterns(games: SteamGame[]): {
    preferredGenres: string[];
    playStyle: string;
    gamingLevel: string;
    interests: string[];
  } {
    // Analyze playtime patterns
    const totalPlaytime = games.reduce((total, game) => total + game.playtime_forever, 0);
    const avgPlaytime = totalPlaytime / games.length;
    
    // Determine gaming level
    let gamingLevel = 'Casual';
    if (totalPlaytime > 2000) gamingLevel = 'Hardcore';
    else if (totalPlaytime > 1000) gamingLevel = 'Enthusiast';
    else if (totalPlaytime > 500) gamingLevel = 'Regular';
    
    // Analyze play style
    let playStyle = 'Explorer';
    const highPlaytimeGames = games.filter(game => game.playtime_forever > avgPlaytime * 2);
    if (highPlaytimeGames.length > games.length * 0.3) playStyle = 'Completionist';
    else if (games.length > 100) playStyle = 'Collector';
    else if (avgPlaytime > 50) playStyle = 'Focused';
    
    // Extract interests from game names (simplified)
    const interests: string[] = [];
    const gameNames = games.map(game => game.name.toLowerCase());
    
    if (gameNames.some(name => name.includes('strategy') || name.includes('rts'))) interests.push('Strategy');
    if (gameNames.some(name => name.includes('rpg') || name.includes('role'))) interests.push('RPG');
    if (gameNames.some(name => name.includes('shooter') || name.includes('fps'))) interests.push('Shooter');
    if (gameNames.some(name => name.includes('puzzle') || name.includes('indie'))) interests.push('Puzzle/Indie');
    if (gameNames.some(name => name.includes('racing') || name.includes('car'))) interests.push('Racing');
    if (gameNames.some(name => name.includes('simulation') || name.includes('sim'))) interests.push('Simulation');
    
    return {
      preferredGenres: interests,
      playStyle,
      gamingLevel,
      interests
    };
  }

  /**
   * Convert Steam ID to Steam ID64
   */
  static convertToSteamId64(steamId: string): string {
    // Clean the input
    const cleanId = steamId.trim();
    
    // If it's already a Steam ID64, return as is
    if (cleanId.length === 17 && /^\d+$/.test(cleanId)) {
      return cleanId;
    }
    
    // If it's a Steam ID3, convert it
    if (cleanId.startsWith('[U:1:')) {
      const id = parseInt(cleanId.replace('[U:1:', '').replace(']', ''));
      return (id + 76561197960265728).toString();
    }
    
    // If it's a Steam ID, convert it
    if (cleanId.includes(':')) {
      const parts = cleanId.split(':');
      if (parts.length >= 3) {
        const universe = parseInt(parts[0]);
        const accountId = parseInt(parts[2]);
        return (accountId * 2 + universe + 76561197960265728).toString();
      }
    }
    
    // If it's a numeric string, try to use it directly
    if (/^\d+$/.test(cleanId) && cleanId.length >= 10) {
      return cleanId;
    }
    
    throw new Error(`Invalid Steam ID format: ${steamId}`);
  }

  /**
   * Extract Steam ID from Steam profile URL
   */
  static extractSteamIdFromUrl(url: string): string | null {
    // Match Steam profile URLs
    const patterns = [
      /steamcommunity\.com\/id\/([^\/]+)/,
      /steamcommunity\.com\/profiles\/(\d+)/,
      /steam\.com\/user\/([^\/]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }
}
