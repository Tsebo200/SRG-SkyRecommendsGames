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
import { GameQRData } from '../lib/qr-scanner';
import { HybridFavouritesService } from '../lib/favourites-hybrid';
import { useThemeColors } from '../lib/theme-context';

const { width } = Dimensions.get('window');

export default function GameDetailsScreen() {
  const themeColors = useThemeColors();
  const params = useLocalSearchParams();
  const [game, setGame] = useState<Game | null>(null);
  const [qrData, setQrData] = useState<GameQRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [addingToFavourites, setAddingToFavourites] = useState(false);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      setLoading(true);
      
      // Check if we have game data passed from recommendations
      if (params.gameData) {
        const gameData = JSON.parse(params.gameData as string) as Game;
        setGame(gameData);
        console.log('🎮 Loaded game data from recommendations:', gameData);
      }
      // Check if we have QR data passed from scanner
      else if (params.qrData) {
        const parsedQrData = JSON.parse(params.qrData as string) as GameQRData;
        setQrData(parsedQrData);
        
        // Try to search for the game using the QR data
        if (parsedQrData.name || parsedQrData.slug) {
          const searchQuery = parsedQrData.name || parsedQrData.slug || '';
          const searchResults = await apiClient.searchGames(searchQuery);
          
          if (searchResults.results.length > 0) {
            setGame(searchResults.results[0]);
          }
        }
      } else if (params.slug) {
        // Load game by slug
        const searchResults = await apiClient.searchGames(params.slug as string);
        if (searchResults.results.length > 0) {
          setGame(searchResults.results[0]);
        }
      }
      
      // Check if game is in favourites (after game is set)
      const currentGame = game || (params.gameData ? JSON.parse(params.gameData as string) as Game : null);
      if (currentGame) {
        const favourites = await HybridFavouritesService.getFavourites();
        const isFav = favourites.some(fav => fav.game_slug === currentGame.slug);
        setIsFavourite(isFav);
      }
    } catch (error) {
      console.error('Error loading game data:', error);
      Alert.alert('Error', 'Failed to load game details');
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
        await HybridFavouritesService.addFavourite({
          game_id: game.id?.toString() || game.slug || 'unknown',
          game_name: game.name,
          game_slug: game.slug,
          genres: game.genres?.map(g => typeof g === 'string' ? g : g.name) || [],
          platforms: game.platforms?.map(p => typeof p === 'string' ? p : p.platform?.name || p.name) || [],
        });
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

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'Price not available';
    return `${currency || 'USD'} ${price.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Release date not available';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>Loading game details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!game && !qrData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={themeColors.error} />
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>Game Not Found</Text>
          <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
            We couldn't find details for this game. The QR code might be invalid or the game might not be in our database.
          </Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: themeColors.primary }]} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: themeColors.buttonText }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Game Details</Text>
          <TouchableOpacity 
            style={styles.favouriteButton} 
            onPress={toggleFavourite}
            disabled={addingToFavourites}
          >
            {addingToFavourites ? (
              <ActivityIndicator size="small" color={themeColors.text} />
            ) : (
              <Ionicons 
                name={isFavourite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavourite ? themeColors.error : themeColors.text} 
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Game Image */}
        <View style={styles.imageContainer}>
          {game?.background_image ? (
            <Image 
              source={{ uri: game.background_image }} 
              style={styles.gameImage}
              resizeMode="cover"
              onError={() => console.log('Failed to load game image')}
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: themeColors.surface }]}>
              <Ionicons name="game-controller" size={60} color={themeColors.textSecondary} />
              <Text style={[styles.placeholderText, { color: themeColors.textSecondary }]}>
                No Image Available
              </Text>
            </View>
          )}
        </View>

        {/* Game Info */}
        <View style={styles.content}>
          <Text style={[styles.gameTitle, { color: themeColors.text }]}>{game?.name || qrData?.name || 'Unknown Game'}</Text>
          
          {/* AI Recommendation Data */}
          {game?.personalized_description && (
            <View style={[styles.aiSection, { backgroundColor: themeColors.surface, borderLeftColor: themeColors.primary }]}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={20} color="#FFD700" />
                <Text style={[styles.aiTitle, { color: themeColors.primary }]}>AI Personalized Recommendation</Text>
              </View>
              <Text style={[styles.aiDescription, { color: themeColors.text }]}>{game.personalized_description}</Text>
            </View>
          )}

          {/* AI Recommendation Score */}
          {game?.recommendation_score && (
            <View style={styles.aiScoreSection}>
              <View style={styles.aiScoreHeader}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Text style={[styles.aiScoreLabel, { color: themeColors.text }]}>AI Match Score</Text>
              </View>
              <View style={styles.aiScoreContainer}>
                <View style={[styles.aiScoreBar, { backgroundColor: themeColors.border }]}>
                  <View 
                    style={[
                      styles.aiScoreFill, 
                      { 
                        width: `${game.recommendation_score * 100}%`,
                        backgroundColor: game.recommendation_score > 0.8 ? '#4CAF50' : game.recommendation_score > 0.6 ? '#FF9800' : '#F44336'
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.aiScoreValue, { color: themeColors.text }]}>
                  {Math.round(game.recommendation_score * 100)}%
                </Text>
              </View>
            </View>
          )}

          {/* Similarity Reason */}
          {game?.similarity_reason && (
            <View style={[styles.similaritySection, { backgroundColor: themeColors.surface }]}>
              <View style={styles.similarityHeader}>
                <Ionicons name="link" size={18} color={themeColors.primary} />
                <Text style={[styles.similarityLabel, { color: themeColors.text }]}>Why This Game Matches Your Taste</Text>
              </View>
              <Text style={[styles.similarityText, { color: themeColors.textSecondary }]}>{game.similarity_reason}</Text>
            </View>
          )}

          {/* Estimated Playtime */}
          {game?.estimated_playtime && (
            <View style={styles.playtimeSection}>
              <View style={styles.playtimeHeader}>
                <Ionicons name="time" size={18} color={themeColors.primary} />
                <Text style={[styles.playtimeLabel, { color: themeColors.text }]}>Estimated Playtime</Text>
              </View>
              <Text style={[styles.playtimeValue, { color: themeColors.textSecondary }]}>{game.estimated_playtime}</Text>
            </View>
          )}

          {/* Enhanced Game Data from RAWG API */}
          {(game?.rating || game?.released) && (
            <View style={[styles.enhancedDataSection, { backgroundColor: themeColors.surface }]}>
              <View style={styles.enhancedDataHeader}>
                <Ionicons name="information-circle" size={20} color={themeColors.primary} />
                <Text style={[styles.enhancedDataTitle, { color: themeColors.primary }]}>Game Information</Text>
              </View>
              
              {game.rating && (
                <View style={styles.infoRow}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Community Rating:</Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>{game.rating.toFixed(1)}/5</Text>
                </View>
              )}
              
              {game.released && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color={themeColors.primary} />
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Release Date:</Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>{formatDate(game.released)}</Text>
                </View>
              )}
            </View>
          )}

          {/* SSG QR Data Display */}
          {qrData && (
            <View style={[styles.qrDataContainer, { backgroundColor: themeColors.surface, borderLeftColor: themeColors.primary }]}>
              <Text style={[styles.qrDataTitle, { color: themeColors.primary }]}>📱 Scanned from SSG QR Code</Text>
              
              {qrData.price && (
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag" size={20} color={themeColors.primary} />
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Price:</Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>{formatPrice(qrData.price, qrData.currency)}</Text>
                </View>
              )}
              
              {qrData.platform && (
                <View style={styles.infoRow}>
                  <Ionicons name="desktop" size={20} color={themeColors.primary} />
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Platform:</Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>{qrData.platform}</Text>
                </View>
              )}
              
              {qrData.developer && (
                <View style={styles.infoRow}>
                  <Ionicons name="code" size={20} color={themeColors.primary} />
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Developer:</Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>{qrData.developer}</Text>
                </View>
              )}
              
              {qrData.publisher && (
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={20} color={themeColors.primary} />
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Publisher:</Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>{qrData.publisher}</Text>
                </View>
              )}
              
              {qrData.release_date && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color={themeColors.primary} />
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Release Date:</Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>{formatDate(qrData.release_date)}</Text>
                </View>
              )}
              
              {qrData.rating && (
                <View style={styles.infoRow}>
                  <Ionicons name="star" size={20} color={themeColors.accent} />
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Rating:</Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>{qrData.rating}/10</Text>
                </View>
              )}
              
              {qrData.age_rating && (
                <View style={styles.infoRow}>
                  <Ionicons name="shield" size={20} color={themeColors.primary} />
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Age Rating:</Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>{qrData.age_rating}</Text>
                </View>
              )}
            </View>
          )}

          {/* Game Description */}
          {(qrData?.description || game?.description) && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionTitle, { color: themeColors.text }]}>Description</Text>
              <Text style={[styles.descriptionText, { color: themeColors.textSecondary }]}>
                {qrData?.description || game?.description}
              </Text>
            </View>
          )}

          {/* Game Genres */}
          {game?.genres && game.genres.length > 0 && (
            <View style={styles.genresContainer}>
              <Text style={[styles.genresTitle, { color: themeColors.text }]}>Genres</Text>
              <View style={styles.genresList}>
                {game.genres.map((genre, index) => {
                  // Handle both AI recommendation format (string array) and database format (object array)
                  const genreName = typeof genre === 'string' 
                    ? genre 
                    : genre.name || 'Unknown Genre';
                  
                  return (
                    <View key={index} style={[styles.genreTag, { backgroundColor: themeColors.primary }]}>
                      <Text style={[styles.genreText, { color: themeColors.buttonText }]}>{genreName}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Game Platforms */}
          {game?.platforms && game.platforms.length > 0 && (
            <View style={styles.platformsContainer}>
              <Text style={[styles.platformsTitle, { color: themeColors.text }]}>Available Platforms</Text>
              <View style={styles.platformsList}>
                {game.platforms.map((platform, index) => {
                  // Handle both AI recommendation format (string array) and database format (object array)
                  const platformName = typeof platform === 'string' 
                    ? platform 
                    : platform.platform?.name || platform.name || 'Unknown Platform';
                  
                  return (
                    <View key={index} style={[styles.platformTag, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                      <Text style={[styles.platformText, { color: themeColors.text }]}>{platformName}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Store Links */}
          {game?.stores && game.stores.length > 0 && (
            <View style={styles.storesContainer}>
              <Text style={[styles.storesTitle, { color: themeColors.text }]}>Available Stores</Text>
              {game.stores.map((store, index) => (
                <TouchableOpacity key={index} style={[styles.storeButton, { backgroundColor: themeColors.surface }]}>
                  <Ionicons name="storefront" size={20} color={themeColors.primary} />
                  <Text style={[styles.storeText, { color: themeColors.text }]}>{store.store.name}</Text>
                  <Ionicons name="open" size={16} color={themeColors.primary} />
                </TouchableOpacity>
              ))}
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  favouriteButton: {
    padding: 8,
  },
  imageContainer: {
    width: width,
    height: 200,
    position: 'relative',
  },
  gameImage: {
    width: width,
    height: 200,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: width,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  gameTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  qrDataContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  qrDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  genresContainer: {
    marginBottom: 20,
  },
  genresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  platformsContainer: {
    marginBottom: 20,
  },
  platformsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  platformsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  platformTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  platformText: {
    fontSize: 14,
    fontWeight: '500',
  },
  storesContainer: {
    marginBottom: 20,
  },
  storesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  storeText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
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
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  // AI Enhancement Styles
  aiSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  aiDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiScoreSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  aiScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiScoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  aiScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiScoreBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  aiScoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  aiScoreValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
  },
  similaritySection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  similarityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  similarityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  similarityText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  playtimeSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  playtimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playtimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  playtimeValue: {
    fontSize: 15,
    marginLeft: 26,
  },
  enhancedDataSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  enhancedDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
