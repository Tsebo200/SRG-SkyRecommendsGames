import { FavouritesService } from '../lib/favourites';
import { supabase } from '../lib/supabase';

// Mock Supabase for testing
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        order: jest.fn(() => ({
          order: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}));

describe('FavouritesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addFavourite', () => {
    it('should create game and add to favourites when game does not exist', async () => {
      const mockGameId = 'test-game-id';
      const mockGameName = 'Test Game';
      const mockGameSlug = 'test-game';
      const mockGameImage = 'https://example.com/image.jpg';

      // Mock game doesn't exist
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue({ code: 'PGRST116' })
          })
        })
      });

      // Mock game creation
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockGameId },
              error: null
            })
          })
        })
      });

      // Mock favourites insertion
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: null
        })
      });

      await expect(FavouritesService.addFavourite(mockGameId, mockGameName, mockGameSlug, mockGameImage))
        .resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith('games');
      expect(supabase.from).toHaveBeenCalledWith('favourites');
    });

    it('should add to favourites when game already exists', async () => {
      const mockGameId = 'existing-game-id';
      const mockGameName = 'Existing Game';
      const mockGameSlug = 'existing-game';

      // Mock game exists
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockGameId },
              error: null
            })
          })
        })
      });

      // Mock favourites insertion
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: null
        })
      });

      await expect(FavouritesService.addFavourite(mockGameId, mockGameName, mockGameSlug))
        .resolves.not.toThrow();
    });

    it('should throw error when game creation fails', async () => {
      const mockError = new Error('Database error');

      // Mock game doesn't exist
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue({ code: 'PGRST116' })
          })
        })
      });

      // Mock game creation failure
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      await expect(FavouritesService.addFavourite('test-id', 'Test Game', 'test-game'))
        .rejects.toThrow('Database error');
    });
  });

  describe('removeFavourite', () => {
    it('should remove favourite when game exists', async () => {
      const mockGameSlug = 'test-game';
      const mockGameId = 'test-game-id';

      // Mock game lookup
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockGameId },
              error: null
            })
          })
        })
      });

      // Mock favourites deletion
      (supabase.from as jest.Mock).mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      await expect(FavouritesService.removeFavourite(mockGameSlug))
        .resolves.not.toThrow();
    });

    it('should throw error when game does not exist', async () => {
      const mockGameSlug = 'non-existent-game';

      // Mock game not found
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue({ code: 'PGRST116' })
          })
        })
      });

      await expect(FavouritesService.removeFavourite(mockGameSlug))
        .rejects.toThrow();
    });
  });

  describe('getFavourites', () => {
    it('should return user favourites with game data', async () => {
      const mockFavourites = [
        {
          user_id: 'user-1',
          game_id: 'game-1',
          created_at: '2023-01-01T00:00:00Z',
          games: {
            name: 'Test Game 1',
            slug: 'test-game-1',
            platforms: ['PC', 'PS5'],
            genres: ['Action', 'Adventure']
          }
        }
      ];

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockFavourites,
            error: null
          })
        })
      });

      const result = await FavouritesService.getFavourites();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        user_id: 'user-1',
        game_id: 'game-1',
        created_at: '2023-01-01T00:00:00Z',
        game_name: 'Test Game 1',
        game_slug: 'test-game-1',
        platforms: ['PC', 'PS5'],
        genres: ['Action', 'Adventure']
      });
    });

    it('should return empty array when no favourites', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await FavouritesService.getFavourites();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockError = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await expect(FavouritesService.getFavourites())
        .rejects.toThrow('Database error');
    });
  });

  describe('isFavourited', () => {
    it('should return true when game is favourited', async () => {
      const mockGameSlug = 'test-game';
      const mockGameId = 'test-game-id';

      // Mock game lookup
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockGameId },
              error: null
            })
          })
        })
      });

      // Mock favourites check
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { game_id: mockGameId },
              error: null
            })
          })
        })
      });

      const result = await FavouritesService.isFavourited(mockGameSlug);

      expect(result).toBe(true);
    });

    it('should return false when game is not favourited', async () => {
      const mockGameSlug = 'test-game';
      const mockGameId = 'test-game-id';

      // Mock game lookup
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockGameId },
              error: null
            })
          })
        })
      });

      // Mock favourites check - not found
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue({ code: 'PGRST116' })
          })
        })
      });

      const result = await FavouritesService.isFavourited(mockGameSlug);

      expect(result).toBe(false);
    });

    it('should return false when game does not exist', async () => {
      const mockGameSlug = 'non-existent-game';

      // Mock game not found
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue({ code: 'PGRST116' })
          })
        })
      });

      const result = await FavouritesService.isFavourited(mockGameSlug);

      expect(result).toBe(false);
    });
  });

  describe('toggleFavourite', () => {
    it('should add favourite when not favourited', async () => {
      const mockGameId = 'test-game-id';
      const mockGameName = 'Test Game';
      const mockGameSlug = 'test-game';

      // Mock isFavourited returns false
      jest.spyOn(FavouritesService, 'isFavourited').mockResolvedValue(false);
      jest.spyOn(FavouritesService, 'addFavourite').mockResolvedValue();

      const result = await FavouritesService.toggleFavourite(mockGameId, mockGameName, mockGameSlug);

      expect(result).toBe(true);
      expect(FavouritesService.addFavourite).toHaveBeenCalledWith(mockGameId, mockGameName, mockGameSlug, undefined);
    });

    it('should remove favourite when already favourited', async () => {
      const mockGameId = 'test-game-id';
      const mockGameName = 'Test Game';
      const mockGameSlug = 'test-game';

      // Mock isFavourited returns true
      jest.spyOn(FavouritesService, 'isFavourited').mockResolvedValue(true);
      jest.spyOn(FavouritesService, 'removeFavourite').mockResolvedValue();

      const result = await FavouritesService.toggleFavourite(mockGameId, mockGameName, mockGameSlug);

      expect(result).toBe(false);
      expect(FavouritesService.removeFavourite).toHaveBeenCalledWith(mockGameSlug);
    });
  });
});
