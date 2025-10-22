/**
 * PlayStation API Integration
 * Fetches user gaming data including trophies, games, and playtime
 */

export interface PlayStationGame {
  npTitleId: string;
  titleName: string;
  imageUrl: string;
  platform: string;
  category: string;
  playDuration: number; // minutes
  lastPlayedDate: string;
  progress: number; // percentage
}

export interface PlayStationTrophy {
  trophyId: string;
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  trophyRare: number;
  trophyEarnedRate: string;
  trophyType: string;
  trophyHidden: boolean;
  earned: boolean;
  earnedDate?: string;
}

export interface PlayStationProfile {
  onlineId: string;
  aboutMe: string;
  avatarUrl: string;
  languages: string[];
  isPlus: boolean;
  isOfficiallyVerified: boolean;
  personalDetail: {
    firstName: string;
    lastName: string;
  };
  personalDetailSharing: string;
  personalDetailSharingText: string;
  primaryOnlineStatus: string;
  presences: Array<{
    state: string;
    lastOnlineDate: string;
  }>;
  profilePictureUrl: string;
  profileUrl: string;
  verified: boolean;
}

export interface PlayStationTrophySummary {
  level: number;
  progress: number;
  earnedTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  totalTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

export class PlayStationAPIService {
  private baseUrl = 'https://m.np.playstation.com/api';
  private backendUrl = 'http://10.0.0.14:8080'; // Use IP address for phone access

  constructor() {}

  /**
   * Get PlayStation user profile by PSN ID
   */
  async getPlayerProfile(psnId: string): Promise<PlayStationProfile> {
    const url = `${this.backendUrl}/playstation/profile/${encodeURIComponent(psnId)}`;
    
    try {
      console.log('🔄 Fetching PlayStation profile...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('PlayStation user not found. Please check the PSN ID.');
        } else if (response.status === 403) {
          throw new Error('This PlayStation profile is private. Gaming data cannot be accessed.');
        } else {
          throw new Error(`PlayStation API request failed: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ PlayStation profile API successful');
      return data;
    } catch (error) {
      console.error('Error fetching PlayStation profile:', error);
      throw error;
    }
  }

  /**
   * Get user's game library with playtime
   */
  async getOwnedGames(psnId: string): Promise<PlayStationGame[]> {
    const url = `${this.backendUrl}/playstation/games/${encodeURIComponent(psnId)}`;
    
    try {
      console.log('🔄 Fetching PlayStation games...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('PlayStation user not found. Please check the PSN ID.');
        } else if (response.status === 403) {
          throw new Error('This PlayStation profile is private. Gaming data cannot be accessed.');
        } else {
          throw new Error(`PlayStation games API request failed: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ PlayStation games API successful');
      return data.games || [];
    } catch (error) {
      console.error('Error fetching PlayStation games:', error);
      throw error;
    }
  }

  /**
   * Get trophy summary for a user
   */
  async getTrophySummary(psnId: string): Promise<PlayStationTrophySummary> {
    const url = `${this.backendUrl}/playstation/trophies/${encodeURIComponent(psnId)}`;
    
    try {
      console.log('🔄 Fetching PlayStation trophies...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('PlayStation user not found. Please check the PSN ID.');
        } else if (response.status === 403) {
          throw new Error('This PlayStation profile is private. Gaming data cannot be accessed.');
        } else {
          throw new Error(`PlayStation trophies API request failed: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ PlayStation trophies API successful');
      return data;
    } catch (error) {
      console.error('Error fetching PlayStation trophies:', error);
      throw error;
    }
  }

  /**
   * Get top played games by hours
   */
  async getTopPlayedGames(psnId: string, limit: number = 10): Promise<PlayStationGame[]> {
    const games = await this.getOwnedGames(psnId);
    
    // Sort by playtime and return top games
    return games
      .filter(game => game.playDuration > 0)
      .sort((a, b) => b.playDuration - a.playDuration)
      .slice(0, limit);
  }

  /**
   * Get total gaming hours across all games
   */
  async getTotalGamingHours(psnId: string): Promise<number> {
    const games = await this.getOwnedGames(psnId);
    
    const totalMinutes = games.reduce((total, game) => total + game.playDuration, 0);
    return Math.round(totalMinutes / 60 * 100) / 100; // Convert to hours with 2 decimal places
  }

  /**
   * Get gaming statistics summary
   */
  async getGamingStats(psnId: string) {
    const [player, games, totalHours, trophySummary] = await Promise.all([
      this.getPlayerProfile(psnId),
      this.getOwnedGames(psnId),
      this.getTotalGamingHours(psnId),
      this.getTrophySummary(psnId).catch(() => null) // Trophies might not be available
    ]);

    const topGames = await this.getTopPlayedGames(psnId, 5);
    
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
      isPrivate: games.length === 0 && player.personalDetailSharing === 'no',
      trophySummary
    };
  }

  /**
   * Extract PSN ID from PlayStation profile URL
   */
  static extractPSNIdFromUrl(url: string): string | null {
    // Match PlayStation profile URLs
    const patterns = [
      /playstation\.com\/.*\/trophies\/([^\/\?]+)/,
      /playstation\.com\/.*\/profiles\/([^\/\?]+)/,
      /my\.playstation\.com\/.*\/([^\/\?]+)/
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
   * Validate PSN ID format
   */
  static validatePSNId(psnId: string): boolean {
    // PSN IDs are typically 3-16 characters, alphanumeric and some special chars
    const cleanId = psnId.trim();
    return cleanId.length >= 3 && cleanId.length <= 16 && /^[a-zA-Z0-9_-]+$/.test(cleanId);
  }
}
