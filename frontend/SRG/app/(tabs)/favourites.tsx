import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { HybridFavouritesService, FavouriteGame } from '../../lib/favourites-hybrid';
import { apiClient } from '../../lib/api';
import { useThemeColors } from '../../lib/theme-context';

export default function FavouritesScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [favourites, setFavourites] = useState<FavouriteGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingGameId, setRemovingGameId] = useState<string | null>(null);

  // Background animated bubbles
  const Bubbles = () => {
    const configs = [
      { size: 180, top: -30, left: -50, baseOpacity: 0.10, duration: 7000, delay: 0 },
      { size: 140, top: 80, right: -30, baseOpacity: 0.09, duration: 6000, delay: 400 },
      { size: 100, top: 260, left: -20, baseOpacity: 0.08, duration: 6500, delay: 800 },
      { size: 220, bottom: -70, right: -80, baseOpacity: 0.06, duration: 8000, delay: 1200 },
      { size: 120, bottom: 140, left: 30, baseOpacity: 0.07, duration: 7500, delay: 1600 },
    ];
    const translateVals = useRef(configs.map(() => new Animated.Value(0))).current;
    const scaleVals = useRef(configs.map(() => new Animated.Value(1))).current;
    const opacityVals = useRef(configs.map(() => new Animated.Value(0))).current;
    useEffect(() => {
      const animations = configs.map((cfg, i) => {
        const float = Animated.loop(
          Animated.sequence([
            Animated.timing(translateVals[i], { toValue: 10, duration: cfg.duration, delay: cfg.delay, useNativeDriver: true }),
            Animated.timing(translateVals[i], { toValue: 0, duration: cfg.duration, useNativeDriver: true }),
          ])
        );
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleVals[i], { toValue: 1.06, duration: cfg.duration, delay: cfg.delay, useNativeDriver: true }),
            Animated.timing(scaleVals[i], { toValue: 1.0, duration: cfg.duration, useNativeDriver: true }),
          ])
        );
        const fade = Animated.loop(
          Animated.sequence([
            Animated.timing(opacityVals[i], { toValue: 1, duration: cfg.duration, delay: cfg.delay, useNativeDriver: true }),
            Animated.timing(opacityVals[i], { toValue: 0, duration: cfg.duration, useNativeDriver: true }),
          ])
        );
        float.start();
        pulse.start();
        fade.start();
        return { float, pulse, fade };
      });
      return () => { animations.forEach(a => { a.float.stop(); a.pulse.stop(); a.fade.stop(); }); };
    }, []);
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {configs.map((b, idx) => (
          <Animated.View
            key={`bubble-${idx}`}
            style={{
              position: 'absolute',
              width: b.size,
              height: b.size,
              borderRadius: b.size / 2,
              backgroundColor: themeColors.primary,
              opacity: opacityVals[idx].interpolate({ inputRange: [0, 1], outputRange: [b.baseOpacity, Math.min(b.baseOpacity + 0.06, 0.2)] }),
              top: b.top,
              left: b.left,
              right: b.right,
              bottom: b.bottom,
              shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
              transform: [{ translateY: translateVals[idx] }, { scale: scaleVals[idx] }],
            }}
          />
        ))}
      </View>
    );
  };

  useEffect(() => {
    loadFavourites();
  }, []);

  // Refresh favourites when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 Favourites tab focused - refreshing favourites...');
      loadFavourites();
    }, [])
  );

  const loadFavourites = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading favourites with persistence...');
      
      // First, force clean any corrupted data
      await HybridFavouritesService.forceCleanCorruptedData();
      
      // Then, remove any duplicates
      await HybridFavouritesService.removeDuplicates();
      
      // Then load the favourites
      const data = await HybridFavouritesService.getFavourites();
      console.log('✅ Favourites loaded (deduplicated):', data.length, 'items');
      
      // Clean up any corrupted data - filter out invalid entries
      const cleanedFavourites = data
        .filter(fav => {
          // Remove entries with invalid game_id or game_slug
          const hasValidId = fav.game_id && 
            typeof fav.game_id === 'string' && 
            fav.game_id !== '[object Object]' && 
            fav.game_id !== 'unknown' &&
            fav.game_id.length > 0;
          
          const hasValidSlug = fav.game_slug && 
            typeof fav.game_slug === 'string' && 
            fav.game_slug.length > 0;
          
          return hasValidId && hasValidSlug;
        })
        .map(fav => {
          // Debug specific problem games
          if (fav.game_name?.includes('Black Myth Wukong') || fav.game_name?.includes('Marvel Spider-Man 2')) {
            console.log('🚨 PROBLEM GAME IN FAVORITES:', {
              name: fav.game_name,
              slug: fav.game_slug,
              image: fav.game_image,
              imageType: typeof fav.game_image,
              imageLength: fav.game_image?.length || 0,
              hasImage: !!fav.game_image
            });
          }
          
          return {
            ...fav,
            game_id: String(fav.game_id),
            game_slug: String(fav.game_slug),
            game_name: String(fav.game_name || 'Unknown Game'),
            game_image: fav.game_image || undefined,
            genres: fav.genres || [],
            platforms: fav.platforms || []
          };
        });
      
      console.log('🧹 Cleaned favourites data:', cleanedFavourites.length, 'items');
      setFavourites(cleanedFavourites);

      // Lazy backfill missing images by slug
      const missing = cleanedFavourites.filter(f => (!f.game_image || f.game_image.length === 0) && f.game_slug);
      if (missing.length > 0) {
        (async () => {
          for (const fav of missing) {
            try {
              const full = await apiClient.getGameBySlug(fav.game_slug!);
              const imageUrl = (full as any)?.background_image || (full as any)?.background_image_additional;
              if (imageUrl) {
                await HybridFavouritesService.updateFavouriteImage(fav.game_slug!, imageUrl);
                // update in-memory state too
                setFavourites(prev => prev.map(p => p.game_slug === fav.game_slug ? { ...p, game_image: imageUrl } : p));
              }
            } catch {}
          }
        })();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load favourites');
      console.error('Favourites error:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavourite = async (gameId: string) => {
    try {
      console.log('🔍 Attempting to remove favourite with gameId:', gameId);
      console.log('🔍 Available favourites:', favourites.map(fav => ({ game_id: fav.game_id, game_slug: fav.game_slug, game_name: fav.game_name })));
      
      // Clean up corrupted data - ensure all game_ids are strings
      const cleanedFavourites = favourites.map(fav => ({
        ...fav,
        game_id: typeof fav.game_id === 'string' ? fav.game_id : String(fav.game_id)
      }));
      
      // Find the game slug from the favourites list
      const favourite = cleanedFavourites.find(fav => fav.game_id === gameId);
      if (!favourite || !favourite.game_slug) {
        console.error('❌ Game not found in favourites. Looking for gameId:', gameId);
        console.error('❌ Available gameIds:', cleanedFavourites.map(fav => fav.game_id));
        console.error('❌ Raw favourites data:', favourites);
        Alert.alert('Error', 'Game not found in favourites');
        return;
      }
      
      // Show confirmation dialog
      Alert.alert(
        'Remove from Favourites',
        `Are you sure you want to remove "${favourite.game_name || 'this game'}" from your favourites?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                setRemovingGameId(gameId);
                await HybridFavouritesService.removeFavourite(favourite.game_slug!);
                setFavourites(prev => prev.filter(fav => fav.game_id !== gameId));
                Alert.alert('Removed', 'Game removed from favourites');
              } catch (err: any) {
                Alert.alert('Error', 'Failed to remove from favourites');
                console.error('Remove favourite error:', err);
              } finally {
                setRemovingGameId(null);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', 'Failed to remove from favourites');
      console.error('Remove favourite error:', err);
    }
  };

  const goToGameDetails = (game: FavouriteGame) => {
    if (!game.game_slug) return;
    
    router.push({
      pathname: `/game/${game.game_slug}`,
      params: {
        name: game.game_name || '',
        image: game.game_image || '', // Use stored image if available
        platforms: game.platforms?.join(', ') || '',
        genres: game.genres?.join(', ') || '',
        stores: '{}', // We'll enhance this later if needed
        slug: game.game_slug,
      },
    });
  };

  const renderFavourite = ({ item }: { item: FavouriteGame }) => (
    <TouchableOpacity 
      style={[styles.favouriteCard, { 
        backgroundColor: themeColors.card,
        borderColor: themeColors.border 
      }]}
      onPress={() => goToGameDetails(item)}
    >
      <View style={styles.favouriteInfo}>
        <View style={styles.favouriteDetails}>
          <View style={styles.gameTitleRow}>
            {item.game_image ? (
              <Image 
                source={{ uri: item.game_image }} 
                style={styles.gameIcon}
                resizeMode="cover"
                onError={(error) => {
                  console.log('❌ Image failed to load for', item.game_name, ':', item.game_image);
                  if (item.game_name?.includes('Black Myth Wukong') || item.game_name?.includes('Marvel Spider-Man 2')) {
                    console.log('🚨 PROBLEM GAME IMAGE ERROR:', {
                      name: item.game_name,
                      image: item.game_image,
                      error: error
                    });
                  }
                }}
                onLoad={() => {
                  console.log('✅ Image loaded for', item.game_name);
                  if (item.game_name?.includes('Black Myth Wukong') || item.game_name?.includes('Marvel Spider-Man 2')) {
                    console.log('🎉 PROBLEM GAME IMAGE SUCCESS:', {
                      name: item.game_name,
                      image: item.game_image
                    });
                  }
                }}
              />
            ) : (
              <View style={[styles.gameIcon, { backgroundColor: themeColors.card, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>No Image</Text>
                {(item.game_name?.includes('Black Myth Wukong') || item.game_name?.includes('Marvel Spider-Man 2')) && (
                  <Text style={{ color: themeColors.textSecondary, fontSize: 10, marginTop: 2 }}>
                    {item.game_name}
                  </Text>
                )}
              </View>
            )}
            <Text style={[styles.favouriteName, { color: themeColors.text }]}>{item.game_name}</Text>
          </View>
          {item.genres && item.genres.length > 0 && (
            <Text style={[styles.favouriteGenres, { color: themeColors.textSecondary }]}>
              {item.genres.slice(0, 3).join(', ')}
            </Text>
          )}
          {item.platforms && item.platforms.length > 0 && (
            <Text style={[styles.favouritePlatforms, { color: themeColors.textSecondary }]}>
              {item.platforms.slice(0, 3).join(', ')}
            </Text>
          )}
        </View>
        <View style={styles.favouriteActions}>
          <TouchableOpacity
            onPress={() => goToGameDetails(item)}
            style={[styles.viewButton, { backgroundColor: themeColors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="View game details"
          >
            <Text style={[styles.viewButtonText, { color: themeColors.buttonText }]}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => removeFavourite(item.game_id)}
            style={[
              styles.removeButton,
              { backgroundColor: themeColors.error },
              removingGameId === item.game_id && styles.removeButtonDisabled
            ]}
            accessibilityRole="button"
            accessibilityLabel="Remove from favourites"
            disabled={removingGameId === item.game_id}
          >
            {removingGameId === item.game_id ? (
              <ActivityIndicator size="small" color={themeColors.buttonText} />
            ) : (
              <Text style={[styles.removeButtonText, { color: themeColors.buttonText }]}>Remove</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading favourites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
          <TouchableOpacity onPress={loadFavourites} style={[styles.retryButton, { backgroundColor: themeColors.primary }]}>
            <Text style={[styles.retryButtonText, { color: themeColors.buttonText }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Bubbles />
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.title, { color: themeColors.text }]}>Favourites</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {favourites.length === 0 
            ? 'No favourite games yet' 
            : `${favourites.length} favourite${favourites.length === 1 ? '' : 's'}`
          }
        </Text>
      </View>

      {favourites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Favourites Yet</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
            Games you favourite will appear here. Start by searching for games and tapping the heart icon!
          </Text>
        </View>
      ) : (
        <FlatList
          data={favourites}
          renderItem={renderFavourite}
          keyExtractor={(item) => `${item.user_id}-${item.game_id}`}
          style={styles.favouritesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.favouritesListContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  favouritesList: {
    flex: 1,
  },
  favouritesListContent: {
    padding: 16,
  },
  favouriteCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  favouriteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favouriteDetails: {
    flex: 1,
    marginRight: 12,
  },
  gameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gameIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
  },
  favouriteName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  favouriteGenres: {
    fontSize: 14,
    marginBottom: 2,
  },
  favouritePlatforms: {
    fontSize: 12,
  },
  favouriteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonDisabled: {
    opacity: 0.6,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});