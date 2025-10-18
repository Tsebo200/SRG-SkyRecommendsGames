import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { PersistentFavouritesService, FavouriteGame } from '../../lib/favourites-persistent';

export default function FavouritesScreen() {
  const router = useRouter();
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
      await PersistentFavouritesService.removeDuplicates();
      
      // Then load the favourites
      const data = await PersistentFavouritesService.getFavorites();
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
                await PersistentFavouritesService.removeFavorite(favourite.game_slug!);
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
        image: '', // We don't have image in favourites yet
        platforms: game.platforms?.join(', ') || '',
        genres: game.genres?.join(', ') || '',
        stores: '{}',
      },
    });
  };

  const renderFavourite = ({ item }: { item: FavouriteGame }) => (
    <TouchableOpacity 
      style={styles.favouriteCard}
      onPress={() => goToGameDetails(item)}
    >
      <View style={styles.favouriteInfo}>
        <View style={styles.favouriteDetails}>
          <Text style={styles.favouriteName}>{item.game_name}</Text>
          {item.genres && item.genres.length > 0 && (
            <Text style={styles.favouriteGenres}>
              {item.genres.slice(0, 2).join(', ')}
            </Text>
          )}
          {item.platforms && item.platforms.length > 0 && (
            <Text style={styles.favouritePlatforms}>
              {item.platforms.slice(0, 2).join(', ')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => removeFavourite(item.game_id)}
          style={[
            styles.removeButton,
            removingGameId === item.game_id && styles.removeButtonDisabled
          ]}
          accessibilityRole="button"
          accessibilityLabel="Remove from favourites"
          disabled={removingGameId === item.game_id}
        >
          {removingGameId === item.game_id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.removeButtonText}>Remove</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading favourites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadFavourites} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favourites</Text>
        <Text style={styles.subtitle}>
          {favourites.length === 0 
            ? 'No favourite games yet' 
            : `${favourites.length} favourite${favourites.length === 1 ? '' : 's'}`
          }
        </Text>
      </View>

      {favourites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Favourites Yet</Text>
          <Text style={styles.emptySubtitle}>
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
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
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
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#a0a0a0',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
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
  },
  favouriteName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  favouriteGenres: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 2,
  },
  favouritePlatforms: {
    color: '#808080',
    fontSize: 12,
  },
  removeButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonDisabled: {
    backgroundColor: '#6b7280',
    opacity: 0.6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});