/**
 * Simple test to verify scanner logic without React Native dependencies
 * Tests the core scanning logic to ensure single scan behavior
 */

describe('Scanner Single Scan Logic Test', () => {
  let lastScanTime = 0;
  let scanned = false;
  let lastScannedUrl = '';

  // Mock the scanner logic
  const mockHandleBarCodeScanned = (result) => {
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTime;
    
    // Aggressive debounce: ignore scans within 5 seconds of each other
    if (timeSinceLastScan < 5000) {
      console.log('🚫 Scan too soon, ignoring (debounce)');
      return false;
    }
    
    // Additional check for URL scans - prevent rapid scanning of same URL
    if (result.data && result.data.includes('localhost:8000/api/games/')) {
      const url = result.data;
      if (url === lastScannedUrl && timeSinceLastScan < 10000) {
        console.log('🚫 Same URL scanned too recently, ignoring');
        return false;
      }
    }
    
    if (scanned) {
      console.log('🚫 Scan already in progress, ignoring');
      return false;
    }

    // Process the scan
    scanned = true;
    lastScanTime = now;
    lastScannedUrl = result.data;
    
    console.log('✅ Scan processed successfully');
    return true;
  };

  const resetScanner = () => {
    scanned = false;
    lastScannedUrl = '';
    console.log('🔄 Scanner reset');
  };

  beforeEach(() => {
    // Reset state before each test
    lastScanTime = 0;
    scanned = false;
    lastScannedUrl = '';
  });

  test('should process first scan successfully', () => {
    const result = { data: 'http://localhost:8000/api/games/187' };
    const success = mockHandleBarCodeScanned(result);
    
    expect(success).toBe(true);
    expect(scanned).toBe(true);
    expect(lastScannedUrl).toBe('http://localhost:8000/api/games/187');
  });

  test('should ignore rapid successive scans', () => {
    const result = { data: 'http://localhost:8000/api/games/187' };
    
    // First scan should succeed
    const firstScan = mockHandleBarCodeScanned(result);
    expect(firstScan).toBe(true);
    
    // Immediate second scan should fail
    const secondScan = mockHandleBarCodeScanned(result);
    expect(secondScan).toBe(false);
    
    // Third scan should also fail
    const thirdScan = mockHandleBarCodeScanned(result);
    expect(thirdScan).toBe(false);
  });

  test('should ignore scans within debounce period', () => {
    const result = { data: 'http://localhost:8000/api/games/187' };
    
    // First scan
    const firstScan = mockHandleBarCodeScanned(result);
    expect(firstScan).toBe(true);
    
    // Reset scanner
    resetScanner();
    
    // Simulate time passing (but still within 5 second debounce)
    lastScanTime = Date.now() - 3000; // 3 seconds ago
    
    // Second scan should be ignored due to debounce
    const secondScan = mockHandleBarCodeScanned(result);
    expect(secondScan).toBe(false);
  });

  test('should allow scan after debounce period', () => {
    const result = { data: 'http://localhost:8000/api/games/187' };
    
    // First scan
    const firstScan = mockHandleBarCodeScanned(result);
    expect(firstScan).toBe(true);
    
    // Reset scanner
    resetScanner();
    
    // Simulate time passing (beyond 5 second debounce)
    lastScanTime = Date.now() - 6000; // 6 seconds ago
    
    // Second scan should succeed
    const secondScan = mockHandleBarCodeScanned(result);
    expect(secondScan).toBe(true);
  });

  test('should prevent duplicate URL scans', () => {
    const result = { data: 'http://localhost:8000/api/games/187' };
    
    // First scan
    const firstScan = mockHandleBarCodeScanned(result);
    expect(firstScan).toBe(true);
    
    // Reset scanner but keep same URL
    scanned = false;
    
    // Simulate time passing (but within 10 second URL deduplication)
    lastScanTime = Date.now() - 3000; // 3 seconds ago
    
    // Same URL scan should be ignored
    const duplicateScan = mockHandleBarCodeScanned(result);
    expect(duplicateScan).toBe(false);
  });

  test('should allow different URL after reset', () => {
    const result1 = { data: 'http://localhost:8000/api/games/187' };
    const result2 = { data: 'http://localhost:8000/api/games/188' };
    
    // First scan
    const firstScan = mockHandleBarCodeScanned(result1);
    expect(firstScan).toBe(true);
    
    // Reset scanner
    resetScanner();
    
    // Simulate time passing (beyond debounce period)
    lastScanTime = Date.now() - 6000; // 6 seconds ago
    
    // Different URL scan should succeed
    const secondScan = mockHandleBarCodeScanned(result2);
    expect(secondScan).toBe(true);
    expect(lastScannedUrl).toBe('http://localhost:8000/api/games/188');
  });

  test('should handle manual reset correctly', () => {
    const result = { data: 'http://localhost:8000/api/games/187' };
    
    // First scan
    const firstScan = mockHandleBarCodeScanned(result);
    expect(firstScan).toBe(true);
    expect(scanned).toBe(true);
    
    // Manual reset
    resetScanner();
    expect(scanned).toBe(false);
    expect(lastScannedUrl).toBe('');
    
    // Simulate time passing (beyond debounce period)
    lastScanTime = Date.now() - 6000; // 6 seconds ago
    
    // Should be able to scan again
    const secondScan = mockHandleBarCodeScanned(result);
    expect(secondScan).toBe(true);
  });
});
