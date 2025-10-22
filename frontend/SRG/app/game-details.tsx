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

const { width } = Dimensions.get('window');

export default function GameDetailsScreen() {
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
      
      // Check if we have QR data passed from scanner
      if (params.qrData) {
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
      
      // Check if game is in favourites
      if (game) {
        const favourites = await HybridFavouritesService.getFavourites();
        const isFav = favourites.some(fav => fav.game_slug === game.slug);
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
          game_id: game.id.toString(),
          game_name: game.name,
          game_slug: game.slug,
          genres: game.genres?.map(g => g.name) || [],
          platforms: game.platforms?.map(p => p.platform.name) || [],
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading game details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!game && !qrData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Game Not Found</Text>
          <Text style={styles.errorText}>
            We couldn't find details for this game. The QR code might be invalid or the game might not be in our database.
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
          <Text style={styles.headerTitle}>Game Details</Text>
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
        </View>

        {/* Game Image */}
        {game?.background_image && (
          <Image source={{ uri: game.background_image }} style={styles.gameImage} />
        )}

        {/* Game Info */}
        <View style={styles.content}>
          <Text style={styles.gameTitle}>{game?.name || qrData?.name || 'Unknown Game'}</Text>
          
          {/* SSG QR Data Display */}
          {qrData && (
            <View style={styles.qrDataContainer}>
              <Text style={styles.qrDataTitle}>📱 Scanned from SSG QR Code</Text>
              
              {qrData.price && (
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag" size={20} color="#007AFF" />
                  <Text style={styles.infoLabel}>Price:</Text>
                  <Text style={styles.infoValue}>{formatPrice(qrData.price, qrData.currency)}</Text>
                </View>
              )}
              
              {qrData.platform && (
                <View style={styles.infoRow}>
                  <Ionicons name="desktop" size={20} color="#007AFF" />
                  <Text style={styles.infoLabel}>Platform:</Text>
                  <Text style={styles.infoValue}>{qrData.platform}</Text>
                </View>
              )}
              
              {qrData.developer && (
                <View style={styles.infoRow}>
                  <Ionicons name="code" size={20} color="#007AFF" />
                  <Text style={styles.infoLabel}>Developer:</Text>
                  <Text style={styles.infoValue}>{qrData.developer}</Text>
                </View>
              )}
              
              {qrData.publisher && (
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={20} color="#007AFF" />
                  <Text style={styles.infoLabel}>Publisher:</Text>
                  <Text style={styles.infoValue}>{qrData.publisher}</Text>
                </View>
              )}
              
              {qrData.release_date && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                  <Text style={styles.infoLabel}>Release Date:</Text>
                  <Text style={styles.infoValue}>{formatDate(qrData.release_date)}</Text>
                </View>
              )}
              
              {qrData.rating && (
                <View style={styles.infoRow}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text style={styles.infoLabel}>Rating:</Text>
                  <Text style={styles.infoValue}>{qrData.rating}/10</Text>
                </View>
              )}
              
              {qrData.age_rating && (
                <View style={styles.infoRow}>
                  <Ionicons name="shield" size={20} color="#007AFF" />
                  <Text style={styles.infoLabel}>Age Rating:</Text>
                  <Text style={styles.infoValue}>{qrData.age_rating}</Text>
                </View>
              )}
            </View>
          )}

          {/* Game Description */}
          {qrData?.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{qrData.description}</Text>
            </View>
          )}

          {/* Game Genres */}
          {game?.genres && game.genres.length > 0 && (
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

          {/* Game Platforms */}
          {game?.platforms && game.platforms.length > 0 && (
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

          {/* Store Links */}
          {game?.stores && game.stores.length > 0 && (
            <View style={styles.storesContainer}>
              <Text style={styles.storesTitle}>Available Stores</Text>
              {game.stores.map((store, index) => (
                <TouchableOpacity key={index} style={styles.storeButton}>
                  <Ionicons name="storefront" size={20} color="#007AFF" />
                  <Text style={styles.storeText}>{store.store.name}</Text>
                  <Ionicons name="open" size={16} color="#007AFF" />
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
  gameImage: {
    width: width,
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  gameTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  qrDataContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  qrDataTitle: {
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
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  genresContainer: {
    marginBottom: 20,
  },
  genresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  platformsContainer: {
    marginBottom: 20,
  },
  platformsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  platformsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  platformTag: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  platformText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  storesContainer: {
    marginBottom: 20,
  },
  storesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  storeText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
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
});
