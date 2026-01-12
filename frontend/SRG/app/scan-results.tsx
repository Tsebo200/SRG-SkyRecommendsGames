import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiClient, Game } from '../lib/api';
import { HybridFavouritesService } from '../lib/favourites-hybrid';

const { width } = Dimensions.get('window');

interface SkyScansGameData {
  gameId: string;
  gameName: string;
  coverArt?: string;
  platform?: string;
  scanDate: string;
  source: 'SkyScansGames';
  apiUrl?: string;
  description?: string;
  rating?: number;
  releaseDate?: string;
  developer?: string;
  publisher?: string;
  genres?: string[];
  platforms?: string[];
  rawApiData?: any;
  // Additional SkyScansGames specific fields
  overallScore?: number;
  reviewsScore?: number;
  graphicScore?: number;
  gameMechanicsScore?: number;
  completenessScore?: number;
  storyQualityScore?: number;
  accessibilityScore?: number;
  innovationScore?: number;
  communityScore?: number;
  monetisationScore?: number;
  // Monetisation fairness data
  monetisationFairness?: string;
  monetisationTypes?: string[];
  monetisationNotes?: string;
  monetisationConfidence?: number;
}

export default function ScanResultsScreen() {
  const params = useLocalSearchParams();
  const [game, setGame] = useState<Game | null>(null);
  const [skyScansData, setSkyScansData] = useState<SkyScansGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [addingToFavourites, setAddingToFavourites] = useState(false);

  useEffect(() => {
    loadScanData();
  }, []);

  const loadScanData = async () => {
    try {
      setLoading(true);
      console.log('📱 Loading scan data, params:', params);
      
      // Parse the scanned data from SkyScansGames
      if (params.scanData) {
        console.log('📱 Raw scanData:', params.scanData);
        const parsedData = JSON.parse(params.scanData as string) as SkyScansGameData;
        console.log('📱 Parsed scan data:', parsedData);
        setSkyScansData(parsedData);
        
        // Try to find the game in our database using the game name
        if (parsedData.gameName) {
          console.log('🔍 Searching for game:', parsedData.gameName);
          try {
            const searchResults = await apiClient.searchGames(parsedData.gameName);
            console.log('🔍 Search results:', searchResults.results.length, 'games found');
            
            if (searchResults.results.length > 0) {
              const foundGame = searchResults.results[0];
              console.log('✅ Found game:', foundGame.name);
              setGame(foundGame);
              
              // Check if game is in favourites
              const favourites = await HybridFavouritesService.getFavourites();
              const isFav = favourites.some(fav => fav.game_slug === foundGame.slug);
              setIsFavourite(isFav);
            } else {
              console.log('⚠️ No game found in database for:', parsedData.gameName);
            }
          } catch (searchError) {
            console.error('❌ Error searching for game:', searchError);
          }
        } else {
          console.log('⚠️ No gameName in parsed data');
        }
      } else {
        console.log('⚠️ No scanData in params');
      }
    } catch (error) {
      console.error('❌ Error loading scan data:', error);
      Alert.alert('Error', `Failed to load scanned game details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavourite = async () => {
    if (!game) return;
    
    try {
      setAddingToFavourites(true);
      
      if (isFavourite) {
        await HybridFavouritesService.removeFavourite(game.slug);
        setIsFavourite(false);
        Alert.alert('Removed from Favourites', `${game.name} has been removed from your favourites.`);
      } else {
        await HybridFavouritesService.addFavourite(
          game.id.toString(),
          game.name,
          game.slug,
          game.background_image
        );
        setIsFavourite(true);
        Alert.alert('Added to Favourites', `${game.name} has been added to your favourites!`);
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      Alert.alert('Error', 'Failed to update favourites');
    } finally {
      setAddingToFavourites(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading scanned game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!skyScansData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Scan Data Not Found</Text>
          <Text style={styles.errorText}>
            We couldn't find the scanned game data. Please try scanning again.
          </Text>
          <Text style={[styles.errorText, { fontSize: 12, marginTop: 10 }]}>
            Debug: params = {JSON.stringify(params, null, 2)}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanned Game</Text>
          {game && (
            <TouchableOpacity 
              style={styles.favouriteButton} 
              onPress={toggleFavourite}
              disabled={addingToFavourites}
            >
              {addingToFavourites ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons 
                  name={isFavourite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavourite ? "#ff6b6b" : "#fff"} 
                />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Matched Game Data */}
        {game && (
            <View style={styles.matchedGameContainer}>
              {/* <Text style={styles.matchedGameTitle}>🎮 Matched Game in Database</Text> */}

              {/* SkyScansGames Header */}
              <View style={styles.skyScansHeader}>
                <View style={styles.skyScansBadge}>
                  <Ionicons name="scan" size={20} color="#007AFF" />
                  <Text style={styles.skyScansText}>Scanned from SkyScansGames</Text>
                </View>
                <Text style={styles.scanDate}>
                  Scanned on {formatDate(skyScansData.scanDate)}
                </Text>
              </View>

              {game.background_image && (
                <Image source={{ uri: game.background_image }} style={styles.gameImage} />
              )}
              <Text style={styles.matchedGameName}>{game.name}</Text>
              {game.genres && game.genres.length > 0 && (
                <View style={styles.genresContainer}>
                  <Text style={styles.genresTitle}>Genres</Text>
                  <View style={styles.genresList}>
                    {game.genres.map((genre, index) => (
                      <View key={index} style={styles.genreTag}>
                        <Text style={styles.genreText}>{genre.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {game.platforms && game.platforms.length > 0 && (
                <View style={styles.platformsContainer}>
                  <Text style={styles.platformsTitle}>Available Platforms</Text>
                  <View style={styles.platformsList}>
                    {game.platforms.map((platform, index) => (
                      <View key={index} style={styles.platformTag}>
                        <Text style={styles.platformText}>{platform.platform.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

        

        {/* Game Cover Art */}
        {/* <View style={styles.coverArtContainer}>
          {skyScansData.coverArt ? (
            <Image 
              source={{ uri: skyScansData.coverArt }} 
              style={styles.coverArt}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverArtPlaceholder}>
              <Ionicons name="game-controller" size={64} color="#666" />
              <Text style={styles.coverArtPlaceholderText}>No Cover Art Available</Text>
            </View>
          )}
        </View> */}

        {/* Game Info */}
        <View style={styles.content}>
          <Text style={styles.gameTitle}>{skyScansData.gameName}</Text>
          
          {/* SkyScansGames Data */}
          <View style={styles.skyScansDataContainer}>
            <Text style={styles.skyScansDataTitle}>📱 SkyScansGames Data</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="finger-print" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Game ID:</Text>
              <Text style={styles.infoValue}>{skyScansData.gameId}</Text>
            </View>
            
            {skyScansData.platform && (
              <View style={styles.infoRow}>
                <Ionicons name="desktop" size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Scanned Platform:</Text>
                <Text style={styles.infoValue}>{skyScansData.platform}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Scan Date:</Text>
              <Text style={styles.infoValue}>{formatDate(skyScansData.scanDate)}</Text>
            </View>
            
            {skyScansData.apiUrl && (
              <View style={styles.infoRow}>
                <Ionicons name="link" size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>API URL:</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{skyScansData.apiUrl}</Text>
              </View>
            )}
            
            {skyScansData.rating && (
              <View style={styles.infoRow}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.infoLabel}>Rating:</Text>
                <Text style={styles.infoValue}>{skyScansData.rating.toFixed(1)}/100</Text>
              </View>
            )}
            
            {skyScansData.developer && (
              <View style={styles.infoRow}>
                <Ionicons name="code" size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Developer:</Text>
                <Text style={styles.infoValue}>{skyScansData.developer}</Text>
              </View>
            )}
            
            {skyScansData.publisher && (
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Publisher:</Text>
                <Text style={styles.infoValue}>{skyScansData.publisher}</Text>
              </View>
            )}
            
            {skyScansData.releaseDate && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Release Date:</Text>
                <Text style={styles.infoValue}>{formatDate(skyScansData.releaseDate)}</Text>
              </View>
            )}
          </View>
          
          {/* Game Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Game Description</Text>
            {skyScansData.description ? (
              <Text style={styles.descriptionText}>{skyScansData.description}</Text>
            ) : (
              <Text style={styles.descriptionText}>
                {`This is ${skyScansData.gameName}, a ${skyScansData.platform || 'gaming'} title${skyScansData.releaseDate ? ` released in ${new Date(skyScansData.releaseDate).getFullYear()}` : ''}.`}
              </Text>
            )}
            
            {/* Additional Game Details */}
            <View style={styles.gameDetailsGrid}>
              {skyScansData.developer && (
                <View style={styles.gameDetailItem}>
                  <Text style={styles.gameDetailLabel}>Developer</Text>
                  <Text style={styles.gameDetailValue}>{skyScansData.developer}</Text>
                </View>
              )}
              
              {skyScansData.publisher && (
                <View style={styles.gameDetailItem}>
                  <Text style={styles.gameDetailLabel}>Publisher</Text>
                  <Text style={styles.gameDetailValue}>{skyScansData.publisher}</Text>
                </View>
              )}
              
              {skyScansData.releaseDate && (
                <View style={styles.gameDetailItem}>
                  <Text style={styles.gameDetailLabel}>Release Date</Text>
                  <Text style={styles.gameDetailValue}>{formatDate(skyScansData.releaseDate)}</Text>
                </View>
              )}
              
              {skyScansData.platform && (
                <View style={styles.gameDetailItem}>
                  <Text style={styles.gameDetailLabel}>Platform</Text>
                  <Text style={styles.gameDetailValue}>{skyScansData.platform}</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* SkyScansGames Scoring Data */}
          {(skyScansData.overallScore || skyScansData.reviewsScore || skyScansData.graphicScore) && (
            <View style={styles.scoringContainer}>
              <Text style={styles.scoringTitle}>🎯 SkyScansGames AI Analysis</Text>
              
              {skyScansData.overallScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Overall Score:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.overallScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.overallScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
              
              {skyScansData.reviewsScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Reviews Score:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.reviewsScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.reviewsScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
              
              {skyScansData.graphicScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Graphics Score:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.graphicScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.graphicScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
              
              {skyScansData.gameMechanicsScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Game Mechanics:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.gameMechanicsScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.gameMechanicsScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
              
              {skyScansData.completenessScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Completeness:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.completenessScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.completenessScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
              
              {skyScansData.storyQualityScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Story Quality:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.storyQualityScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.storyQualityScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
              
              {skyScansData.accessibilityScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Accessibility:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.accessibilityScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.accessibilityScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
              
              {skyScansData.innovationScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Innovation:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.innovationScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.innovationScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
              
              {skyScansData.communityScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Community:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.communityScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.communityScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
              
              {skyScansData.monetisationScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Monetisation:</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${skyScansData.monetisationScore}%` }]} />
                    <Text style={styles.scoreValue}>{skyScansData.monetisationScore.toFixed(1)}/100</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Monetisation Fairness */}
          {skyScansData.monetisationFairness && (
            <View style={styles.monetisationContainer}>
              <Text style={styles.monetisationTitle}>💰 Monetisation Fairness</Text>
              
              <View style={styles.fairnessRow}>
                <Text style={styles.fairnessLabel}>Fairness Rating:</Text>
                <View style={styles.fairnessBadge}>
                  <Text style={styles.fairnessText}>{skyScansData.monetisationFairness}</Text>
                </View>
              </View>
              
              {skyScansData.monetisationConfidence && (
                <View style={styles.fairnessRow}>
                  <Text style={styles.fairnessLabel}>Confidence:</Text>
                  <Text style={styles.fairnessValue}>{(skyScansData.monetisationConfidence * 100).toFixed(0)}%</Text>
                </View>
              )}
              
              {skyScansData.monetisationTypes && skyScansData.monetisationTypes.length > 0 && (
                <View style={styles.monetisationTypesContainer}>
                  <Text style={styles.monetisationTypesTitle}>Monetisation Types:</Text>
                  <View style={styles.monetisationTypesList}>
                    {skyScansData.monetisationTypes.map((type, index) => (
                      <View key={index} style={styles.monetisationTypeTag}>
                        <Text style={styles.monetisationTypeText}>{type}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {skyScansData.monetisationNotes && (
                <View style={styles.monetisationNotesContainer}>
                  <Text style={styles.monetisationNotesTitle}>Notes:</Text>
                  <Text style={styles.monetisationNotesText}>{skyScansData.monetisationNotes}</Text>
                </View>
              )}
            </View>
          )}

          {/* Genres from SkyScansGames */}
          {skyScansData.genres && skyScansData.genres.length > 0 && (
            <View style={styles.genresContainer}>
              <Text style={styles.genresTitle}>Genres (from SkyScansGames)</Text>
              <View style={styles.genresList}>
                {skyScansData.genres.map((genre, index) => (
                  <View key={index} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Platforms from SkyScansGames */}
          {skyScansData.platforms && skyScansData.platforms.length > 0 && (
            <View style={styles.platformsContainer}>
              <Text style={styles.platformsTitle}>Platforms (from Scanned QR Code)</Text>
              <View style={styles.platformsList}>
                {skyScansData.platforms.map((platform, index) => (
                  <View key={index} style={styles.platformTag}>
                    <Text style={styles.platformText}>{platform}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Matched Game Data */}
          {/* {game && (
            <View style={styles.matchedGameContainer}>
              <Text style={styles.matchedGameTitle}>🎮 Matched Game in Database</Text>
              
              {game.background_image && (
                <Image source={{ uri: game.background_image }} style={styles.gameImage} />
              )}
              
              <Text style={styles.matchedGameName}>{game.name}</Text>
              
              {game.genres && game.genres.length > 0 && (
                <View style={styles.genresContainer}>
                  <Text style={styles.genresTitle}>Genres</Text>
                  <View style={styles.genresList}>
                    {game.genres.map((genre, index) => (
                      <View key={index} style={styles.genreTag}>
                        <Text style={styles.genreText}>{genre.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {game.platforms && game.platforms.length > 0 && (
                <View style={styles.platformsContainer}>
                  <Text style={styles.platformsTitle}>Available Platforms (from Database Match)</Text>
                  <View style={styles.platformsList}>
                    {game.platforms.map((platform, index) => (
                      <View key={index} style={styles.platformTag}>
                        <Text style={styles.platformText}>{platform.platform.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )} */}

          {/* No Match Found */}
          {!game && (
            <View style={styles.noMatchContainer}>
              <Ionicons name="search" size={48} color="#666" />
              <Text style={styles.noMatchTitle}>No Match Found</Text>
              <Text style={styles.noMatchText}>
                We couldn't find this game in our database. It might be a new release or have a different name.
              </Text>
              <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.searchButtonText}>Search Manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  favouriteButton: {
    padding: 8,
  },
  skyScansHeader: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  skyScansBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  skyScansText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  scanDate: {
    color: '#ccc',
    fontSize: 14,
  },
  coverArtContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  coverArt: {
    width: 200,
    height: 280,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  coverArtPlaceholder: {
    width: 200,
    height: 280,
    backgroundColor: '#333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverArtPlaceholderText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  gameTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  skyScansDataContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  skyScansDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  matchedGameContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
    marginBottom: 20,
  },
  matchedGameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
    marginBottom: 12,
  },
  gameImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchedGameName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  genresContainer: {
    marginBottom: 12,
  },
  genresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  genreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  platformsContainer: {
    marginBottom: 12,
  },
  platformsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  platformsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  platformTag: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  platformText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  noMatchContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  noMatchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  noMatchText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Scoring styles
  scoringContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  scoringTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#ccc',
    width: 120,
  },
  scoreBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    marginLeft: 12,
    marginRight: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  scoreValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  // Monetisation styles
  monetisationContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  monetisationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
    marginBottom: 16,
  },
  fairnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fairnessLabel: {
    fontSize: 14,
    color: '#ccc',
    width: 120,
  },
  fairnessBadge: {
    backgroundColor: '#00bfff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  fairnessText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fairnessValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  monetisationTypesContainer: {
    marginTop: 12,
  },
  monetisationTypesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  monetisationTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monetisationTypeTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  monetisationTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  monetisationNotesContainer: {
    marginTop: 12,
  },
  monetisationNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  monetisationNotesText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  // Description styles
  descriptionContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16,
  },
  gameDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  gameDetailItem: {
    width: '50%',
    paddingVertical: 8,
    paddingRight: 12,
  },
  gameDetailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  gameDetailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
