/**
 * Test to ensure scanner only processes one scan at a time
 * and prevents multiple result screens
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ScannerScreen from '../app/(tabs)/scanner';

// Mock the navigation and services
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('../lib/scan-history-improved', () => ({
  ScanHistoryService: {
    saveScan: jest.fn().mockResolvedValue({ id: 'test-id' }),
    getScans: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../lib/qr-scanner', () => ({
  parseQRCodeData: jest.fn(),
  handleQRScanResult: jest.fn(),
  fetchSkyScansGameData: jest.fn(),
}));

describe('Scanner Single Scan Test', () => {
  let mockParseQRCodeData;
  let mockHandleQRScanResult;
  let mockFetchSkyScansGameData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the QR scanner functions
    const qrScanner = require('../lib/qr-scanner');
    mockParseQRCodeData = qrScanner.parseQRCodeData;
    mockHandleQRScanResult = qrScanner.handleQRScanResult;
    mockFetchSkyScansGameData = qrScanner.fetchSkyScansGameData;
  });

  test('should only process one scan at a time', async () => {
    const { getByTestId } = render(<ScannerScreen />);
    
    // Mock successful QR code parsing
    mockParseQRCodeData.mockReturnValue({
      type: 'url',
      data: 'http://localhost:8000/api/games/187'
    });

    // Mock successful API fetch
    mockFetchSkyScansGameData.mockResolvedValue({
      gameName: 'Test Game',
      coverArt: 'https://example.com/cover.jpg',
      platform: 'PlayStation 5',
      rating: '85/100',
      description: 'Test game description'
    });

    // Mock navigation
    mockHandleQRScanResult.mockImplementation(() => {
      console.log('Navigation called');
    });

    // Simulate rapid multiple scans
    const scanResults = [
      { data: 'http://localhost:8000/api/games/187' },
      { data: 'http://localhost:8000/api/games/187' },
      { data: 'http://localhost:8000/api/games/187' }
    ];

    // Process multiple scans rapidly
    for (let i = 0; i < scanResults.length; i++) {
      const scanner = getByTestId('camera-view');
      fireEvent(scanner, 'barcodeScanned', scanResults[i]);
      
      // Small delay between scans
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for all async operations
    await waitFor(() => {
      // Should only call parseQRCodeData once (due to debouncing)
      expect(mockParseQRCodeData).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Should only call fetchSkyScansGameData once
    expect(mockFetchSkyScansGameData).toHaveBeenCalledTimes(1);
    
    // Should only call handleQRScanResult once
    expect(mockHandleQRScanResult).toHaveBeenCalledTimes(1);
  });

  test('should prevent multiple scans within debounce period', async () => {
    const { getByTestId } = render(<ScannerScreen />);
    
    mockParseQRCodeData.mockReturnValue({
      type: 'url',
      data: 'http://localhost:8000/api/games/187'
    });

    mockFetchSkyScansGameData.mockResolvedValue({
      gameName: 'Test Game',
      coverArt: 'https://example.com/cover.jpg',
      platform: 'PlayStation 5'
    });

    mockHandleQRScanResult.mockImplementation(() => {});

    // Simulate very rapid scans (within 5 second debounce)
    const scanner = getByTestId('camera-view');
    
    // First scan
    fireEvent(scanner, 'barcodeScanned', { data: 'http://localhost:8000/api/games/187' });
    
    // Immediate second scan (should be ignored)
    fireEvent(scanner, 'barcodeScanned', { data: 'http://localhost:8000/api/games/187' });
    
    // Immediate third scan (should be ignored)
    fireEvent(scanner, 'barcodeScanned', { data: 'http://localhost:8000/api/games/187' });

    await waitFor(() => {
      // Should only process the first scan
      expect(mockParseQRCodeData).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
  });

  test('should reset scanner state after successful scan', async () => {
    const { getByTestId } = render(<ScannerScreen />);
    
    mockParseQRCodeData.mockReturnValue({
      type: 'url',
      data: 'http://localhost:8000/api/games/187'
    });

    mockFetchSkyScansGameData.mockResolvedValue({
      gameName: 'Test Game',
      coverArt: 'https://example.com/cover.jpg',
      platform: 'PlayStation 5'
    });

    mockHandleQRScanResult.mockImplementation(() => {});

    const scanner = getByTestId('camera-view');
    
    // First scan
    fireEvent(scanner, 'barcodeScanned', { data: 'http://localhost:8000/api/games/187' });

    await waitFor(() => {
      expect(mockParseQRCodeData).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });

    // Wait for auto-reset (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3500));

    // Second scan after reset should work
    fireEvent(scanner, 'barcodeScanned', { data: 'http://localhost:8000/api/games/188' });

    await waitFor(() => {
      expect(mockParseQRCodeData).toHaveBeenCalledTimes(2);
    }, { timeout: 2000 });
  });

  test('should handle URL deduplication correctly', async () => {
    const { getByTestId } = render(<ScannerScreen />);
    
    mockParseQRCodeData.mockReturnValue({
      type: 'url',
      data: 'http://localhost:8000/api/games/187'
    });

    mockFetchSkyScansGameData.mockResolvedValue({
      gameName: 'Test Game',
      coverArt: 'https://example.com/cover.jpg',
      platform: 'PlayStation 5'
    });

    mockHandleQRScanResult.mockImplementation(() => {});

    const scanner = getByTestId('camera-view');
    
    // First scan
    fireEvent(scanner, 'barcodeScanned', { data: 'http://localhost:8000/api/games/187' });

    await waitFor(() => {
      expect(mockParseQRCodeData).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });

    // Same URL scan immediately (should be ignored due to URL deduplication)
    fireEvent(scanner, 'barcodeScanned', { data: 'http://localhost:8000/api/games/187' });

    // Should still only be called once
    expect(mockParseQRCodeData).toHaveBeenCalledTimes(1);
  });
});
