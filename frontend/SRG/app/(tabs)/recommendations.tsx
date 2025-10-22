import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient, Game } from '../../lib/api';
import { HybridFavouritesService } from '../../lib/favourites-hybrid';
import { SteamAPIService } from '../../lib/steam-api';

interface RecommendationGame extends Game {
  similarity_score?: number;
}

interface SteamRecommendation {
  gameName: string;
  reason: string;
  confidence: number;
  genre: string;
  estimatedPlaytime: string;
}

interface SteamRecommendations {
  recommendations: SteamRecommendation[];
  gamingProfile: {
    preferredGenres: string[];
    playStyle: string;
    gamingLevel: string;
    interests: string[];
  };
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  
  // Steam recommendations state
  const [steamRecommendations, setSteamRecommendations] = useState<SteamRecommendations | null>(null);
  const [steamLoading, setSteamLoading] = useState(false);
  const [steamProfile, setSteamProfile] = useState<string | null>(null);
  const [steamApi] = useState(new SteamAPIService('4E45453FFB33641E29B4C44FF691D29E'));

  // Load user's favourites for heart icons
  useEffect(() => {
    loadFavourites();
    checkForSteamProfile();
  }, []);

  const checkForSteamProfile = async () => {
    // Check if user has a Steam profile stored (you could use AsyncStorage or your user preferences)
    // For now, we'll assume they need to scan their Steam profile first
    // This could be enhanced to store Steam profile data when they scan it
  };

  const generateSteamRecommendations = async (steamId: string) => {
    setSteamLoading(true);
    try {
      console.log('🔄 Generating Steam-based recommendations...');
      const steamRecs = await steamApi.getPersonalisedRecommendations(steamId);
      setSteamRecommendations(steamRecs);
      setSteamProfile(steamId);
      console.log('✅ Steam recommendations generated successfully');
    } catch (error) {
      console.error('Error generating Steam recommendations:', error);
      Alert.alert('Error', 'Failed to generate Steam recommendations. Please try again.');
    } finally {
      setSteamLoading(false);
    }
  };

  const loadFavourites = async () => {
    try {
      const userFavourites = await HybridFavouritesService.getFavourites();
      console.log('🔍 Loaded favourites:', userFavourites.length, 'games');
      setFavourites(new Set(userFavourites.map(fav => fav.game_slug).filter(slug => slug !== undefined)));
    } catch (error) {
      console.error('Failed to load favourites:', error);
    }
  };

  // Generate recommendations based on user's favourites
  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user's favourite games
      const userFavourites = await HybridFavouritesService.getFavourites();
      console.log('🔍 Generating recommendations for:', userFavourites.length, 'favourite games');
      
      if (userFavourites.length === 0) {
        console.log('⚠️ No favourites found, showing empty state');
        setError('Add some games to your favourites first to get personalised recommendations!');
        setLoading(false);
        return;
      }

      // Use gpt-3.5-turbo for AI-powered recommendations
      const favouriteGameNames = userFavourites.map(fav => fav.game_name).filter(name => name !== undefined) as string[];
      console.log('🔍 Using gpt-3.5-turbo for recommendations with favourites:', favouriteGameNames);
      
      // Get test recommendations (no OpenAI required)
      console.log('🔍 Calling test recommendations API...');
      const testRecommendations = await apiClient.getTestRecommendations(favouriteGameNames);
      console.log('🔍 Received test recommendations:', testRecommendations);
      
