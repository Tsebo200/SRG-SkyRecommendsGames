import axios from 'axios';
import { getBackendUrl, getBestBackendUrl, findWorkingBackendUrl, testBackendUrl } from './network-config';

// Get the backend URL with automatic detection
let API_BASE_URL = getBackendUrl();
console.log('🌐 Initial API Base URL:', API_BASE_URL);

export interface Game {
  id: number;
  slug: string;
  name: string;
  background_image?: string;
  platforms?: Array<{
    platform: {
      id: number;
      name: string;
    };
  }> | string[];
  genres?: Array<{
    id: number;
    name: string;
  }> | string[];
  stores?: Array<{
    store: {
      id: number;
      name: string;
    };
    url: string;
  }>;
  // AI Recommendation fields
  personalized_description?: string;
  recommendation_score?: number;
  similarity_reason?: string;
  estimated_playtime?: string;
  rating?: number;
  released?: string;
  description?: string;
}

export interface SearchResponse {
  results: Game[];
  count: number;
}

export interface UpsertGameRequest {
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
  embedding?: number[];
}

export interface SimilarGame {
  id: string;
  slug: string;
  name: string;
  platforms: string[];
  genres: string[];
  store_urls: Record<string, string>;
  rubric: Record<string, number>;
  similarity_score: number;
}

