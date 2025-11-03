import axios from 'axios';
import { getBackendUrl, getBestBackendUrl, findWorkingBackendUrl } from './network-config';

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
        console.error('❌ API Response Error:', error.message);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          baseURL: this.client.defaults.baseURL,
          url: error.config?.url,
        });
        
        // If it's a network error, try to find a working backend URL
        if (error.code === 'NETWORK_ERROR' || 
            error.message.includes('Network Error') || 
            error.message.includes('ERR_NETWORK') ||
            !error.response) {
          
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Network error detected (attempt ${this.retryCount}/${this.maxRetries}), trying to find working backend...`);
            
            try {
              // Try to find a working backend URL
              const workingUrl = await findWorkingBackendUrl();
              
              if (workingUrl && workingUrl !== this.client.defaults.baseURL) {
                console.log(`🔄 Switching to working backend: ${workingUrl}`);
                this.client.defaults.baseURL = workingUrl;
                API_BASE_URL = workingUrl;
                // Retry the original request
                return this.client.request(error.config);
              } else if (workingUrl) {
                console.log('✅ Found working URL, but it matches current URL');
                // Still retry - might be a temporary network issue
                return this.client.request(error.config);
              } else {
                // Fallback to environment variable
                const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
                if (envUrl && envUrl !== this.client.defaults.baseURL) {
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
      // Try to find a working backend URL on initialization
      const workingUrl = await findWorkingBackendUrl();
      if (workingUrl) {
        console.log(`✅ Initialized with working backend URL: ${workingUrl}`);
        this.client.defaults.baseURL = workingUrl;
        API_BASE_URL = workingUrl;
      } else {
        // Fallback to environment variable or default
        const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
        if (envUrl) {
          console.log(`✅ Using environment backend URL: ${envUrl}`);
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
    
    try {
      const response = await this.client.get('/games/recommendations', {
        params: {
          favourites: favouriteGames.join(', '),
        },
        timeout: 45000, // 45 seconds for AI recommendations (longer than default)
      });
      return response.data;
    } catch (error: any) {
      // If we get a network error, try to find a working URL and retry once
      if ((error.code === 'NETWORK_ERROR' || 
           error.message?.includes('Network Error') || 
           error.message?.includes('ERR_NETWORK') ||
           !error.response) && this.retryCount === 0) {
        console.log('🔄 Retrying with working backend URL...');
        this.retryCount = 1; // Prevent infinite loops
        const workingUrl = await findWorkingBackendUrl();
        if (workingUrl && workingUrl !== this.client.defaults.baseURL) {
          this.client.defaults.baseURL = workingUrl;
          API_BASE_URL = workingUrl;
          console.log(`✅ Retrying with URL: ${workingUrl}`);
          // Retry the request once
          return this.client.get('/games/recommendations', {
            params: {
              favourites: favouriteGames.join(', '),
            },
            timeout: 45000,
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
