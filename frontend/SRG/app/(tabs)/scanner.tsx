import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, SafeAreaView, ScrollView, Image, FlatList } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { parseQRCodeData, handleQRScanResult, GameQRData, fetchSkyScansGameData } from '../../lib/qr-scanner';
import { ScanHistoryService, ScanHistoryItem } from '../../lib/scan-history-improved';
import { useThemeColors } from '../../lib/theme-context';

// Use ScanHistoryItem from the service instead of local interface

export default function ScannerScreen() {
  const themeColors = useThemeColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [activeTab, setActiveTab] = useState<'camera' | 'history'>('camera');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [lastScannedUrl, setLastScannedUrl] = useState<string>('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [resetTimeout, setResetTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    loadScanHistory();
  }, [permission, requestPermission]);

  // Cleanup timeout on unmount or tab change
  useEffect(() => {
    return () => {
      if (resetTimeout) {
        clearTimeout(resetTimeout);
        console.log('🧹 Cleanup: Cleared timeout on unmount');
      }
    };
  }, [resetTimeout]);

  // Reset scanner when switching tabs
  useEffect(() => {
    if (activeTab === 'history' && scanned) {
      if (resetTimeout) {
        clearTimeout(resetTimeout);
        setResetTimeout(null);
      }
      setScanned(false);
      console.log('🔄 Tab switch: Reset scanner');
    }
  }, [activeTab, scanned, resetTimeout]);

  // Load scan history from Supabase
  const loadScanHistory = async () => {
    try {
      console.log('📚 Loading scan history from Supabase...');
      const history = await ScanHistoryService.getScans();
      console.log('📚 Loaded history:', history.length, 'items');
      setScanHistory(history);
    } catch (error) {
      console.error('Error loading scan history:', error);
      Alert.alert('Error', 'Failed to load scan history. Please try again.');
    }
  };

  // Save scan to Supabase history
  const saveToHistory = async (gameData: GameQRData) => {
    try {
      console.log('💾 Saving scan to Supabase:', gameData);
      const savedScan = await ScanHistoryService.saveScan(gameData, 'qr_code');
      console.log('💾 Scan saved successfully:', savedScan);
      
      // Refresh the history list
      await loadScanHistory();
    } catch (error) {
      console.error('Error saving to history:', error);
      Alert.alert('Error', 'Failed to save scan. Please try again.');
    }
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTime;
    
    // Aggressive debounce: ignore scans within 5 seconds of each other
    if (timeSinceLastScan < 5000) {
      console.log('🚫 Scan too soon, ignoring (debounce)');
      return;
    }
    
    // Additional check for URL scans - prevent rapid scanning of same URL
    if (result.data && result.data.includes('localhost:8000/api/games/')) {
      const url = result.data;
      if (url === lastScannedUrl && timeSinceLastScan < 10000) {
        console.log('🚫 Same URL scanned too recently, ignoring');
        return;
      }
    }
    
    if (scanned) {
      console.log('🚫 Scan already in progress, ignoring');
      return;
    }
    
    // Immediately set scanned to true to prevent multiple scans
    setScanned(true);
    setLastScanTime(now);
    console.log('🔍 QR Code scanned:', result);
    
    try {
      // Parse the QR code data
      const parsedResult = parseQRCodeData(result.data);
      console.log('📱 Parsed QR result:', parsedResult);
      
      // Process the scan and get proper game data
      let gameData: GameQRData;
      
      if (typeof parsedResult.data === 'object' && parsedResult.data !== null) {
        // If data is an object, use it directly
        const data = parsedResult.data as GameQRData;
        gameData = {
          gameName: data.gameName || data.name || data.title || data.slug || 'Unknown Game',
          coverArt: data.coverArt || data.image_url || data.cover_image,
          platform: data.platform,
          scanDate: new Date().toISOString(),
          source: data.source || parsedResult.type || 'QR Code',
          gameId: data.gameId || data.id || data.ssg_id || data.product_id,
          // Include all the parsed data
          ...data
        };
      } else if (typeof parsedResult.data === 'string' && parsedResult.type === 'url') {
        // If it's a URL, try to fetch the actual game data
        const url = parsedResult.data as string;
        console.log('🌐 Processing URL:', url);
        
        // Check for duplicate scans of the same URL
        if (url === lastScannedUrl) {
          console.log('🚫 Duplicate scan detected, ignoring');
          return;
        }
        
        // Update last scanned URL
        setLastScannedUrl(url);
        
        try {
          // Check if it's a SkyScansGames API URL
          if (url.includes('localhost:8000/api/games/') || url.includes('10.0.0.14:8000/api/games/')) {
            console.log('🎮 Fetching SkyScansGames data...');
            
            // Convert localhost to IP address for phone access
            const networkUrl = url.replace('localhost', '10.0.0.14');
            
            // Fetch the game data
            const fetchedGameData = await fetchSkyScansGameData(networkUrl);
            
            console.log('✅ Fetched game data:', fetchedGameData);
            
            // Use the fetched data
            gameData = {
              ...fetchedGameData,
              scanDate: new Date().toISOString(),
              source: 'SkyScansGames API'
            };
          } else {
            // Generic URL - create basic data
            gameData = {
              gameName: 'URL Scan',
              scanDate: new Date().toISOString(),
              source: 'URL',
              gameId: url
            };
          }
        } catch (error) {
          console.error('❌ Failed to fetch game data:', error);
          // Fallback to basic data
          gameData = {
            gameName: 'QR Code Scan',
            scanDate: new Date().toISOString(),
            source: 'QR Code',
            gameId: url
          };
        }
      } else {
        // If data is a string, create a basic GameQRData object
        gameData = {
          gameName: 'QR Code Scan',
          scanDate: new Date().toISOString(),
          source: parsedResult.type || 'QR Code',
          gameId: parsedResult.data as string
        };
      }
      
      console.log('💾 Saving to history:', gameData);
      console.log('🎮 Game name extracted:', gameData.gameName);
      console.log('🆔 Game ID extracted:', gameData.gameId);
      console.log('🎯 Platform extracted:', gameData.platform);
      await saveToHistory(gameData);
      
      // Navigate to appropriate screen based on scan type
      handleQRScanResult(parsedResult);
      
      // Clear any existing timeout to prevent race conditions
      if (resetTimeout) {
        clearTimeout(resetTimeout);
        console.log('🧹 Cleared existing timeout');
      }
      
      // Set new timeout to reset scanner
      const newTimeout = setTimeout(() => {
        setScanned(false);
        setLastScannedUrl('');
        setResetTimeout(null);
        console.log('🔄 Ready for next scan');
      }, 3000); // 3 second delay before allowing next scan
      
      setResetTimeout(newTimeout);
      
      console.log('✅ Scan completed successfully');
    } catch (error) {
      console.error('❌ QR scan error:', error);
      Alert.alert(
        'Scan Error',
        'Failed to process the QR code. Please try again.',
        [
          { text: 'OK', onPress: () => setScanned(false) }
        ]
      );
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await ScanHistoryService.clearAllScans();
              setScanHistory([]);
              console.log('🗑️ History cleared from Supabase');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: ScanHistoryItem }) => (
    <TouchableOpacity 
      style={[styles.historyItem, { backgroundColor: themeColors.card }]}
      onPress={() => {
        // Navigate to scan results with the saved data
        router.push({
          pathname: '/scan-results',
          params: {
            scanData: JSON.stringify({
              gameId: item.game_id,
              gameName: item.game_name,
              coverArt: item.cover_art,
              platform: item.platform,
              scanDate: item.scan_date,
              source: item.source,
              ...item.scan_data
            })
          }
        });
      }}
    >
      <View style={styles.historyItemContent}>
        {item.cover_art ? (
          <Image source={{ uri: item.cover_art }} style={styles.historyCoverArt} />
        ) : (
          <View style={[styles.historyPlaceholder, { backgroundColor: themeColors.surface }]}>
            <Ionicons name="game-controller" size={24} color={themeColors.textSecondary} />
          </View>
        )}
        
        <View style={styles.historyItemInfo}>
          <Text style={[styles.historyGameName, { color: themeColors.text }]} numberOfLines={2}>
            {item.game_name || item.scan_data?.gameName || item.scan_data?.name || 'Scanned Item'}
          </Text>
<<<<<<< HEAD
          <Text style={[styles.historyPlatform, { color: themeColors.primary }]}>
=======
          <Text style={[styles.historyPlatform, { color: themeColors.textSecondary }]}>
>>>>>>> 82691c4
            {item.platform || item.scan_data?.platform || 'Unknown Platform'}
          </Text>
          <Text style={[styles.historyDate, { color: themeColors.textSecondary }]}>{formatDate(item.scan_date)}</Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const resetScanner = () => {
    console.log('🔄 Resetting scanner');
    setScanned(false);
    setLastScannedUrl('');
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
<<<<<<< HEAD
        <View style={[styles.permissionContainer, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.permissionText, { color: themeColors.text }]}>Requesting camera permission...</Text>
=======
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: themeColors.textSecondary }]}>Requesting camera permission...</Text>
>>>>>>> 82691c4
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
<<<<<<< HEAD
        <View style={[styles.permissionContainer, { backgroundColor: themeColors.surface }]}>
