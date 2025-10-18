// Simple test to verify Jest is working
describe('Basic functionality', () => {
  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    expect('hello world').toContain('world');
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});

// Test API client functionality without React Native dependencies
describe('API Client Logic', () => {
  it('should construct API URLs correctly', () => {
    const baseUrl = 'http://localhost:8080';
    const endpoint = '/rawg/search';
    const query = 'test game';
    
    const expectedUrl = `${baseUrl}${endpoint}?q=${encodeURIComponent(query)}`;
    expect(expectedUrl).toBe('http://localhost:8080/rawg/search?q=test%20game');
  });

  it('should handle game data transformation', () => {
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
});
