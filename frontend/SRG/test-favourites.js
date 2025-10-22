// Direct test of favourites functionality
const { FavouritesService } = require('./lib/favourites');

async function testFavouritesService() {
  console.log('🧪 Testing FavouritesService...\n');

  const testGame = {
    id: 'test-game-123',
    name: 'Test Game',
    slug: 'test-game-123',
    image: 'https://example.com/image.jpg'
  };

  try {
    console.log('1. Testing addFavourite...');
    await FavouritesService.addFavourite(testGame.id, testGame.name, testGame.slug, testGame.image);
    console.log('✅ addFavourite completed without syntax errors');
  } catch (error) {
    console.log('❌ addFavourite failed:', error.message);
  }

  try {
    console.log('2. Testing isFavourited...');
    const isFavourited = await FavouritesService.isFavourited(testGame.slug);
    console.log('✅ isFavourited completed:', isFavourited);
  } catch (error) {
    console.log('❌ isFavourited failed:', error.message);
  }

  try {
    console.log('3. Testing getFavourites...');
    const favourites = await FavouritesService.getFavourites();
    console.log('✅ getFavourites completed, found', favourites.length, 'favourites');
  } catch (error) {
    console.log('❌ getFavourites failed:', error.message);
  }

  try {
    console.log('4. Testing toggleFavourite...');
    const result = await FavouritesService.toggleFavourite(testGame.id, testGame.name, testGame.slug, testGame.image);
    console.log('✅ toggleFavourite completed:', result);
  } catch (error) {
    console.log('❌ toggleFavourite failed:', error.message);
  }

  try {
    console.log('5. Testing removeFavourite...');
    await FavouritesService.removeFavourite(testGame.slug);
    console.log('✅ removeFavourite completed');
  } catch (error) {
    console.log('❌ removeFavourite failed:', error.message);
  }

  console.log('\n🏁 FavouritesService test completed');
}

// Run the test
testFavouritesService().catch(console.error);
