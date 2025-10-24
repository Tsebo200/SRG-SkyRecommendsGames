import { Alert } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from './api';

export interface GameQRData {
  slug?: string;
  name?: string;
  id?: string;
  url?: string;
  store?: string;
  price?: number;
  currency?: string;
  // SSG-specific fields
  ssg_id?: string;
  product_id?: string;
  sku?: string;
  category?: string;
  platform?: string;
  release_date?: string;
  developer?: string;
  publisher?: string;
  description?: string;
  image_url?: string;
  rating?: number;
  age_rating?: string;
  // SkyScansGames-specific fields
  gameId?: string;
  gameName?: string;
  coverArt?: string;
  scanDate?: string;
  source?: string; // Allow any string for source
  apiUrl?: string;
  rawApiData?: any;
  genres?: string[];
  platforms?: string[];
  releaseDate?: string;
  // Additional fields for compatibility
  title?: string;
  cover_image?: string;
}

export interface QRScanResult {
  type: 'game' | 'url' | 'text' | 'unknown';
  data: GameQRData | string;
  action: 'navigate' | 'search' | 'add_favourite' | 'show_info';
}

/**
 * Parse QR code data and determine the appropriate action
 */
export function parseQRCodeData(qrData: string): QRScanResult {
  try {
    // Try to parse as JSON first
    const parsedData = JSON.parse(qrData);
    
    // Check if it's SkyScansGames data
    if (parsedData.source === 'SkyScansGames' || parsedData.gameId || parsedData.gameName) {
      return {
        type: 'game',
        data: parsedData as GameQRData,
        action: 'navigate'
      };
    }
    
    // Check if it's SSG game data
    if (parsedData.ssg_id || parsedData.product_id || parsedData.sku) {
      return {
        type: 'game',
        data: parsedData as GameQRData,
        action: 'navigate'
      };
    }
    
    // Check if it's general game data
    if (parsedData.slug || parsedData.name || parsedData.id) {
      return {
        type: 'game',
        data: parsedData as GameQRData,
        action: 'navigate'
      };
    }
    
    return {
      type: 'unknown',
      data: parsedData,
      action: 'show_info'
    };
  } catch (error) {
    // Not JSON, try other formats
    
    // Check if it's a SkyScansGames API URL
    if (qrData.includes('localhost:8000/api/games/') || qrData.includes('localhost:3000/') || qrData.includes('localhost:3001/') ||
        qrData.includes('10.0.0.14:8000/api/games/') || qrData.includes('10.0.0.14:3000/') || qrData.includes('10.0.0.14:3001/') ||
        qrData.includes('10.0.0.8:8000/api/games/') || qrData.includes('10.0.0.8:3000/') || qrData.includes('10.0.0.8:3001/')) {
      return {
        type: 'url',
        data: qrData,
        action: 'navigate'
      };
    }
    
    // Check if it's an SSG URL
    if (qrData.includes('ssg.com') || qrData.includes('ssg.co.kr')) {
      return {
        type: 'url',
        data: qrData,
        action: 'navigate'
      };
    }
    
    // Check if it's a general URL
    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      return {
        type: 'url',
        data: qrData,
        action: 'show_info'
      };
    }
    
    // Check if it looks like a game name or slug
    if (qrData.length > 3 && qrData.length < 100 && !qrData.includes(' ')) {
      return {
        type: 'game',
        data: { slug: qrData, name: qrData },
        action: 'search'
      };
    }
    
    // Default to text
    return {
      type: 'text',
      data: qrData,
      action: 'show_info'
    };
  }
}

/**
 * Handle the result of a QR code scan
 */