=======
        <View style={styles.permissionContainer}>
>>>>>>> 82691c4
          <Ionicons name="camera-outline" size={64} color={themeColors.textSecondary} />
          <Text style={[styles.permissionTitle, { color: themeColors.text }]}>Camera Permission Required</Text>
          <Text style={[styles.permissionText, { color: themeColors.textSecondary }]}>
            We need access to your camera to scan QR codes for games.
          </Text>
          <TouchableOpacity style={[styles.permissionButton, { backgroundColor: themeColors.primary }]} onPress={requestPermission}>
            <Text style={[styles.permissionButtonText, { color: themeColors.buttonText }]}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
<<<<<<< HEAD
      <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
=======
      <View style={styles.header}>
>>>>>>> 82691c4
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Scan Game QR Code</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>Point your camera at a game QR code</Text>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: themeColors.surface }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'camera' && [styles.activeTab, { backgroundColor: themeColors.primary }]]}
          onPress={() => setActiveTab('camera')}
        >
<<<<<<< HEAD
          <Ionicons name="camera" size={20} color={activeTab === 'camera' ? themeColors.primary : themeColors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'camera' ? themeColors.primary : themeColors.textSecondary }, activeTab === 'camera' && styles.activeTabText]}>
=======
          <Ionicons name="camera" size={20} color={activeTab === 'camera' ? themeColors.buttonText : themeColors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'camera' ? themeColors.buttonText : themeColors.textSecondary }, activeTab === 'camera' && styles.activeTabText]}>
