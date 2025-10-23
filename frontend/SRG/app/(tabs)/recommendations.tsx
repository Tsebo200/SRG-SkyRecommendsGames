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
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient, Game } from '../../lib/api';
import { HybridFavouritesService } from '../../lib/favourites-hybrid';
import { SteamAPIService } from '../../lib/steam-api';
import { useThemeColors } from '../../lib/theme-context';

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
  const themeColors = useThemeColors();
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
  
  // View mode state
  const [isGridView, setIsGridView] = useState(true);

  // Load user's favourites for heart icons
  useEffect(() => {
    loadFavourites();
    checkForSteamProfile();
  }, []);

  // Monitor recommendations count
  useEffect(() => {
    console.log('📊 Recommendations updated - count:', recommendations.length);
    if (recommendations.length > 0) {
      console.log('🎮 Recommendation names:', recommendations.map(r => r.name));
    }
  }, [recommendations]);

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
      console.log('🔍 Using gpt-3.5-turbo for AI recommendations with favourites:', favouriteGameNames);
      
      // Get AI-powered recommendations using GPT-3.5-turbo
      console.log('🔍 Calling AI recommendations API... (this may take 15-30 seconds)');
      console.log('🤖 AI is analyzing your preferences and fetching game data...');
      const aiRecommendations = await apiClient.getRecommendations(favouriteGameNames);
      console.log('🔍 Received AI recommendations:', aiRecommendations);
      
      // The AI response now comes as an array of game objects with images
      console.log('🔍 Full AI response:', aiRecommendations);
      console.log('🔍 AI recommendations with images:', aiRecommendations.recommendations);
      console.log('🔍 Recommendations type:', typeof aiRecommendations.recommendations);
      console.log('🔍 Is array?', Array.isArray(aiRecommendations.recommendations));
      
      // Handle different response formats
      if (Array.isArray(aiRecommendations.recommendations)) {
        console.log('✅ Using enhanced recommendations with images');
        console.log('🔍 Number of recommendations received:', aiRecommendations.recommendations.length);
        console.log('🔍 First recommendation data:', aiRecommendations.recommendations[0]);
        console.log('🖼️ First recommendation image:', aiRecommendations.recommendations[0]?.background_image);
        setRecommendations(aiRecommendations.recommendations);
      } else if (typeof aiRecommendations.recommendations === 'string') {
        console.log('⚠️ Received string response, parsing JSON...');
        console.log('🔍 Raw string response:', aiRecommendations.recommendations);
        
        try {
          // Clean up the response - remove any markdown formatting or extra text
          let cleanResponse = aiRecommendations.recommendations.trim();
          
          // Remove markdown code blocks if present
          if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          // Remove any text before the JSON array
          const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            cleanResponse = jsonMatch[0];
          }
          
          // Remove any trailing text after the JSON array
          const endMatch = cleanResponse.match(/^(\[[\s\S]*\]).*$/);
          if (endMatch) {
            cleanResponse = endMatch[1];
          }
          
          console.log('🔍 Cleaned response:', cleanResponse);
          
          const parsedRecommendations = JSON.parse(cleanResponse);
          if (Array.isArray(parsedRecommendations)) {
            console.log('✅ Successfully parsed JSON recommendations');
            console.log('🔍 Number of parsed recommendations:', parsedRecommendations.length);
            setRecommendations(parsedRecommendations);
          } else {
            throw new Error('Parsed response is not an array');
          }
        } catch (parseError) {
          console.error('Failed to parse string recommendations:', parseError);
          console.log('🔍 Final cleaned response that failed:', aiRecommendations.recommendations);
          
          // Create a fallback recommendation from the raw text
          const fallbackRecommendations = [{
            name: "AI-Generated Recommendations",
            description: aiRecommendations.recommendations,
            similarity_reason: "Generated by GPT-3.5-turbo based on your favourites",
            similarity_score: 0.9,
            platforms: ["Multiple"],
            estimated_playtime: "Varies",
            rating: "AI Recommended"
          }];
          
          setRecommendations(fallbackRecommendations);
        }
      } else {
        console.error('Unexpected response format:', aiRecommendations);
        setError('Failed to load recommendations. Please try again.');
      }
      
      // Log the final count after state update
      setTimeout(() => {
        console.log('🎯 Final recommendations count after state update:', recommendations.length);
      }, 100);
      
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('timeout')) {
        setError('AI recommendations are taking longer than expected. Please try again - this usually works on the second attempt.');
      } else if (error.message?.includes('Network Error')) {
        setError('Network connection issue. Please check your internet connection and try again.');
      } else {
        setError('Failed to generate AI recommendations. Please try again.');
      }
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
    // Pass the full game object with AI recommendation data
    router.push({
      pathname: '/game-details',
      params: {
        gameData: JSON.stringify(game)
      }
    });
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

  const renderGameItem = ({ item }: { item: RecommendationGame }) => {
    // Enhanced game item with better recommendation display
    const getRecommendationBadge = (score: number) => {
      if (score >= 0.9) return { text: 'Perfect Match', color: '#4CAF50' };
      if (score >= 0.8) return { text: 'Great Match', color: '#8BC34A' };
      if (score >= 0.7) return { text: 'Good Match', color: '#FFC107' };
      return { text: 'Decent Match', color: '#FF9800' };
    };

    const badge = item.similarity_score ? getRecommendationBadge(item.similarity_score) : null;

    return (
      <TouchableOpacity
        style={[
          isGridView ? styles.gameCard : styles.gameCardList, 
          { backgroundColor: themeColors.card }
        ]}
        onPress={() => handleGamePress(item)}
        activeOpacity={0.8}
      >
        <View style={isGridView ? styles.gameImageContainer : styles.gameImageContainerList}>
          {item.background_image ? (
            <Image 
              source={{ uri: item.background_image }} 
              style={isGridView ? styles.gameImage : styles.gameImageList}
              resizeMode="cover"
              onLoad={() => console.log('✅ Image loaded successfully:', item.background_image)}
              onError={(error) => console.log('❌ Image failed to load:', item.background_image, error)}
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: themeColors.surface }]}>
              <Ionicons name="game-controller" size={40} color={themeColors.textSecondary} />
              <Text style={{ color: themeColors.textSecondary, fontSize: 10, marginTop: 4 }}>
                {item.name || 'Game'}
              </Text>
              <Text style={{ color: themeColors.textSecondary, fontSize: 8, marginTop: 2, opacity: 0.7 }}>
                No Image Available
              </Text>
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
          
          {badge && (
            <View style={[styles.recommendationBadge, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeText}>{badge.text}</Text>
            </View>
          )}
        </View>

        <View style={isGridView ? styles.gameInfo : styles.gameInfoList}>
          <Text style={[styles.gameName, { color: themeColors.text }]} numberOfLines={2}>
            {item.name}
          </Text>

          {item.genres && item.genres.length > 0 && (
            <Text style={[styles.gameGenres, { color: themeColors.textSecondary }]} numberOfLines={1}>
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

          {/* Enhanced recommendation details */}
          {item.personalized_description && (
            <Text style={[styles.gameDescription, { color: themeColors.textSecondary }]} numberOfLines={3}>
              {item.personalized_description}
            </Text>
          )}

          {item.similarity_reason && (
            <Text style={[styles.similarityReason, { color: themeColors.primary }]} numberOfLines={2}>
              {item.similarity_reason}
            </Text>
          )}

          {/* AI-enhanced recommendation score */}
          {item.recommendation_score && (
            <View style={styles.aiScoreContainer}>
              <Ionicons name="sparkles" size={14} color="#FFD700" />
              <Text style={styles.aiScoreText}>
                AI Score: {Math.round(item.recommendation_score * 100)}%
              </Text>
            </View>
          )}

          {/* Additional metadata */}
          <View style={styles.gameMetadata}>
            {item.platforms && item.platforms.length > 0 && (
              <View style={styles.metadataItem}>
                <Ionicons name="desktop" size={12} color={themeColors.textSecondary} />
                <Text style={[styles.metadataText, { color: themeColors.textSecondary }]}>
                  {item.platforms.slice(0, 2).join(', ')}
                </Text>
              </View>
            )}
            {item.estimated_playtime && (
              <View style={styles.metadataItem}>
                <Ionicons name="time" size={12} color={themeColors.textSecondary} />
                <Text style={[styles.metadataText, { color: themeColors.textSecondary }]}>
                  {item.estimated_playtime}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    console.log('🔍 Rendering empty state - recommendations:', recommendations.length, 'loading:', loading, 'error:', error);
    return (
      <View style={styles.emptyState}>
        <Ionicons name="bulb" size={64} color={themeColors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Recommendations Yet</Text>
        <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
          Add games to your favourites by searching or scanning QR codes to get personalised recommendations!
        </Text>
        <View style={styles.emptyActions}>
          <TouchableOpacity style={[styles.ctaButton, { backgroundColor: themeColors.primary }]} onPress={generateRecommendations}>
            <Text style={[styles.ctaButtonText, { color: themeColors.buttonText }]}>Get Recommendations</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: themeColors.surface }]} 
            onPress={() => router.push('/(tabs)/search')}
          >
            <Ionicons name="search" size={16} color={themeColors.primary} />
            <Text style={[styles.secondaryButtonText, { color: themeColors.primary }]}>Search Games</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: themeColors.surface }]} 
            onPress={() => router.push('/(tabs)/scanner')}
          >
            <Ionicons name="qr-code" size={16} color={themeColors.primary} />
            <Text style={[styles.secondaryButtonText, { color: themeColors.primary }]}>Scan QR Code</Text>
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

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={themeColors.primary} />
      <Text style={[styles.loadingText, { color: themeColors.text }]}>🤖 AI is analyzing your preferences...</Text>
      <Text style={[styles.loadingSubtext, { color: themeColors.textSecondary }]}>
        This may take 15-30 seconds while we fetch game data and generate personalized recommendations
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Recommendations</Text>
        <View style={styles.headerActions}>
          <View style={styles.viewToggle}>
            <Ionicons 
              name="grid" 
              size={16} 
              color={isGridView ? themeColors.primary : themeColors.textSecondary} 
            />
            <Switch
              value={isGridView}
              onValueChange={setIsGridView}
              trackColor={{ false: themeColors.surface, true: themeColors.primary }}
              thumbColor={isGridView ? themeColors.buttonText : themeColors.textSecondary}
            />
            <Ionicons 
              name="list" 
              size={16} 
              color={!isGridView ? themeColors.primary : themeColors.textSecondary} 
            />
          </View>
          <TouchableOpacity onPress={generateRecommendations} disabled={loading}>
            <Ionicons 
              name="refresh" 
              size={24} 
              color={loading ? themeColors.textSecondary : themeColors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : recommendations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          key={isGridView ? 'grid' : 'list'}
          data={recommendations}
          renderItem={renderGameItem}
          keyExtractor={(item, index) => item.slug || `recommendation-${index}`}
          numColumns={isGridView ? 2 : 1}
          columnWrapperStyle={isGridView ? styles.row : undefined}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View>
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
              ) : null}
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add space for tab bar
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameImageContainer: {
    position: 'relative',
    height: 160,
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
    borderRadius: 8,
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
  // List view styles
  gameCardList: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameImageContainerList: {
    position: 'relative',
    width: 120,
    height: 90,
  },
  gameImageList: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gameInfoList: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
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
  // Enhanced recommendation styles
  recommendationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  gameDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  similarityReason: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 4,
  },
  gameMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 10,
  },
  aiScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  aiScoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
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
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
