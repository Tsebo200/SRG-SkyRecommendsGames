import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { HybridFavouritesService, FavouriteGame } from '../../lib/favourites-hybrid';
import { useThemeColors } from '../../lib/theme-context';

export default function FavouritesScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [favourites, setFavourites] = useState<FavouriteGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingGameId, setRemovingGameId] = useState<string | null>(null);

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
      
      // First, remove any duplicates
      await HybridFavouritesService.removeDuplicates();
      
      // Then load the favourites
      const data = await HybridFavouritesService.getFavourites();
      console.log('✅ Favourites loaded (deduplicated):', data.length, 'items');
      setFavourites(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load favourites');
      console.error('Favourites error:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavourite = async (gameId: string) => {
    try {
      // Find the game slug from the favourites list
      const favourite = favourites.find(fav => fav.game_id === gameId);
      if (!favourite || !favourite.game_slug) {
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
            {item.game_image && (
              <Image 
                source={{ uri: item.game_image }} 
                style={styles.gameIcon}
                resizeMode="cover"
              />
            )}
            <Text style={[styles.favouriteName, { color: themeColors.text }]}>{item.game_name}</Text>
          </View>
          {item.genres && item.genres.length > 0 && (
            <Text style={[styles.favouriteGenres, { color: themeColors.textSecondary }]}>
              {item.genres.slice(0, 3).join(', ')}
          <Text style={[styles.favouriteName, { color: themeColors.text }]}>{item.game_name}</Text>
          {item.genres && item.genres.length > 0 && (
            <Text style={[styles.favouriteGenres, { color: themeColors.textSecondary }]}>
              {item.genres.slice(0, 2).join(', ')}
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
              {item.platforms.slice(0, 2).join(', ')}
            </Text>
          )}
        </View>
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
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
      <View style={styles.header}>
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