class ApiClient {
  private client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Increased to 30 seconds for AI recommendations
  });
  private retryCount = 0;
  private maxRetries = 3;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Initialize with best available backend URL (async, but don't block)
    this.initializationPromise = this.initializeBackendUrl();

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL || this.client.defaults.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        this.retryCount = 0; // Reset retry count on success
        return response;
      },
      async (error) => {
        // Don't log 429 errors as critical - they're rate limiting issues
        if (error.response?.status !== 429) {
          console.error('❌ API Response Error:', error.message);
          console.error('❌ Error details:', {
            code: error.code,
            message: error.message,
            baseURL: this.client.defaults.baseURL,
            url: error.config?.url,
          });
        } else {
          // Only log 429 as warning, not error
          console.warn('⚠️ Rate limit reached (429), please wait before making more requests');
        }
        
        // If it's a network error, try to find a working backend URL
        if (error.code === 'NETWORK_ERROR' || 
            error.message.includes('Network Error') || 
            error.message.includes('ERR_NETWORK') ||
            !error.response) {
          
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Network error detected (attempt ${this.retryCount}/${this.maxRetries}), trying to find working backend...`);
            
            try {
              // First check if current URL is working
              const currentUrl = this.client.defaults.baseURL || API_BASE_URL;
              const currentWorking = await testBackendUrl(currentUrl, true);
              
              if (currentWorking) {
                // Current URL is working, just retry
                return this.client.request(error.config);
              }
              
              // Current URL not working, try to find a working one (silently)
              const workingUrl = await findWorkingBackendUrl(true);
              
              if (workingUrl && workingUrl !== currentUrl) {
                console.log(`🔄 Switching to working backend: ${workingUrl}`);
                this.client.defaults.baseURL = workingUrl;
                API_BASE_URL = workingUrl;
                // Retry the original request
                return this.client.request(error.config);
              } else {
                // Fallback to environment variable
                const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
                if (envUrl && envUrl !== currentUrl) {
                  console.log(`🔄 Trying environment URL: ${envUrl}`);
                  this.client.defaults.baseURL = envUrl;
                  API_BASE_URL = envUrl;
                  return this.client.request(error.config);
                }
              }
            } catch (retryError) {
              console.error('❌ Failed to find working backend:', retryError);
            }
          } else {
            console.error('❌ Max retries reached. Could not find working backend URL.');
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async initializeBackendUrl() {
    try {
      // First, check if environment variable is set (highest priority)
      const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      if (envUrl) {
        // Test the environment URL first (silently)
        const isWorking = await testBackendUrl(envUrl, true);
        if (isWorking) {
          console.log(`✅ Using environment backend URL: ${envUrl}`);
          this.client.defaults.baseURL = envUrl;
          API_BASE_URL = envUrl;
          return;
        }
      }
      
      // If env URL doesn't work or isn't set, try to find a working URL
      const workingUrl = await findWorkingBackendUrl(true); // Silent mode
      if (workingUrl) {
        console.log(`✅ Initialized with working backend URL: ${workingUrl}`);
        this.client.defaults.baseURL = workingUrl;
        API_BASE_URL = workingUrl;
      } else {
        // Fallback to environment variable or default
        if (envUrl) {
          console.log(`⚠️ Environment backend URL not accessible, using anyway: ${envUrl}`);
          this.client.defaults.baseURL = envUrl;
          API_BASE_URL = envUrl;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not initialize backend URL, using default:', API_BASE_URL);
    }
  }

  async searchGames(query: string): Promise<SearchResponse> {
    const response = await this.client.get('/rawg/search', {
      params: { q: query },
    });
    return response.data;
  }

  async getGameBySlug(slug: string): Promise<Game> {
    const response = await this.client.get('/rawg/game', {
      params: { slug },
    });
    return response.data;
  }

  async getAwardWinningGames(limit: number = 10): Promise<Game[]> {
    try {
      // Try to fetch highly rated games (award winners are typically highly rated)
      // Using search with common award-winning game names as a proxy
      const awardWinners = [
        'Baldur\'s Gate 3',
        'The Legend of Zelda: Tears of the Kingdom',
        'Elden Ring',
        'God of War Ragnarök',
        'It Takes Two',
        'The Last of Us Part II',
        'Sekiro: Shadows Die Twice',
        'Red Dead Redemption 2',
        'The Witcher 3',
        'Hades'
      ];
      
      const games: Game[] = [];
      for (const gameName of awardWinners.slice(0, limit)) {
        try {
          const searchResult = await this.searchGames(gameName);
          if (searchResult.results && searchResult.results.length > 0) {
            const game = searchResult.results[0];
            // Only add if it has a high rating
            if (game.rating && game.rating > 4.0) {
              games.push(game);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch ${gameName}:`, error);
        }
      }
      return games;
    } catch (error) {
      console.error('Error fetching award-winning games:', error);
      return [];
    }
  }

  async upsertGame(game: UpsertGameRequest): Promise<{ id: string }> {
    const response = await this.client.post('/games/upsert', game);
    return response.data;
  }

  async getSimilarGames(embedding: number[], limit: number = 10): Promise<SimilarGame[]> {
    const response = await this.client.get('/games/similar', {
      params: {
        embedding: embedding.join(','),
        limit,
      },
    });
    return response.data;
  }

  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // New method: Get recommendations using gpt-3.5-turbo
  async getRecommendations(favouriteGames: string[]): Promise<{
    recommendations: any[]; // Now returns an array of game objects with images
    model: string;
    favourites: string;
  }> {
    // Ensure initialization is complete before making the request
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    
    // First, verify backend is accessible
    try {
      const healthCheck = await this.healthCheck();
      console.log('✅ Backend health check passed:', healthCheck);
    } catch (healthError) {
      console.error('❌ Backend health check failed:', healthError);
      throw new Error('Backend server is not accessible. Please check if the server is running.');
    }
    
    try {
      console.log('🤖 Requesting AI recommendations (this may take 30-60 seconds)...');
      const response = await this.client.get('/games/recommendations', {
        params: {
          favourites: favouriteGames.join(', '),
        },
        timeout: 60000, // Increased to 60 seconds for AI recommendations
      });
      console.log('✅ AI recommendations received successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Recommendations API error:', error.message);
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timed out. The AI recommendation service may be slow or unavailable. Please try again in a moment.');
      }
      
      // Handle OpenAI key not configured
      if (error.response?.status === 503 || error.response?.data?.includes('OpenAI key not configured')) {
        throw new Error('AI recommendations are not configured. Please contact support.');
      }
      
      // If we get a network error, try to find a working URL and retry once
      if ((error.code === 'NETWORK_ERROR' || 
           error.message?.includes('Network Error') || 
           error.message?.includes('ERR_NETWORK') ||
           !error.response) && this.retryCount === 0) {
        console.log('🔄 Retrying with working backend URL...');
        this.retryCount = 1; // Prevent infinite loops
        const workingUrl = await findWorkingBackendUrl(true); // Silent mode
        if (workingUrl && workingUrl !== this.client.defaults.baseURL) {
          this.client.defaults.baseURL = workingUrl;
          API_BASE_URL = workingUrl;
          console.log(`✅ Retrying with URL: ${workingUrl}`);
          // Retry the request once
          return this.client.get('/games/recommendations', {
            params: {
              favourites: favouriteGames.join(', '),
            },
            timeout: 60000, // Increased timeout for retry
          }).then(res => {
            this.retryCount = 0; // Reset on success
            return res.data;
          });
        }
      }
      throw error;
    }
  }

  // Test method: Get mock recommendations without OpenAI
  async getTestRecommendations(favouriteGames: string[]): Promise<{
    recommendations: any[];
    model: string;
    favourites: string;
  }> {
    const response = await this.client.get('/games/test-recommendations', {
      params: {
        favourites: favouriteGames.join(', '),
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
