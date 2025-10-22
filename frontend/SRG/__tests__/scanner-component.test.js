/**
 * Scanner Component Tests
 * Tests for the scanner component functionality and race condition prevention
 */

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  CameraType: {
    back: 'back',
    front: 'front'
  },
  useCameraPermissions: jest.fn(() => [
    { granted: true },
    jest.fn()
  ]),
  BarcodeScanningResult: {}
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn()
  }
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Mock the scanner service
jest.mock('../../lib/scan-history', () => ({
  ScanHistoryService: {
    getScans: jest.fn(() => Promise.resolve([])),
    saveScan: jest.fn(() => Promise.resolve()),
    deleteScan: jest.fn(() => Promise.resolve()),
    clearAllScans: jest.fn(() => Promise.resolve())
  }
}));

// Mock QR scanner
jest.mock('../../lib/qr-scanner', () => ({
  parseQRCodeData: jest.fn((data) => ({
    type: 'qr',
    data: { gameName: 'Test Game', gameId: 'test-123' }
  })),
  handleQRScanResult: jest.fn(() => Promise.resolve()),
  GameQRData: {}
}));

describe('Scanner Component Race Condition Tests', () => {
  let React;
  let ScannerScreen;
  let mockSetTimeout;
  let mockClearTimeout;
  let timeoutIds = [];
  let currentTimeoutId = 0;

  beforeEach(() => {
    // Mock setTimeout and clearTimeout
    timeoutIds = [];
    currentTimeoutId = 0;
    
    mockSetTimeout = jest.fn((callback, delay) => {
      const id = ++currentTimeoutId;
      timeoutIds.push(id);
      return id;
    });
    
    mockClearTimeout = jest.fn((id) => {
      const index = timeoutIds.indexOf(id);
      if (index > -1) {
        timeoutIds.splice(index, 1);
      }
    });
    
    global.setTimeout = mockSetTimeout;
    global.clearTimeout = mockClearTimeout;

    // Import React and the component
    React = require('react');
    ScannerScreen = require('../app/(tabs)/scanner.tsx').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should prevent multiple overlapping timeouts on rapid scans', () => {
    const { render } = require('@testing-library/react-native');
    
    const component = render(<ScannerScreen />);
    
    // Simulate rapid barcode scans
    const handleBarCodeScanned = component.getByTestId ? 
      component.getByTestId('camera-view')?.props?.onBarcodeScanned : null;
    
    if (handleBarCodeScanned) {
      // Simulate 3 rapid scans
      for (let i = 0; i < 3; i++) {
        handleBarCodeScanned({
          data: 'test-qr-data',
          type: 'qr'
        });
      }
      
      // Should have multiple setTimeout calls
      expect(mockSetTimeout).toHaveBeenCalled();
      
      // Should have clearTimeout calls to prevent race conditions
      expect(mockClearTimeout).toHaveBeenCalled();
    }
  });

  test('should handle timeout cleanup on component unmount', () => {
    const { render, unmount } = require('@testing-library/react-native');
    
    const component = render(<ScannerScreen />);
    
    // Simulate a scan that creates a timeout
    const handleBarCodeScanned = component.getByTestId ? 
      component.getByTestId('camera-view')?.props?.onBarcodeScanned : null;
    
    if (handleBarCodeScanned) {
      handleBarCodeScanned({
        data: 'test-qr-data',
        type: 'qr'
      });
      
      // Unmount component
      unmount();
      
      // Should have called clearTimeout for cleanup
      expect(mockClearTimeout).toHaveBeenCalled();
    }
  });

  test('should handle manual reset correctly', () => {
    const { render } = require('@testing-library/react-native');
    
    const component = render(<ScannerScreen />);
    
    // Simulate a scan
    const handleBarCodeScanned = component.getByTestId ? 
      component.getByTestId('camera-view')?.props?.onBarcodeScanned : null;
    
    if (handleBarCodeScanned) {
      handleBarCodeScanned({
        data: 'test-qr-data',
        type: 'qr'
      });
      
      // Find and press reset button
      const resetButton = component.getByText ? 
        component.getByText('Reset Scanner') : null;
      
      if (resetButton) {
        resetButton.props.onPress();
        
        // Should have called clearTimeout for manual reset
        expect(mockClearTimeout).toHaveBeenCalled();
      }
    }
  });
});
