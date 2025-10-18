import { apiClient } from '../../lib/api';

// Mock axios
jest.mock('axios');
const mockedAxios = require('axios');

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchGames', () => {
    it('should call the correct endpoint with query parameter', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, name: 'Test Game', slug: 'test-game' }
          ],
          count: 1
        }
      };
      
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await apiClient.searchGames('test query');
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors gracefully', async () => {
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Network error'))
      });

      await expect(apiClient.searchGames('test')).rejects.toThrow('Network error');
    });
  });

  describe('upsertGame', () => {
    it('should call the correct endpoint with game data', async () => {
      const mockGame = {
        slug: 'test-game',
        name: 'Test Game',
        platforms: ['PC'],
        genres: ['Action'],
        store_urls: {},
        rubric: { completeness: 0.5, monetisation: 0.5, accessibility: 0.5, creativity: 0.5 }
      };

      const mockResponse = { data: { id: 'test-id' } };
      
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await apiClient.upsertGame(mockGame);
      
      expect(result).toEqual({ id: 'test-id' });
    });
  });

  describe('getSimilarGames', () => {
    it('should call the correct endpoint with embedding and limit', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResponse = {
        data: [
          { id: '1', name: 'Similar Game', similarity_score: 0.95 }
        ]
      };
      
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await apiClient.getSimilarGames(mockEmbedding, 5);
      
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('healthCheck', () => {
    it('should call the health endpoint', async () => {
      const mockResponse = { data: { status: 'ok' } };
      
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await apiClient.healthCheck();
      
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
