// Direct test of favourites functionality
const { FavoritesService } = require('./lib/favourites');

async function testFavoritesService() {
  console.log('🧪 Testing FavoritesService...\n');

  const testGame = {
    id: 'test-game-123',
    name: 'Test Game',
    slug: 'test-game-123',
    image: 'https://example.com/image.jpg'
  };

  try {
    console.log('1. Testing addFavorite...');
    await FavoritesService.addFavorite(testGame.id, testGame.name, testGame.slug, testGame.image);
    console.log('✅ addFavorite completed without syntax errors');
  } catch (error) {
    console.log('❌ addFavorite failed:', error.message);
  }

  try {
    console.log('2. Testing isFavorited...');
    const isFavorited = await FavoritesService.isFavorited(testGame.slug);
    console.log('✅ isFavorited completed:', isFavorited);
  } catch (error) {
    console.log('❌ isFavorited failed:', error.message);
  }

  try {
    console.log('3. Testing getFavorites...');
    const favourites = await FavoritesService.getFavorites();
    console.log('✅ getFavorites completed, found', favourites.length, 'favourites');
  } catch (error) {
    console.log('❌ getFavorites failed:', error.message);
  }

  try {
    console.log('4. Testing toggleFavorite...');
    const result = await FavoritesService.toggleFavorite(testGame.id, testGame.name, testGame.slug, testGame.image);
    console.log('✅ toggleFavorite completed:', result);
  } catch (error) {
    console.log('❌ toggleFavorite failed:', error.message);
  }

  try {
    console.log('5. Testing removeFavorite...');
    await FavoritesService.removeFavorite(testGame.slug);
    console.log('✅ removeFavorite completed');
  } catch (error) {
    console.log('❌ removeFavorite failed:', error.message);
  }

  console.log('\n🏁 FavoritesService test completed');
}

// Run the test
testFavoritesService().catch(console.error);
