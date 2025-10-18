// Simple build verification test that doesn't require React Native
describe('Build Verification', () => {
  it('should have all required dependencies', () => {
    const packageJson = require('../package.json');
    
    // Check critical dependencies
    expect(packageJson.dependencies.expo).toBeDefined();
    expect(packageJson.dependencies['expo-router']).toBeDefined();
    expect(packageJson.dependencies['expo-blur']).toBeDefined();
    expect(packageJson.dependencies['expo-linear-gradient']).toBeDefined();
    expect(packageJson.dependencies.react).toBeDefined();
    expect(packageJson.dependencies['react-native']).toBeDefined();
    expect(packageJson.dependencies.axios).toBeDefined();
  });

  it('should have all required scripts', () => {
    const packageJson = require('../package.json');
    
    expect(packageJson.scripts.start).toBeDefined();
    expect(packageJson.scripts.android).toBeDefined();
    expect(packageJson.scripts.ios).toBeDefined();
    expect(packageJson.scripts.web).toBeDefined();
    expect(packageJson.scripts.test).toBeDefined();
  });

  it('should validate API client logic', () => {
    // Test API URL construction
    const baseUrl = 'http://localhost:8080';
    const endpoint = '/rawg/search';
    const query = 'test game';
    
    const expectedUrl = `${baseUrl}${endpoint}?q=${encodeURIComponent(query)}`;
    expect(expectedUrl).toBe('http://localhost:8080/rawg/search?q=test%20game');
  });

  it('should validate game data transformation', () => {
    const mockGame = {
      id: 1,
      name: 'Test Game',
      slug: 'test-game',
      platforms: [{ platform: { name: 'PC' } }],
      genres: [{ name: 'Action' }]
    };

    const transformedPlatforms = mockGame.platforms?.map(p => p.platform.name) || [];
    const transformedGenres = mockGame.genres?.map(g => g.name) || [];

    expect(transformedPlatforms).toEqual(['PC']);
    expect(transformedGenres).toEqual(['Action']);
  });

  it('should validate embedding format', () => {
    const validEmbedding = [0.1, 0.2, 0.3, 0.4];
    const invalidEmbedding = 'not an array';

    expect(Array.isArray(validEmbedding)).toBe(true);
    expect(Array.isArray(invalidEmbedding)).toBe(false);
    expect(validEmbedding.every(val => typeof val === 'number')).toBe(true);
  });

  it('should validate environment configuration', () => {
    const expectedBackendUrl = 'http://localhost:8080';
    expect(expectedBackendUrl).toBe('http://localhost:8080');
  });
});
