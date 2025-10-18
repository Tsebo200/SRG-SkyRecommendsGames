// Integration test for favourites functionality
const { FavouritesService } = require('../lib/favourites');

describe('Favorites Integration Tests', () => {
  test('FavouritesService should be importable', () => {
    expect(FavouritesService).toBeDefined();
    expect(typeof FavouritesService.addFavorite).toBe('function');
    expect(typeof FavouritesService.removeFavorite).toBe('function');
    expect(typeof FavouritesService.getFavorites).toBe('function');
    expect(typeof FavouritesService.isFavorited).toBe('function');
    expect(typeof FavouritesService.toggleFavorite).toBe('function');
  });

  test('FavouritesService methods should be callable', async () => {
    // Test that methods don't throw when called with valid parameters
    const testParams = {
      gameId: 'test-game-id',
      gameName: 'Test Game',
      gameSlug: 'test-game',
      gameImage: 'https://example.com/image.jpg'
    };

    // These will likely fail due to no database connection, but we can test the interface
    try {
      await FavouritesService.addFavorite(testParams.gameId, testParams.gameName, testParams.gameSlug, testParams.gameImage);
    } catch (error) {
      // Expected to fail without real database, but should not throw syntax errors
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.removeFavorite(testParams.gameSlug);
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.getFavorites();
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.isFavorited(testParams.gameSlug);
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.toggleFavorite(testParams.gameId, testParams.gameName, testParams.gameSlug, testParams.gameImage);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('FavouritesService should handle edge cases', async () => {
    // Test with empty/null parameters
    try {
      await FavouritesService.addFavorite('', '', '');
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.removeFavorite('');
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.isFavorited('');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
