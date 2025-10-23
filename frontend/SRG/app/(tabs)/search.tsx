import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        Alert.alert('Removed', 'Game removed from favourites');
      } else {
        await HybridFavouritesService.addFavourite(game.id.toString(), game.name, game.slug, game.background_image);
        setFavourites(prev => new Set(prev).add(gameSlug));
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
    
    return (
      <TouchableOpacity onPress={() => goToDetails(item)}>
        <View style={[styles.gameCard, { backgroundColor: themeColors.card }]}>
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
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
            clearButtonMode="while-editing"
            keyboardType="default"
            textContentType="none"
          />
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
});