export async function handleQRScanResult(result: QRScanResult): Promise<void> {
  switch (result.action) {
    case 'navigate':
      if (result.type === 'game' && typeof result.data === 'object') {
        const gameData = result.data as GameQRData;
        
        // Check if it's SkyScansGames data
        if (gameData.source === 'SkyScansGames' || gameData.gameId || gameData.gameName) {
          // Navigate to scan results screen for SkyScansGames data
          router.push({
            pathname: '/scan-results',
            params: {
              scanData: JSON.stringify(gameData)
            }
          });
        } else {
          // Navigate to game details with QR data
          router.push({
            pathname: '/game-details',
            params: {
              qrData: JSON.stringify(gameData),
              slug: gameData.slug || '',
              name: gameData.name || ''
            }
          });
        }
      } else if (result.type === 'url') {
        // Handle SkyScansGames API URLs
        const url = result.data as string;
        if (url.includes('localhost:8000/api/games/') || url.includes('localhost:3000/') || url.includes('localhost:3001/') ||
            url.includes('10.0.0.14:8000/api/games/') || url.includes('10.0.0.14:3000/') || url.includes('10.0.0.14:3001/') ||
            url.includes('10.0.0.8:8000/api/games/') || url.includes('10.0.0.8:3000/') || url.includes('10.0.0.8:3001/')) {
          // Convert localhost to IP address for phone access
          let networkUrl = url.replace('localhost', '10.0.0.8');
          // Also handle the case where it might already have an IP
          if (url.includes('10.0.0.14')) {
            networkUrl = url.replace('10.0.0.14', '10.0.0.8');
          }
          
          // Fetch game data from SkyScansGames API
          try {
            const gameData = await fetchSkyScansGameData(networkUrl);
            router.push({
              pathname: '/scan-results',
              params: {
                scanData: JSON.stringify({
                  ...gameData,
                  source: 'SkyScansGames',
                  apiUrl: url,
                  scanDate: new Date().toISOString()
                })
              }
            });
          } catch (error) {
            console.error('Error fetching SkyScansGames data:', error);
            
            // Show more detailed error information
            const errorMessage = error.message.includes('Network request failed') 
              ? 'Network request failed. Make sure:\n1. SkyScansGames API is running on your computer\n2. Your phone and computer are on the same WiFi network\n3. The API is accessible at the IP address'
              : `Failed to fetch game data: ${error.message}`;
              
            Alert.alert('SkyScansGames API Error', errorMessage, [
              { text: 'OK' },
              { 
                text: 'Try Again', 
                onPress: () => {
                  // Retry the request
                  handleQRScanResult(result);
                }
              }
            ]);
          }
        } else if (url.includes('ssg.com') || url.includes('ssg.co.kr')) {
          // Extract product info from SSG URL and navigate
          const productId = extractSSGProductId(url);
          if (productId) {
            router.push({
              pathname: '/game-details',
              params: {
                qrData: JSON.stringify({ ssg_id: productId, url }),
                name: 'SSG Product'
              }
            });
          } else {
            Alert.alert('SSG URL Detected', 'This appears to be an SSG product URL. Product details will be loaded.');
          }
        } else {
          Alert.alert('URL Scanned', `URL: ${url}`);
        }
      }
      break;
      
    case 'search':
      if (typeof result.data === 'object') {
        const gameData = result.data as GameQRData;
        await searchForGame(gameData.name || gameData.slug || '');
      } else {
        await searchForGame(result.data as string);
      }
      break;
      
    case 'add_favourite':
      if (result.type === 'game' && typeof result.data === 'object') {
        const gameData = result.data as GameQRData;
        await addGameToFavourites(gameData);
      }
      break;
      
    case 'show_info':
    default:
      Alert.alert(
        'QR Code Scanned',
        `Data: ${typeof result.data === 'object' ? JSON.stringify(result.data) : result.data}`,
        [
          { text: 'OK' }
        ]
      );
      break;
  }
}

/**
 * Search for a game using the API
 */
