import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { apiClient, Game } from '../../lib/api';
import { HybridFavouritesService } from '../../lib/favourites-hybrid';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../lib/theme-context';

export default function SearchScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [query, setQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  // Play favorite sound and haptic feedback
  const playFavoriteFeedback = async (isFavourited: boolean) => {
    try {
      // Haptic feedback
      if (isFavourited) {
        // Light haptic for adding to favorites
        Vibration.vibrate(50);
      } else {
        // Slightly longer haptic for removing from favorites
        Vibration.vibrate(100);
      }

      // Sound feedback - use different sounds for add and remove
      const soundFile = isFavourited 
        ? require('../../assets/FavouriteSound.mp3') 
        : require('../../assets/RemoveSound.mp3');
      
      console.log('🔊 Loading sound file:', isFavourited ? 'FavouriteSound.mp3' : 'RemoveSound.mp3');
      
      const { sound } = await Audio.Sound.createAsync(soundFile);
      
      // Set volume - make RemoveSound much louder to match FavouriteSound
      if (!isFavourited) {
        await sound.setVolumeAsync(2.0); // Much higher volume for remove sound
        console.log('🔊 Playing RemoveSound at 2.0x volume');
      } else {
        await sound.setVolumeAsync(1.0); // Normal volume for favorite sound
        console.log('🔊 Playing FavouriteSound at 1.0x volume');
      }
      
      await sound.playAsync();
      console.log('🔊 Sound playback started');
      
      // Clean up sound after playing
      setTimeout(() => {
        sound.unloadAsync();
        console.log('🔊 Sound unloaded');
      }, 1000);
    } catch (error) {
      // If sound file doesn't exist, just provide haptic feedback
      console.log('Sound feedback not available, using haptic only');
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (searchQuery.trim().length >= 2) {
            setLoading(true);
            setError(null);
            try {
              const response = await apiClient.searchGames(searchQuery);
              setGames(response.results);
            } catch (err) {
              setError('Failed to search games. Please try again.');
              console.error('Search error:', err);
            } finally {
              setLoading(false);
            }
          } else {
            setGames([]);
          }
        }, 500); // 500ms debounce
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleGamePress = async (game: Game) => {
    try {
      // Convert game data to upsert format
      const upsertData = {
        slug: game.slug,
        name: game.name,
        platforms: game.platforms?.map(p => p.platform.name) || [],
        genres: game.genres?.map(g => g.name) || [],
        store_urls: game.stores?.reduce((acc, store) => {
          acc[store.store.name.toLowerCase()] = store.url;
          return acc;
        }, {} as Record<string, string>) || {},
        rubric: {
          completeness: 0.5, // Default values - would be calculated in real app
          monetisation: 0.5,
          accessibility: 0.5,
          creativity: 0.5,
        },
      };

      await apiClient.upsertGame(upsertData);
      Alert.alert('Success', 'Game added to database with AI embedding!');
    } catch (err) {
      Alert.alert('Error', 'Failed to add game to database');
      console.error('Upsert error:', err);
    }
  };

  const goToDetails = (game: Game) => {
    const platformsLabel = game.platforms?.map(p => p.platform.name).join(', ') || '';
    const genresLabel = game.genres?.map(g => g.name).join(', ') || '';
    const storeMap = (game.stores || []).reduce((acc, s) => {
      acc[s.store.name.toLowerCase()] = s.url;
      return acc;
    }, {} as Record<string, string>);

    router.push({
      pathname: `/game/${game.slug}`,
      params: {
        name: game.name,
        image: game.background_image || '',
        platforms: platformsLabel,
        genres: genresLabel,
        stores: JSON.stringify(storeMap),
      },
    });
  };

  const toggleFavourite = async (game: Game, event: any) => {
    event.stopPropagation(); // Prevent navigation when tapping heart
    
    try {
      const gameSlug = game.slug;
      const isFavourited = favourites.has(gameSlug);
      
      if (isFavourited) {
        await HybridFavouritesService.removeFavourite(gameSlug);
        setFavourites(prev => {
          const newSet = new Set(prev);
          newSet.delete(gameSlug);
          return newSet;
        });
        
        // Play feedback for removing from favorites
        await playFavoriteFeedback(false);
        Alert.alert('Removed', 'Game removed from favourites');
      } else {
        await HybridFavouritesService.addFavourite(game.id.toString(), game.name, game.slug, game.background_image);
        setFavourites(prev => new Set(prev).add(gameSlug));
        
        // Play feedback for adding to favorites
        await playFavoriteFeedback(true);
        Alert.alert('Added', 'Game added to favourites');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update favourites');
    }
  };


  // Load favourites on mount
  useEffect(() => {
    const loadFavourites = async () => {
      try {
        const favouriteGames = await HybridFavouritesService.getFavourites();
        const favouriteSlugs = new Set(favouriteGames.map(fav => fav.game_slug).filter(Boolean));
        setFavourites(favouriteSlugs);
      } catch (error) {
        console.error('Error loading favourites:', error);
      }
    };
    loadFavourites();
  }, []);

  const renderGame = ({ item }: { item: Game }) => {
    const isFavourited = favourites.has(item.slug);
    
    // Render right action (favorite action)
    const renderRightActions = (progress: Animated.AnimatedAddition<number>, dragX: Animated.AnimatedAddition<number>) => {
      const trans = dragX.interpolate({
        inputRange: [0, 50, 100, 101],
        outputRange: [20, 0, 0, -1],
        extrapolate: 'clamp',
      });
      
      return (
        <View style={styles.rightAction}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#87CEEB' }]}
            onPress={async () => {
              const gameSlug = item.slug;
              const isFavourited = favourites.has(gameSlug);
              
              if (!isFavourited) {
                // Add to favorites with feedback
                await HybridFavouritesService.addFavourite(item.id.toString(), item.name, item.slug, item.background_image);
                setFavourites(prev => new Set(prev).add(gameSlug));
                await playFavoriteFeedback(true);
              } else {
                // Remove from favorites with feedback
                await HybridFavouritesService.removeFavourite(gameSlug);
                setFavourites(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(gameSlug);
                  return newSet;
                });
                await playFavoriteFeedback(false);
              }
            }}
          >
            <Text style={styles.actionText}>
              {isFavourited ? 'Remove' : 'Favorite'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    };
    
    return (
      <Swipeable
        renderRightActions={renderRightActions}
        rightThreshold={100} // 30% of ~350px card width
        onSwipeableOpen={async (direction: string) => {
          if (direction === 'right') {
            // Auto-favorite when swiped right
            const gameSlug = item.slug;
            const isFavourited = favourites.has(gameSlug);
            if (!isFavourited) {
              // Add to favorites with feedback
              await HybridFavouritesService.addFavourite(item.id.toString(), item.name, item.slug, item.background_image);
              setFavourites(prev => new Set(prev).add(gameSlug));
              await playFavoriteFeedback(true);
            }
          }
        }}
      >
        <TouchableOpacity onPress={() => goToDetails(item)} style={[styles.gameCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.gameInfo}>
            {item.background_image && (
              <Image source={{ uri: item.background_image }} style={styles.gameImage} />
            )}
            <View style={styles.gameDetails}>
              <Text style={[styles.gameName, { color: themeColors.text }]}>{item.name}</Text>
              {item.genres && item.genres.length > 0 && (
                <Text style={[styles.gameGenres, { color: themeColors.textSecondary }]}>
                  {item.genres.slice(0, 3).map(g => g.name).join(', ')}
                </Text>
              )}
              {item.platforms && item.platforms.length > 0 && (
                <Text style={[styles.gamePlatforms, { color: themeColors.textSecondary }]}>
                  {item.platforms.slice(0, 3).map(p => p.platform.name).join(', ')}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={(e) => toggleFavourite(item, e)}
            style={[styles.favouriteButton, isFavourited && styles.favouriteButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Ionicons 
              name={isFavourited ? 'heart' : 'heart-outline'} 
              size={20} 
              color={isFavourited ? themeColors.error : themeColors.textSecondary} 
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* <View style={styles.container}> */}
          <View style={[styles.searchCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search for games..."
            placeholderTextColor={themeColors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            keyboardType="default"
            textContentType="none"
          />
          {query.length > 0 && (
            <TouchableOpacity 
              onPress={() => setQuery('')} 
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color="#87CEEB" 
              />
            </TouchableOpacity>
          )}
          {loading && <ActivityIndicator style={styles.loader} color={themeColors.primary} />}
        </View>

      {error && (
        <View style={[styles.errorCard, { backgroundColor: themeColors.error }]}>
          <Text style={[styles.errorText, { color: themeColors.buttonText }]}>{error}</Text>
        </View>
      )}

      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item) => item.id.toString()}
        style={styles.gamesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query.length > 0 && !loading ? (
            <View style={[styles.emptyCard, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No games found</Text>
            </View>
          ) : null
        }
      />
    {/* </View> */}
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 16,
  },
  searchCard: {
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    // borderColor: 'rgba(255,255,255,0.2)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderWidth: 0,
    // outline: 'none',
  },
  loader: {
    marginLeft: 12,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  errorCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
  },
  gamesList: {
    flex: 1,
  },
  gameCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameInfo: {
    flexDirection: 'row',
  },
  gameImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  gameDetails: {
    flex: 1,
  },
  gameName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameGenres: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 2,
  },
  gamePlatforms: {
    color: '#808080',
    fontSize: 12,
  },
  favouriteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 12,
  },
  favouriteButtonActive: {
    backgroundColor: 'rgba(255,107,107,0.2)',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  gameCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  swipeIndicator: {
    position: 'absolute',
    left: -80,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(135, 206, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  swipeText: {
    color: '#87CEEB',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  leftAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 20,
  },
  rightAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 100,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});