import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../lib/theme-context';
import { apiClient, Game } from '../lib/api';
import { HybridFavouritesService } from '../lib/favourites-hybrid';
import { getRandomGameNews } from '../lib/game-news-quips';

interface AwardCategory {
  id: string;
  name: string;
}

interface AwardYear {
  year: number;
  label: string;
}

// Award categories (Game of the Year, Best Action, etc.)
const AWARD_CATEGORIES: AwardCategory[] = [
  { id: 'all', name: 'All Categories' },
  { id: 'goty', name: 'Game of the Year' },
  { id: 'action', name: 'Best Action Game' },
  { id: 'rpg', name: 'Best RPG' },
  { id: 'adventure', name: 'Best Adventure' },
  { id: 'strategy', name: 'Best Strategy' },
  { id: 'indie', name: 'Best Indie' },
  { id: 'sports', name: 'Best Sports/Racing' },
  { id: 'multiplayer', name: 'Best Multiplayer' },
  { id: 'narrative', name: 'Best Narrative' },
  { id: 'art', name: 'Best Art Direction' },
  { id: 'audio', name: 'Best Audio Design' },
];

// Years for awards (recent years)
const AWARD_YEARS: AwardYear[] = [
  { year: 2024, label: '2024' },
  { year: 2023, label: '2023' },
  { year: 2022, label: '2022' },
  { year: 2021, label: '2021' },
  { year: 2020, label: '2020' },
  { year: 2019, label: '2019' },
  { year: 2018, label: '2018' },
  { year: 2017, label: '2017' },
  { year: 2016, label: '2016' },
  { year: 2015, label: '2015' },
];

// Curated award-winning games by year and category
const AWARD_WINNERS: Record<number, Record<string, string[]>> = {
  2024: {
    goty: ['Final Fantasy VII Rebirth'],
    action: ['Helldivers 2', 'Prince of Persia: The Lost Crown'],
    rpg: ['Final Fantasy VII Rebirth', 'Like a Dragon: Infinite Wealth'],
    adventure: ['Final Fantasy VII Rebirth', 'Prince of Persia: The Lost Crown'],
    indie: ['Palworld', 'Hades II'],
    narrative: ['Final Fantasy VII Rebirth', 'Like a Dragon: Infinite Wealth'],
  },
  2023: {
    goty: ['Baldur\'s Gate 3'],
    action: ['Armored Core VI: Fires of Rubicon', 'Hi-Fi Rush'],
    rpg: ['Baldur\'s Gate 3', 'Final Fantasy XVI'],
    adventure: ['The Legend of Zelda: Tears of the Kingdom', 'Alan Wake 2'],
    indie: ['Sea of Stars', 'Cocoon'],
    narrative: ['Alan Wake 2', 'Baldur\'s Gate 3'],
  },
  2022: {
    goty: ['Elden Ring'],
    action: ['God of War Ragnarök', 'Bayonetta 3'],
    rpg: ['Elden Ring', 'Xenoblade Chronicles 3'],
    adventure: ['God of War Ragnarök', 'Horizon Forbidden West'],
    indie: ['Stray', 'Tunic'],
    narrative: ['God of War Ragnarök', 'Immortality'],
  },
  2021: {
    goty: ['It Takes Two'],
    action: ['Returnal', 'Metroid Dread'],
    rpg: ['Monster Hunter Rise', 'Tales of Arise'],
    adventure: ['Psychonauts 2', 'Ratchet & Clank: Rift Apart'],
    indie: ['Kena: Bridge of Spirits', 'Death\'s Door'],
    narrative: ['Life is Strange: True Colors', 'Marvel\'s Guardians of the Galaxy'],
  },
  2020: {
    goty: ['The Last of Us Part II'],
    action: ['Doom Eternal', 'Ghost of Tsushima'],
    rpg: ['Final Fantasy VII Remake', 'Persona 5 Royal'],
    adventure: ['The Last of Us Part II', 'Ghost of Tsushima'],
    indie: ['Hades', 'Spiritfarer'],
    narrative: ['The Last of Us Part II', 'Kentucky Route Zero'],
  },
  2019: {
    goty: ['Sekiro: Shadows Die Twice'],
    action: ['Devil May Cry 5', 'Gears 5'],
    rpg: ['Disco Elysium', 'Fire Emblem: Three Houses'],
    adventure: ['Death Stranding', 'Control'],
    indie: ['Untitled Goose Game', 'Outer Wilds'],
    narrative: ['Disco Elysium', 'Outer Wilds'],
  },
  2018: {
    goty: ['God of War'],
    action: ['Monster Hunter: World', 'Call of Duty: Black Ops 4'],
    rpg: ['Monster Hunter: World', 'Pillars of Eternity II: Deadfire'],
    adventure: ['God of War', 'Red Dead Redemption 2'],
    indie: ['Celeste', 'Dead Cells'],
    narrative: ['Red Dead Redemption 2', 'Detroit: Become Human'],
  },
  2017: {
    goty: ['The Legend of Zelda: Breath of the Wild'],
    action: ['Wolfenstein II: The New Colossus', 'Cuphead'],
    rpg: ['Persona 5', 'Divinity: Original Sin II'],
    adventure: ['The Legend of Zelda: Breath of the Wild', 'Horizon Zero Dawn'],
    indie: ['Cuphead', 'What Remains of Edith Finch'],
    narrative: ['What Remains of Edith Finch', 'Hellblade: Senua\'s Sacrifice'],
  },
  2016: {
    goty: ['Overwatch'],
    action: ['Doom', 'Titanfall 2'],
    rpg: ['Dark Souls III', 'The Witcher 3: Wild Hunt - Blood and Wine'],
    adventure: ['Uncharted 4: A Thief\'s End', 'Inside'],
    indie: ['Inside', 'Firewatch'],
    narrative: ['Inside', 'Oxenfree'],
  },
  2015: {
    goty: ['The Witcher 3: Wild Hunt'],
    action: ['Metal Gear Solid V: The Phantom Pain', 'Batman: Arkham Knight'],
    rpg: ['The Witcher 3: Wild Hunt', 'Fallout 4'],
    adventure: ['Metal Gear Solid V: The Phantom Pain', 'Ori and the Blind Forest'],
    indie: ['Rocket League', 'Undertale'],
    narrative: ['Her Story', 'Life is Strange'],
  },
};

