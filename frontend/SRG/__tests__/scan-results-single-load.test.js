/**
 * Test to ensure scan-results screen only loads data once
 * and doesn't trigger multiple useEffect executions
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ScanResultsScreen from '../app/scan-results';

// Mock the API client and services
jest.mock('../lib/api', () => ({
  apiClient: {
    searchGames: jest.fn().mockResolvedValue({
      results: [{
        id: 'test-game-id',
        name: 'Test Game',
        slug: 'test-game',
        platforms: ['PlayStation 5'],
        genres: ['Action', 'RPG']
      }]
    })
  }
}));

jest.mock('../lib/favourites-hybrid', () => ({
  HybridFavouritesService: {
    getFavourites: jest.fn().mockResolvedValue([]),
    addFavourite: jest.fn().mockResolvedValue({}),
    removeFavourite: jest.fn().mockResolvedValue({})
  }
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    back: jest.fn()
  }
}));

describe('Scan Results Single Load Test', () => {
  let mockUseLocalSearchParams;
  let mockSearchGames;
  let mockGetFavourites;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the search params
    mockUseLocalSearchParams = require('expo-router').useLocalSearchParams;
    mockUseLocalSearchParams.mockReturnValue({
      scanData: JSON.stringify({
        gameName: 'Test Game',
        coverArt: 'https://example.com/cover.jpg',
        platform: 'PlayStation 5',
        rating: '85/100',
        description: 'Test game description',
        genres: ['Action', 'RPG']
      })
    });

    // Mock API calls
    const api = require('../lib/api');
    mockSearchGames = api.apiClient.searchGames;

    const favourites = require('../lib/favourites-hybrid');
    mockGetFavourites = favourites.HybridFavouritesService.getFavourites;
  });

  test('should only load data once on component mount', async () => {
    const { getByText } = render(<ScanResultsScreen />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(mockSearchGames).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Should only call searchGames once
    expect(mockSearchGames).toHaveBeenCalledWith('Test Game');
    
    // Should only call getFavourites once
    expect(mockGetFavourites).toHaveBeenCalledTimes(1);
  });

  test('should not reload data on component re-render', async () => {
    const { rerender } = render(<ScanResultsScreen />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(mockSearchGames).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Re-render component
    rerender(<ScanResultsScreen />);
    
    // Wait a bit to ensure no additional calls
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Should still only be called once
    expect(mockSearchGames).toHaveBeenCalledTimes(1);
    expect(mockGetFavourites).toHaveBeenCalledTimes(1);
  });

  test('should handle missing scanData gracefully', async () => {
    // Mock empty scanData
    mockUseLocalSearchParams.mockReturnValue({
      scanData: null
    });

    const { getByText } = render(<ScanResultsScreen />);
    
    // Should not call searchGames with null data
    await waitFor(() => {
      expect(mockSearchGames).not.toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  test('should handle API errors gracefully', async () => {
    // Mock API error
    mockSearchGames.mockRejectedValue(new Error('API Error'));

    const { getByText } = render(<ScanResultsScreen />);
    
    // Should still attempt to call the API once
    await waitFor(() => {
      expect(mockSearchGames).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  test('should not trigger multiple useEffect executions', async () => {
    let renderCount = 0;
    
    // Create a wrapper that counts renders
    const TestWrapper = () => {
      renderCount++;
      return <ScanResultsScreen />;
    };

    const { rerender } = render(<TestWrapper />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(mockSearchGames).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Force multiple re-renders
    for (let i = 0; i < 5; i++) {
      rerender(<TestWrapper />);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Should still only call API once despite multiple renders
    expect(mockSearchGames).toHaveBeenCalledTimes(1);
    expect(renderCount).toBeGreaterThan(1); // Confirms multiple renders occurred
  });
});
