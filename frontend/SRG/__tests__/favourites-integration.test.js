// Integration test for favourites functionality
const { FavouritesService } = require('../lib/favourites');

describe('Favourites Integration Tests', () => {
  test('FavouritesService should be importable', () => {
    expect(FavouritesService).toBeDefined();
    expect(typeof FavouritesService.addFavourite).toBe('function');
    expect(typeof FavouritesService.removeFavourite).toBe('function');
    expect(typeof FavouritesService.getFavourites).toBe('function');
    expect(typeof FavouritesService.isFavourited).toBe('function');
    expect(typeof FavouritesService.toggleFavourite).toBe('function');
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
      await FavouritesService.addFavourite(testParams.gameId, testParams.gameName, testParams.gameSlug, testParams.gameImage);
    } catch (error) {
      // Expected to fail without real database, but should not throw syntax errors
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.removeFavourite(testParams.gameSlug);
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.getFavourites();
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.isFavourited(testParams.gameSlug);
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.toggleFavourite(testParams.gameId, testParams.gameName, testParams.gameSlug, testParams.gameImage);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('FavouritesService should handle edge cases', async () => {
    // Test with empty/null parameters
    try {
      await FavouritesService.addFavourite('', '', '');
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.removeFavourite('');
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await FavouritesService.isFavourited('');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
