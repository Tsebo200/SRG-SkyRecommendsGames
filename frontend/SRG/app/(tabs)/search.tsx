import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Platform,
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
import { googleSpeechToTextService } from '../../lib/google-speech-to-text';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SearchScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [query, setQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);

  // Background animated bubbles
  const Bubbles = () => {
    const theme = themeColors;
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
              backgroundColor: theme.primary,
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
      if (isFavourited) {
        // Use FavouriteSound for adding
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/FavouriteSound.mp3')
        );
        await sound.playAsync();
        
        // Clean up sound after playing
        setTimeout(() => {
          sound.unloadAsync();
        }, 1000);
      } else {
        // Use RemoveSound for removing
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/RemoveSound.mp3')
        );
        await sound.playAsync();
        
        // Clean up sound after playing
        setTimeout(() => {
          sound.unloadAsync();
        }, 2000); // Longer cleanup time for remove sound
      }
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
              console.log('🔍 RAWG API response for query:', searchQuery);
              console.log('🔍 Number of games found:', response.results.length);
              
              // Check for specific games that are having issues
              const problemGames = ['Black Myth Wukong', 'Marvel Spider-Man 2'];
              const workingGames = ['Sekiro', 'Marvel Wolverine'];
              
              response.results.forEach(game => {
                if (problemGames.some(problemGame => game.name.includes(problemGame))) {
                  console.log('❌ PROBLEM GAME FOUND:', {
                    name: game.name,
                    slug: game.slug,
                    background_image: game.background_image,
                    hasImage: !!game.background_image,
                    imageLength: game.background_image?.length || 0
                  });
                }
                if (workingGames.some(workingGame => game.name.includes(workingGame))) {
                  console.log('✅ WORKING GAME FOUND:', {
                    name: game.name,
                    slug: game.slug,
                    background_image: game.background_image,
                    hasImage: !!game.background_image,
                    imageLength: game.background_image?.length || 0
                  });
                }
              });
              
              console.log('🔍 Sample game data:', response.results.slice(0, 2).map(game => ({
                name: game.name,
                slug: game.slug,
                background_image: game.background_image,
                hasImage: !!game.background_image
              })));
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
    // Pass full game data so we don't need to refetch
    router.push({
      pathname: '/game-details',
      params: {
        gameData: JSON.stringify(game),
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
        console.log('🔍 Adding to favorites:', {
          name: game.name,
          slug: game.slug,
          background_image: game.background_image,
          hasImage: !!game.background_image
        });
        
        // Check if this is one of the problem games
        if (game.name.includes('Black Myth Wukong') || game.name.includes('Marvel Spider-Man 2')) {
          console.log('🚨 ADDING PROBLEM GAME TO FAVORITES:', {
            name: game.name,
            image: game.background_image,
            imageType: typeof game.background_image,
            imageLength: game.background_image?.length || 0
          });
        }
        // Ensure we have an image: if missing, fetch full details by slug
        let imageUrl = game.background_image;
        if (!imageUrl && game.slug) {
          try {
            const full = await apiClient.getGameBySlug(game.slug);
            imageUrl = full?.background_image || full?.background_image_additional || '';
          } catch {}
        }
        await HybridFavouritesService.addFavourite(game.id.toString(), game.name, game.slug, imageUrl);
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

  // Check if Google Cloud Speech-to-Text is available on mount
  useEffect(() => {
    if (!googleSpeechToTextService.isAvailable()) {
      console.warn('⚠️ Google Cloud Speech-to-Text API key not configured');
    }
  }, []);

  const startListening = async () => {
    // Check privacy microphone consent
    try {
      const micConsent = await AsyncStorage.getItem('privacy_mic_consent');
      if (micConsent !== 'true') {
        Alert.alert(
          'Microphone Disabled',
          'Enable Microphone consent in Profile > Privacy Settings to use voice search.'
        );
        return;
      }
    } catch {}

    // Check if Google Cloud Speech-to-Text is available
    if (!googleSpeechToTextService.isAvailable()) {
      Alert.alert(
        'Voice Recognition Unavailable',
        'Google Cloud Speech-to-Text API key is not configured. Please add EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY to your environment variables.'
      );
      return;
    }

    try {
      setIsListening(true);
      console.log('🎤 Starting recording...');
      
      // Start recording audio
      await googleSpeechToTextService.startRecording();
      console.log('🎤 Recording started...');
    } catch (error: any) {
      console.error('❌ Error starting voice recognition:', error);
      setIsListening(false);
      const errorMessage = error?.message || 'Unknown error';
      
      // Handle permission errors
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        Alert.alert(
          'Microphone Permission Required',
          'Please grant microphone permission in your device settings to use voice search.'
        );
      } else {
        Alert.alert('Voice Recognition Error', `Failed to start recording: ${errorMessage}`);
      }
    }
  };

  const stopListening = async () => {
    if (!googleSpeechToTextService.isAvailable() || !isListening) return;

    try {
      setIsListening(false);
      console.log('🎤 Stopping recording and transcribing...');
      
      // Stop recording and transcribe
      const transcript = await googleSpeechToTextService.stopAndTranscribe({
        languageCode: 'en-US',
        encoding: 'LINEAR16',
      });
      
      if (transcript && transcript.trim().length > 0) {
        console.log('🎤 Transcription successful:', transcript);
        setQuery(transcript);
      } else {
        console.log('🎤 No speech detected');
        Alert.alert('No Speech Detected', 'Please try speaking again.');
      }
    } catch (error: any) {
      console.error('❌ Error transcribing audio:', error);
      const errorMessage = error?.message || 'Unknown error';
      
      // Handle specific Google Cloud API errors
      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        Alert.alert(
          'API Configuration Error',
          'Google Cloud Speech-to-Text API key is invalid. Please check your configuration.'
        );
      } else if (errorMessage.includes('No transcription results')) {
        Alert.alert('No Speech Detected', 'Please try speaking again.');
      } else {
        Alert.alert('Transcription Error', `Failed to transcribe audio: ${errorMessage}`);
      }
    }
  };

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
                    // Add to favorites with image fallback by slug
                    let imageUrl = item.background_image;
                    if (!imageUrl && item.slug) {
                      try {
                        const full = await apiClient.getGameBySlug(item.slug);
                        imageUrl = (full as any)?.background_image || (full as any)?.background_image_additional || '';
                      } catch {}
                    }
                    await HybridFavouritesService.addFavourite(item.id.toString(), item.name, item.slug, imageUrl);
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
            // Toggle favorite when swiped right
            const gameSlug = item.slug;
            const isFavourited = favourites.has(gameSlug);
            
            if (!isFavourited) {
              // Add to favorites with image fallback by slug
              let imageUrl = item.background_image;
              if (!imageUrl && item.slug) {
                try {
                  const full = await apiClient.getGameBySlug(item.slug);
                  imageUrl = (full as any)?.background_image || (full as any)?.background_image_additional || '';
                } catch {}
              }
              await HybridFavouritesService.addFavourite(item.id.toString(), item.name, item.slug, imageUrl);
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
        <Bubbles />
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
          <TouchableOpacity 
            onPressIn={() => {
              if (!isListening) startListening();
            }}
            onPressOut={() => {
              if (isListening) stopListening();
            }}
            style={styles.micButton}
            accessibilityRole="button"
            accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            <Ionicons 
              name={isListening ? 'stop-circle' : 'mic'} 
              size={24} 
              color={isListening ? '#ff6b6b' : themeColors.primary} 
            />
          </TouchableOpacity>
          {isListening && (
            <Text style={{ color: themeColors.textSecondary, marginLeft: 8 }}>Listening… release to transcribe</Text>
          )}
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
  micButton: {
    marginLeft: 8,
    padding: 4,
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