async function searchForGame(query: string): Promise<void> {
  try {
    const searchResults = await apiClient.searchGames(query);
    
    if (searchResults.results.length > 0) {
      const firstResult = searchResults.results[0];
      router.push(`/game/${firstResult.slug}`);
    } else {
      Alert.alert(
        'No Games Found',
        `No games found for "${query}". Try a different search term.`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Search error:', error);
    Alert.alert(
      'Search Error',
      'Failed to search for games. Please try again.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Add a game to favourites
 */
async function addGameToFavourites(gameData: GameQRData): Promise<void> {
  try {
    // This would integrate with your favourites service
    // For now, just show a success message
    Alert.alert(
      'Added to Favourites',
      `${gameData.name || 'Game'} has been added to your favourites!`,
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Add to favourites error:', error);
    Alert.alert(
      'Error',
      'Failed to add game to favourites. Please try again.',
      [{ text: 'OK' }]
    );
  }
}

// Simple rate limiting to prevent 429 errors
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests

/**
 * Fetch game data from SkyScansGames API with retry logic
 */
export async function fetchSkyScansGameData(apiUrl: string, retryCount = 0): Promise<GameQRData> {
  // Rate limiting check
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏳ Rate limiting: waiting ${waitTime}ms before request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  try {
    console.log('🔍 Fetching SkyScansGames data from:', apiUrl);
    console.log('📱 Network configuration - using IP address for phone access');
    
    // Create a timeout using AbortController (React Native compatible)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    // Clear the timeout if request completes successfully
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const gameData = await response.json();
    console.log('📱 SkyScansGames API response:', gameData);

    // Try to get description from RAWG API if not available in SkyScansGames
    let description = gameData.game?.description || gameData.description || gameData.summary || gameData.game?.summary;
    
    if (!description && gameData.game?.rawg_id) {
      try {
        console.log('🔍 Fetching description from RAWG API for game ID:', gameData.game.rawg_id);
        const rawgResponse = await fetch(`https://api.rawg.io/api/games/${gameData.game.rawg_id}?key=YOUR_RAWG_KEY`);
        if (rawgResponse.ok) {
          const rawgData = await rawgResponse.json();
          description = rawgData.description_raw || rawgData.description;
          console.log('📝 Got description from RAWG:', description?.substring(0, 100) + '...');
        }
      } catch (error) {
        console.log('⚠️ Could not fetch description from RAWG:', error.message);
      }
    }

    // Transform the API response to our GameQRData format
    return {
      gameId: gameData.game?.id?.toString() || gameData.id?.toString() || gameData.gameId,
      gameName: gameData.game?.title || gameData.name || gameData.title || gameData.gameName,
      coverArt: gameData.game?.cover_image || gameData.cover_image || gameData.coverArt || gameData.background_image || gameData.image_url,
      platform: gameData.game?.platform || gameData.platform || gameData.platforms?.[0]?.name,
      description: description,
      rating: gameData.scores?.overall_score || gameData.rating || gameData.metacritic,
      releaseDate: gameData.game?.release_date || gameData.releaseDate || gameData.released,
      developer: gameData.game?.developer || gameData.developer || gameData.developers?.[0]?.name,
      publisher: gameData.game?.publisher || gameData.publisher || gameData.publishers?.[0]?.name,
      genres: gameData.game?.genres?.map((g: any) => g.name || g) || gameData.genres?.map((g: any) => g.name || g) || [],
      platforms: gameData.game?.platforms?.map((p: any) => p.name || p) || gameData.platforms?.map((p: any) => p.name || p) || [],
      // Extract SkyScansGames scoring data
      overallScore: gameData.scores?.overall_score,
      reviewsScore: gameData.scores?.reviews_score,
      graphicScore: gameData.scores?.graphic_score,
      gameMechanicsScore: gameData.scores?.game_mechanics_score,
      completenessScore: gameData.scores?.completeness_score,
      storyQualityScore: gameData.scores?.story_quality_score,
      accessibilityScore: gameData.scores?.accessibility_score,
      innovationScore: gameData.scores?.innovation_creativity_score,
      communityScore: gameData.scores?.community_longevity_score,
      monetisationScore: gameData.scores?.monetisation_score,
      // Extract monetisation fairness data
      monetisationFairness: gameData.scores?.reasoning?.monetisation?.detailed?.fairness_label,
      monetisationTypes: gameData.scores?.reasoning?.monetisation?.detailed?.types,
      monetisationNotes: gameData.scores?.reasoning?.monetisation?.detailed?.notes,
      monetisationConfidence: gameData.scores?.reasoning?.monetisation?.detailed?.confidence,
      // Store the raw API response for reference
      rawApiData: gameData
    };
  } catch (error) {
    console.error('❌ Error fetching SkyScansGames data:', error);
    
    // Handle different types of errors
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network connection.');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('Network request failed. Make sure SkyScansGames API is running and accessible.');
    } else if (error.message.includes('429') || error.status === 429) {
      // Retry logic for 429 errors
      if (retryCount < 2) {
        const waitTime = (retryCount + 1) * 5000; // 5s, 10s delays
        console.log(`⏳ Rate limit hit, retrying in ${waitTime}ms (attempt ${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchSkyScansGameData(apiUrl, retryCount + 1);
      }
      throw new Error('Rate limit exceeded. Please wait a few minutes before scanning again.');
    } else if (error.message.includes('Request failed with status code 429')) {
      // Retry logic for 429 errors
      if (retryCount < 2) {
        const waitTime = (retryCount + 1) * 5000; // 5s, 10s delays
        console.log(`⏳ Rate limit hit, retrying in ${waitTime}ms (attempt ${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchSkyScansGameData(apiUrl, retryCount + 1);
      }
      throw new Error('Too many requests. Please wait a few minutes before scanning again.');
    } else {
      throw new Error(`Failed to fetch game data: ${error.message}`);
    }
  }
}

/**
 * Extract SSG product ID from URL
 */
function extractSSGProductId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Look for product ID in various SSG URL formats
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (part && part.length > 5 && /^\d+$/.test(part)) {
        return part;
      }
    }
    
    // Check query parameters
    const productId = urlObj.searchParams.get('productId') || 
                     urlObj.searchParams.get('id') || 
                     urlObj.searchParams.get('itemId');
    
    return productId;
  } catch (error) {
    console.error('Error extracting SSG product ID:', error);
    return null;
  }
}

/**
 * Common QR code formats for games
 */
export const GAME_QR_FORMATS = {
  // JSON format
  JSON: {
    example: '{"slug": "spider-man-2", "name": "Spider-Man 2", "store": "SSG"}',
    description: 'Structured game data with slug, name, and store information'
  },
  
  // URL format
  URL: {
    example: 'https://ssg.com/games/spider-man-2',
    description: 'Direct URL to game page'
  },
  
  // Simple slug format
  SLUG: {
    example: 'spider-man-2',
    description: 'Just the game slug for searching'
  },
  
  // Game name format
  NAME: {
    example: 'Spider-Man 2',
    description: 'Game name for searching'
  }
};