>>>>>>> 82691c4
            Camera
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && [styles.activeTab, { backgroundColor: themeColors.primary }]]}
          onPress={() => {
            setActiveTab('history');
            loadScanHistory(); // Refresh history when switching to history tab
          }}
        >
<<<<<<< HEAD
          <Ionicons name="time" size={20} color={activeTab === 'history' ? themeColors.primary : themeColors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'history' ? themeColors.primary : themeColors.textSecondary }, activeTab === 'history' && styles.activeTabText]}>
=======
          <Ionicons name="time" size={20} color={activeTab === 'history' ? themeColors.buttonText : themeColors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'history' ? themeColors.buttonText : themeColors.textSecondary }, activeTab === 'history' && styles.activeTabText]}>
>>>>>>> 82691c4
            History ({scanHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      {activeTab === 'camera' && (
        <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128'],
          }}
          // Add autofocus for better scanning
          autofocus="on"
          // Enable torch/flash for better scanning in low light
          enableTorch={torchEnabled}
          // Ensure camera is active
          active={true}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={[styles.scannerText, { color: themeColors.text }]}>
              {scanned ? 'Processing... Tap to scan again' : 'Position QR code within the frame'}
            </Text>
            {scanned && (
              <TouchableOpacity 
                onPress={() => {
                  // Clear any existing timeout
                  if (resetTimeout) {
                    clearTimeout(resetTimeout);
                    setResetTimeout(null);
                  }
                  setScanned(false);
                  setLastScannedUrl('');
                  console.log('🔄 Manual reset - ready for next scan');
                }} 
                style={[styles.resetButton, { backgroundColor: themeColors.primary }]}
              >
                <Text style={[styles.resetButtonText, { color: themeColors.buttonText }]}>Reset Scanner</Text>
              </TouchableOpacity>
            )}
            
            {/* Torch Toggle Button */}
            <TouchableOpacity 
              onPress={() => setTorchEnabled(!torchEnabled)} 
              style={[styles.torchButton, { backgroundColor: themeColors.surface }]}
            >
              <Ionicons 
                name={torchEnabled ? "flash" : "flash-off"} 
                size={24} 
                color={torchEnabled ? themeColors.accent : themeColors.text} 
              />
            </TouchableOpacity>
          </View>
        </CameraView>
        </View>
      )}


      {/* History View */}
      {activeTab === 'history' && (
<<<<<<< HEAD
        <View style={[styles.historyContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.historyHeader, { backgroundColor: themeColors.surface }]}>
=======
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
>>>>>>> 82691c4
            <Text style={[styles.historyTitle, { color: themeColors.text }]}>Scan History</Text>
            <View style={styles.historyActions}>
              <TouchableOpacity 
                onPress={() => {
                  const testScan: GameQRData = {
                    gameName: 'Test Game',
                    coverArt: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6w2y.jpg',
                    platform: 'PlayStation 5',
                    scanDate: new Date().toISOString(),
                    source: 'Test',
                    gameId: 'test-123'
                  };
                  saveToHistory(testScan);
                }} 
                style={[styles.testButton, { backgroundColor: themeColors.primary }]}
              >
                <Ionicons name="add" size={16} color={themeColors.buttonText} />
                <Text style={[styles.testButtonText, { color: themeColors.buttonText }]}>Test</Text>
              </TouchableOpacity>
              {scanHistory.length > 0 && (
                <TouchableOpacity onPress={clearHistory} style={[styles.clearButton, { backgroundColor: themeColors.error }]}>
                  <Ionicons name="trash" size={16} color={themeColors.buttonText} />
                  <Text style={[styles.clearButtonText, { color: themeColors.buttonText }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {scanHistory.length === 0 ? (
<<<<<<< HEAD
            <View style={[styles.emptyHistory, { backgroundColor: themeColors.background }]}>
=======
            <View style={styles.emptyHistory}>
>>>>>>> 82691c4
              <Ionicons name="time-outline" size={64} color={themeColors.textSecondary} />
              <Text style={[styles.emptyHistoryTitle, { color: themeColors.text }]}>No Scans Yet</Text>
              <Text style={[styles.emptyHistoryText, { color: themeColors.textSecondary }]}>
                Scan some QR codes to see your history here
              </Text>
            </View>
          ) : (
            <FlatList
              data={scanHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              style={styles.historyList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Controls - only show for camera tab */}
      {activeTab === 'camera' && (
        <View style={[styles.controls, { backgroundColor: themeColors.surface }]}>
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: themeColors.primary }]} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color={themeColors.buttonText} />
            <Text style={[styles.controlButtonText, { color: themeColors.buttonText }]}>Flip Camera</Text>
          </TouchableOpacity>

          {scanned && (
            <TouchableOpacity style={[styles.scanAgainButton, { backgroundColor: themeColors.accent }]} onPress={resetScanner}>
              <Ionicons name="scan" size={24} color={themeColors.buttonText} />
              <Text style={[styles.controlButtonText, { color: themeColors.buttonText }]}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40, // Add extra padding for bottom tab bar
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  controlButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#007AFF',
  },
  // History styles
  historyContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingBottom: 40, // Add extra padding for bottom tab bar
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
    marginRight: 8,
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
  },
  clearButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyHistoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  torchButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyList: {
    flex: 1,
    paddingBottom: 20, // Extra padding for the last items
  },
  historyItem: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  historyCoverArt: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  historyPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyItemInfo: {
    flex: 1,
  },
  historyGameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  historyPlatform: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
});