export default function AwardsScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [awardGames, setAwardGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [gameNews, setGameNews] = useState<string>(getRandomGameNews());

  useEffect(() => {
    loadAwardGames();
  }, [selectedYear, selectedCategory]);

  // Load favourites
  useEffect(() => {
    const loadFavourites = async () => {
      try {
        const favouriteGames = await HybridFavouritesService.getFavourites();
        const favouriteSlugs = new Set(favouriteGames.map(fav => fav.game_slug).filter(Boolean) as string[]);
        setFavourites(favouriteSlugs);
      } catch (error) {
        console.warn('Failed to load favourites:', error);
      }
    };
    loadFavourites();
  }, []);

  // Rotate game news jokes every 3 seconds while loading
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setGameNews(getRandomGameNews());
    }, 3000); // Change joke every 3 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const loadAwardGames = async () => {
    try {
      setLoading(true);
      const games: Game[] = [];
      
      // Get games for selected year and category
      const yearWinners = AWARD_WINNERS[selectedYear] || {};
      const categoriesToFetch = selectedCategory === 'all' 
        ? Object.keys(yearWinners) 
        : [selectedCategory];
      
      // Collect all unique game names first
      const gameNamesSet = new Set<string>();
      for (const category of categoriesToFetch) {
        const gameNames = yearWinners[category] || [];
        gameNames.forEach(name => gameNamesSet.add(name));
      }
      
      const uniqueGameNames = Array.from(gameNamesSet);
      
      // Fetch games with rate limiting (delay between requests to avoid 429 errors)
      for (let i = 0; i < uniqueGameNames.length; i++) {
        const gameName = uniqueGameNames[i];
        
        // Add delay between requests (except for the first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between requests
        }
        
        try {
          const searchResult = await apiClient.searchGames(gameName);
          if (searchResult.results && searchResult.results.length > 0) {
            const game = searchResult.results[0];
            // Avoid duplicates
            if (!games.find(g => g.id === game.id)) {
              games.push({ ...game, rating: game.rating || 4.5 }); // Add default rating
            }
          }
        } catch (error: any) {
          // Handle 429 errors gracefully
          if (error?.response?.status === 429 || error?.message?.includes('429')) {
            console.warn(`Rate limited while fetching ${gameName}, waiting before retry...`);
            // Wait longer if we hit rate limit
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Try once more
            try {
              const searchResult = await apiClient.searchGames(gameName);
              if (searchResult.results && searchResult.results.length > 0) {
                const game = searchResult.results[0];
                if (!games.find(g => g.id === game.id)) {
                  games.push({ ...game, rating: game.rating || 4.5 });
                }
              }
            } catch (retryError) {
              console.warn(`Failed to fetch ${gameName} after retry:`, retryError);
            }
          } else {
            console.warn(`Failed to fetch ${gameName}:`, error);
          }
        }
      }
      
      setAwardGames(games);
    } catch (error) {
      console.error('Error loading award games:', error);
      setAwardGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGamePress = (game: Game) => {
    router.push(`/game-details?slug=${game.slug}`);
  };

  const handleToggleFavourite = async (game: Game, event: any) => {
    event.stopPropagation(); // Prevent card press
    
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
      } else {
        const imageUrl = game.background_image || undefined;
        await HybridFavouritesService.addFavourite(
          game.id.toString(),
          game.name,
          gameSlug,
          imageUrl
        );
        setFavourites(prev => new Set(prev).add(gameSlug));
      }
    } catch (error) {
      console.error('Failed to toggle favourite:', error);
    }
  };

  const renderGame = ({ item }: { item: Game }) => {
    const isFavourited = favourites.has(item.slug);
    
    return (
      <TouchableOpacity
        style={[styles.gameCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
        onPress={() => handleGamePress(item)}
      >
        <View style={styles.gameImageContainer}>
          {item.background_image ? (
            <Image
              source={{ uri: item.background_image }}
              style={styles.gameImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.gameImagePlaceholder, { backgroundColor: themeColors.primary }]}>
              <Ionicons name="trophy" size={32} color={themeColors.buttonText} />
            </View>
          )}
          <TouchableOpacity
            style={styles.favouriteButton}
            onPress={(e) => handleToggleFavourite(item, e)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[styles.favouriteButtonBackground, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
              <Ionicons
                name={isFavourited ? "heart" : "heart-outline"}
                size={20}
                color={isFavourited ? "#ff6b6b" : "#FFFFFF"}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.gameInfo}>
          <Text style={[styles.gameName, { color: themeColors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.rating && (
            <View style={styles.gameRating}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.gameRatingText, { color: themeColors.textSecondary }]}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}
          {item.released && (
            <Text style={[styles.gameYear, { color: themeColors.textSecondary }]}>
              {new Date(item.released).getFullYear()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="trophy" size={28} color={themeColors.primary} />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Award-Winning Games
          </Text>
        </View>
      </View>

      {/* Dropdown Backdrop - covers entire screen when any dropdown is open */}
      {(showYearFilter || showCategoryFilter) && (
        <TouchableOpacity
          style={styles.fullScreenBackdrop}
          activeOpacity={1}
          onPress={() => {
            setShowYearFilter(false);
            setShowCategoryFilter(false);
          }}
        />
      )}

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        {/* Year Filter */}
        <View style={[styles.filterGroup, showYearFilter && styles.filterGroupActive]}>
          {showCategoryFilter && (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          )}
          <Text style={[styles.filterLabel, { color: themeColors.textSecondary }]}>Year</Text>
          <TouchableOpacity
            style={[
              styles.filterButton, 
              { backgroundColor: themeColors.background, borderColor: themeColors.border },
              showCategoryFilter && styles.filterButtonBlurred
            ]}
            onPress={() => {
              setShowCategoryFilter(false);
              setShowYearFilter(!showYearFilter);
            }}
            disabled={showCategoryFilter}
          >
            <Text style={[styles.filterButtonText, { color: themeColors.text }]}>
              {selectedYear}
            </Text>
            <Ionicons 
              name={showYearFilter ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={themeColors.textSecondary} 
            />
          </TouchableOpacity>
          {showYearFilter && (
            <View style={[styles.filterDropdown, { backgroundColor: themeColors.surface, borderColor: themeColors.border, shadowColor: '#000' }]}>
                <ScrollView style={styles.filterScroll} nestedScrollEnabled>
                  {AWARD_YEARS.map((year) => (
                    <TouchableOpacity
                      key={year.year}
                      style={[
                        styles.filterOption,
                        selectedYear === year.year && { backgroundColor: themeColors.primary },
                      ]}
                      onPress={() => {
                        setSelectedYear(year.year);
                        setShowYearFilter(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: selectedYear === year.year ? themeColors.buttonText : themeColors.text },
                        ]}
                      >
                        {year.label}
                      </Text>
                      {selectedYear === year.year && (
                        <Ionicons name="checkmark" size={20} color={themeColors.buttonText} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
          )}
        </View>

        {/* Category Filter */}
        <View style={[styles.filterGroup, showCategoryFilter && styles.filterGroupActive]}>
          {showYearFilter && (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          )}
          <Text style={[styles.filterLabel, { color: themeColors.textSecondary }]}>Category</Text>
          <TouchableOpacity
            style={[
              styles.filterButton, 
              { backgroundColor: themeColors.background, borderColor: themeColors.border },
              showYearFilter && styles.filterButtonBlurred
            ]}
            onPress={() => {
              setShowYearFilter(false);
              setShowCategoryFilter(!showCategoryFilter);
            }}
            disabled={showYearFilter}
          >
            <Text style={[styles.filterButtonText, { color: themeColors.text }]}>
              {AWARD_CATEGORIES.find(c => c.id === selectedCategory)?.name || 'All Categories'}
            </Text>
            <Ionicons 
              name={showCategoryFilter ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={themeColors.textSecondary} 
            />
          </TouchableOpacity>
          {showCategoryFilter && (
            <View style={[styles.filterDropdown, { backgroundColor: themeColors.surface, borderColor: themeColors.border, shadowColor: '#000' }]}>
                <ScrollView style={styles.filterScroll} nestedScrollEnabled>
                  {AWARD_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.filterOption,
                        selectedCategory === category.id && { backgroundColor: themeColors.primary },
                      ]}
                      onPress={() => {
                        setSelectedCategory(category.id);
                        setShowCategoryFilter(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: selectedCategory === category.id ? themeColors.buttonText : themeColors.text },
                        ]}
                      >
                        {category.name}
                      </Text>
                      {selectedCategory === category.id && (
                        <Ionicons name="checkmark" size={20} color={themeColors.buttonText} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
          )}
        </View>
      </View>

      {/* Games List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Loading award winners...
          </Text>
          <Text style={[styles.gameNewsText, { color: themeColors.textSecondary }]}>
            {gameNews}
          </Text>
        </View>
      ) : awardGames.length > 0 ? (
        <FlatList
          data={awardGames}
          renderItem={renderGame}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gamesList}
          columnWrapperStyle={styles.gamesRow}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color={themeColors.textSecondary} />
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No award winners found for {selectedYear}
            {selectedCategory !== 'all' && ` - ${AWARD_CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  filterGroup: {
    position: 'relative',
    zIndex: 10,
    overflow: 'visible',
  },
  filterGroupActive: {
    zIndex: 20, // Higher z-index when dropdown is open
  },
  filterButtonBlurred: {
    opacity: 0.5,
  },
  fullScreenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 5,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
    elevation: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    zIndex: 21, // Higher z-index to appear above everything
  },
  filterScroll: {
    maxHeight: 200,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 16,
  },
  gameNewsText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    paddingHorizontal: 32,
  },
  gamesList: {
    padding: 16,
  },
  gamesRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gameCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  gameImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  gameImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#1C1C1E',
  },
  gameImagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favouriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  favouriteButtonBackground: {
    borderRadius: 20,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    padding: 12,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    minHeight: 36,
  },
  gameRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  gameRatingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  gameYear: {
    fontSize: 11,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