      // Use the test recommendations directly
      setRecommendations(testRecommendations.recommendations);
      
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await generateRecommendations();
    setRefreshing(false);
  };

  const handleGamePress = (game: RecommendationGame) => {
    router.push(`/game/${game.slug}`);
  };

  const toggleFavourite = async (game: RecommendationGame) => {
    try {
      const isFavourite = favourites.has(game.slug);
      
      if (isFavourite) {
        await HybridFavouritesService.removeFavourite(game.slug);
        setFavourites(prev => {
          const newSet = new Set(prev);
          newSet.delete(game.slug);
          return newSet;
        });
      } else {
        await HybridFavouritesService.addFavourite(
          game.id.toString(),
          game.name,
          game.slug,
          game.background_image
        );
        setFavourites(prev => new Set([...prev, game.slug]));
      }
    } catch (error) {
      console.error('Failed to toggle favourite:', error);
      Alert.alert('Error', 'Failed to update favourites');
    }
  };

  const renderGameItem = ({ item }: { item: RecommendationGame }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => handleGamePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.gameImageContainer}>
        {item.background_image ? (
          <Image source={{ uri: item.background_image }} style={styles.gameImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="game-controller" size={40} color="#666" />
          </View>
        )}
        <TouchableOpacity
          style={styles.favouriteButton}
          onPress={() => toggleFavourite(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={favourites.has(item.slug) ? "heart" : "heart-outline"}
            size={24}
            color={favourites.has(item.slug) ? "#ff6b6b" : "#fff"}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.gameInfo}>
        <Text style={styles.gameName} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.genres && item.genres.length > 0 && (
          <Text style={styles.gameGenres} numberOfLines={1}>
            {item.genres.slice(0, 2).join(', ')}
          </Text>
        )}
        
        {item.similarity_score && (
          <View style={styles.similarityContainer}>
            <Ionicons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.similarityScore}>
              {Math.round(item.similarity_score * 100)}% match
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    console.log('🔍 Rendering empty state - recommendations:', recommendations.length, 'loading:', loading, 'error:', error);
    return (
      <View style={styles.emptyState}>
        <Ionicons name="bulb" size={64} color="#666" />
        <Text style={styles.emptyTitle}>No Recommendations Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add games to your favourites by searching or scanning QR codes to get personalised recommendations!
        </Text>
        <View style={styles.emptyActions}>
          <TouchableOpacity style={styles.ctaButton} onPress={generateRecommendations}>
            <Text style={styles.ctaButtonText}>Get Recommendations</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.push('/(tabs)/search')}
          >
            <Ionicons name="search" size={16} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Search Games</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.push('/(tabs)/scanner')}
          >
            <Ionicons name="qr-code" size={16} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderError = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={generateRecommendations}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recommendations</Text>
        <TouchableOpacity onPress={generateRecommendations} disabled={loading}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={loading ? "#666" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Steam Recommendations Section - Optional */}
      {steamProfile ? (
        <View style={styles.steamSection}>
          <View style={styles.steamHeader}>
            <View style={styles.steamTitleContainer}>
              <Ionicons name="logo-steam" size={20} color="#007AFF" />
              <Text style={styles.steamTitle}>Steam-Based Recommendations</Text>
            </View>
            <TouchableOpacity 
              onPress={() => generateSteamRecommendations(steamProfile)} 
              disabled={steamLoading}
            >
              {steamLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Ionicons name="refresh" size={16} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>
          
          {steamRecommendations ? (
            <View style={styles.steamRecommendations}>
              {steamRecommendations.recommendations.map((rec, index) => (
                <View key={index} style={styles.steamRecommendationItem}>
                  <View style={styles.steamRecHeader}>
                    <Text style={styles.steamRecGameName}>{rec.gameName}</Text>
                    <View style={styles.steamConfidenceBadge}>
                      <Text style={styles.steamConfidenceText}>{rec.confidence}/10</Text>
                    </View>
                  </View>
                  <Text style={styles.steamRecReason}>{rec.reason}</Text>
                  <View style={styles.steamRecMeta}>
                    <Text style={styles.steamRecGenre}>{rec.genre}</Text>
                    <Text style={styles.steamRecPlaytime}>{rec.estimatedPlaytime}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.steamEmptyState}>
              <Text style={styles.steamEmptyText}>
                Tap refresh to get AI-powered recommendations based on your Steam profile
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.optionalSteamSection}>
          <View style={styles.optionalSteamHeader}>
            <Ionicons name="logo-steam" size={20} color="#666" />
            <Text style={styles.optionalSteamTitle}>Steam Integration (Optional)</Text>
          </View>
          <Text style={styles.optionalSteamText}>
            Connect your Steam profile for AI-powered recommendations based on your gaming history
          </Text>
          <TouchableOpacity 
            style={styles.optionalSteamButton}
            onPress={() => router.push('/(tabs)/steam-profile')}
          >
            <Text style={styles.optionalSteamButtonText}>Connect Steam</Text>
            <Ionicons name="arrow-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Favourites-Based Recommendations Section */}
      <View style={styles.favouritesSection}>
        <View style={styles.favouritesHeader}>
          <Ionicons name="heart" size={20} color="#ff6b6b" />
          <Text style={styles.favouritesTitle}>Based on Your Favourites</Text>
        </View>
        <Text style={styles.favouritesSubtitle}>
          Add games to your favourites by searching or scanning QR codes to get personalised recommendations
        </Text>
      </View>

      {loading && recommendations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Finding your perfect games...</Text>
        </View>
      ) : error ? (
        renderError()
      ) : recommendations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={recommendations}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.slug}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  gameCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gameImageContainer: {
    position: 'relative',
    height: 120,
  },
  gameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favouriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    padding: 12,
  },
  gameName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameGenres: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  similarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  similarityScore: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Steam recommendations styles
  steamSection: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  steamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  steamTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  steamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  steamRecommendations: {
    gap: 8,
  },
  steamRecommendationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  steamRecHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  steamRecGameName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  steamConfidenceBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  steamConfidenceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  steamRecReason: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    lineHeight: 16,
  },
  steamRecMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  steamRecGenre: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  steamRecPlaytime: {
    fontSize: 10,
    color: '#999',
  },
  steamEmptyState: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  steamEmptyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  steamConnectSection: {
    backgroundColor: '#f0f8ff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  steamConnectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  steamConnectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  steamConnectText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  steamConnectButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  steamConnectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  // Optional Steam section styles
  optionalSteamSection: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionalSteamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionalSteamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  optionalSteamText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  optionalSteamButton: {
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  optionalSteamButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  // Favourites section styles
  favouritesSection: {
    backgroundColor: '#fff5f5',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  favouritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  favouritesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginLeft: 8,
  },
  favouritesSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Empty state action buttons
  emptyActions: {
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
