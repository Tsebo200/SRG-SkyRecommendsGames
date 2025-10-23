import axios from 'axios';
import { getBackendUrl, getBestBackendUrl } from './network-config';

// Get the backend URL with automatic detection
const API_BASE_URL = getBackendUrl();

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

  constructor() {
    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
        return response;
      },
      async (error) => {
        console.error('❌ API Response Error:', error.message);
        
        // If it's a network error, try to find a working backend URL
        if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
          console.log('🔄 Network error detected, trying to find working backend...');
          try {
            const workingUrl = await getBestBackendUrl();
            if (workingUrl && workingUrl !== API_BASE_URL) {
              console.log(`🔄 Switching to working backend: ${workingUrl}`);
              this.client.defaults.baseURL = workingUrl;
              // Retry the original request
              return this.client.request(error.config);
            }
          } catch (retryError) {
            console.error('❌ Failed to find working backend:', retryError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async searchGames(query: string): Promise<SearchResponse> {
    const response = await this.client.get('/rawg/search', {
      params: { q: query },
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
    const response = await this.client.get('/games/recommendations', {
      params: {
        favourites: favouriteGames.join(', '),
      },
      timeout: 45000, // 45 seconds for AI recommendations (longer than default)
    });
    return response.data;
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
