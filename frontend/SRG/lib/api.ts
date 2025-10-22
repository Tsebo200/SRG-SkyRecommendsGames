import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';

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
  }>;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  stores?: Array<{
    store: {
      id: number;
      name: string;
    };
    url: string;
  }>;
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
    timeout: 10000,
  });

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
    recommendations: string;
    model: string;
    favourites: string;
  }> {
    const response = await this.client.get('/games/recommendations', {
      params: {
        favourites: favouriteGames.join(', '),
      },
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
