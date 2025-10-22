import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SteamAPIService, SteamGame, SteamPlayer } from '../../lib/steam-api';

interface GamingStats {
  player: SteamPlayer;
  totalGames: number;
  totalHours: number;
  topGames: SteamGame[];
  recentlyPlayed: SteamGame[];
  hasGames: boolean;
  isPrivate: boolean;
}

export default function SteamProfileTab() {
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GamingStats | null>(null);
  const [steamApi] = useState(new SteamAPIService('4E45453FFB33641E29B4C44FF691D29E'));
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const handleSteamIdSubmit = async () => {
    if (!steamId.trim()) {
      Alert.alert('Error', 'Please enter a Steam ID or profile URL');
      return;
    }

    setLoading(true);
    try {
      let processedSteamId = steamId.trim();
      
      // Check if it's a URL and extract Steam ID
      if (steamId.includes('steamcommunity.com') || steamId.includes('steam.com')) {
        const extractedId = SteamAPIService.extractSteamIdFromUrl(steamId);
        if (!extractedId) {
          throw new Error('Invalid Steam profile URL');
        }
        processedSteamId = extractedId;
      }
      
      // Validate and convert to Steam ID64
      let steamId64: string;
      try {
        steamId64 = SteamAPIService.convertToSteamId64(processedSteamId);
      } catch (conversionError) {
        throw new Error(`Invalid Steam ID format: ${processedSteamId}. Please enter a valid Steam ID or profile URL.`);
      }
      
      console.log('🔍 Processing Steam ID:', steamId64);
      
      // Fetch gaming stats
      const gamingStats = await steamApi.getGamingStats(steamId64);
      setStats(gamingStats);
      
    } catch (error) {
      console.error('Error fetching Steam profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Steam profile. Please check the Steam ID or URL.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (minutes: number): string => {
    const hours = Math.round(minutes / 60 * 100) / 100;
    if (hours < 1) {
      return `${Math.round(minutes)}m`;
    }
    return `${hours}h`;
  };

  const generateRecommendations = async () => {
    if (!stats || !stats.player) {
      Alert.alert('Error', 'No Steam profile loaded');
      return;
    }

    setLoadingRecommendations(true);
    try {
      console.log('🔄 Generating AI recommendations...');
             const recs = await steamApi.getPersonalisedRecommendations(stats.player.steamid);
      setRecommendations(recs);
      console.log('✅ AI recommendations generated successfully');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Alert.alert('Error', 'Failed to generate recommendations. Please try again.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const renderGameItem = ({ item }: { item: SteamGame }) => (
    <View style={styles.gameItem}>
      <Image 
        source={{ uri: `https://media.steampowered.com/steamcommunity/public/images/apps/${item.appid}/${item.img_icon_url}.jpg` }}
        style={styles.gameIcon}
        defaultSource={require('../../assets/icon.png')}
      />
      <View style={styles.gameInfo}>
        <Text style={styles.gameName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.gameHours}>
          {formatHours(item.playtime_forever)}
          {item.playtime_2weeks && item.playtime_2weeks > 0 && (
            <Text style={styles.recentPlaytime}> • {formatHours(item.playtime_2weeks)} this week</Text>
          )}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading Steam profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Steam Profile Scanner</Text>
        <Text style={styles.headerSubtitle}>Scan gaming hours, trophies & playtime</Text>
      </View>

      {!stats ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter Steam ID or Profile URL</Text>
          <TextInput
            style={styles.input}
            placeholder="Steam ID, Steam URL, or Steam username"
            value={steamId}
            onChangeText={setSteamId}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handleSteamIdSubmit}
            disabled={loading}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Profile</Text>
          </TouchableOpacity>
          
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>Supported formats:</Text>
            <Text style={styles.helpText}>• Steam ID: 76561198000000000</Text>
            <Text style={styles.helpText}>• Steam URL: https://steamcommunity.com/id/username</Text>
            <Text style={styles.helpText}>• Steam URL: https://steamcommunity.com/profiles/76561198000000000</Text>
            <Text style={styles.helpText}>• Steam URL: https://steam.com/user/username</Text>
            <Text style={styles.helpSubtext}>Note: Some profiles may be private and won't show gaming data</Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.statsContainer}>
          {/* Player Info */}
          <View style={styles.playerCard}>
            <Image source={{ uri: stats.player.avatarfull }} style={styles.playerAvatar} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{stats.player.personaname}</Text>
              {stats.player.realname && (
                <Text style={styles.playerRealName}>{stats.player.realname}</Text>
              )}
              <Text style={styles.playerStatus}>
                {stats.player.personastate === 1 ? 'Online' : 
                 stats.player.personastate === 2 ? 'Busy' :
                 stats.player.personastate === 3 ? 'Away' : 'Offline'}
              </Text>
            </View>
          </View>

          {/* Gaming Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Gaming Statistics</Text>
            {stats.isPrivate ? (
              <View style={styles.privateProfileContainer}>
                <Ionicons name="lock-closed" size={24} color="#ff6b6b" />
                <Text style={styles.privateProfileText}>This profile is private</Text>
                <Text style={styles.privateProfileSubtext}>Gaming data cannot be accessed</Text>
              </View>
            ) : !stats.hasGames ? (
              <View style={styles.noGamesContainer}>
                <Ionicons name="game-controller-outline" size={24} color="#999" />
                <Text style={styles.noGamesText}>No games found</Text>
                <Text style={styles.noGamesSubtext}>This account has no games in their library</Text>
              </View>
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.totalGames}</Text>
                  <Text style={styles.statLabel}>Games Owned</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.totalHours.toFixed(1)}h</Text>
                  <Text style={styles.statLabel}>Total Hours</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{Math.round(stats.totalHours / stats.totalGames * 10) / 10}h</Text>
                  <Text style={styles.statLabel}>Avg per Game</Text>
                </View>
              </View>
            )}
          </View>

          {/* Top Played Games - Only show if there are games */}
          {stats.hasGames && stats.topGames.length > 0 && (
            <View style={styles.gamesCard}>
              <Text style={styles.cardTitle}>Most Played Games</Text>
              <FlatList
                data={stats.topGames}
                renderItem={renderGameItem}
                keyExtractor={(item) => item.appid.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Recently Played - Only show if there are games */}
          {stats.hasGames && stats.recentlyPlayed.length > 0 && (
            <View style={styles.gamesCard}>
              <Text style={styles.cardTitle}>Recently Played</Text>
              <FlatList
                data={stats.recentlyPlayed}
                renderItem={renderGameItem}
                keyExtractor={(item) => item.appid.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Gaming Insights - Only show if there are games */}
          {stats.hasGames && (
            <View style={styles.insightsCard}>
              <Text style={styles.cardTitle}>Gaming Insights</Text>
              <View style={styles.insightsContainer}>
                <View style={styles.insightItem}>
                  <Ionicons name="time" size={20} color="#007AFF" />
                  <Text style={styles.insightText}>
                    {stats.totalHours > 1000 ? 'Heavy Gamer' : 
                     stats.totalHours > 500 ? 'Regular Gamer' : 
                     stats.totalHours > 100 ? 'Casual Gamer' : 'Light Gamer'}
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <Ionicons name="library" size={20} color="#007AFF" />
                  <Text style={styles.insightText}>
                    {stats.totalGames > 500 ? 'Game Collector' : 
                     stats.totalGames > 100 ? 'Game Enthusiast' : 
                     stats.totalGames > 20 ? 'Selective Gamer' : 'Focused Gamer'}
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <Ionicons name="trending-up" size={20} color="#007AFF" />
                  <Text style={styles.insightText}>
                    {stats.recentlyPlayed.length > 0 ? 'Active Player' : 'Dormant Player'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* AI Recommendations - Only show if there are games */}
          {stats.hasGames && (
            <View style={styles.recommendationsCard}>
              <View style={styles.recommendationsHeader}>
                <Text style={styles.cardTitle}>AI Game Recommendations</Text>
                <TouchableOpacity 
                  style={styles.generateButton}
                  onPress={generateRecommendations}
                  disabled={loadingRecommendations}
                >
                  {loadingRecommendations ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="refresh" size={16} color="#007AFF" />
                  )}
                </TouchableOpacity>
              </View>
              
              {recommendations ? (
                <View style={styles.recommendationsContainer}>
                  {recommendations.recommendations.map((rec: any, index: number) => (
                    <View key={index} style={styles.recommendationItem}>
                      <View style={styles.recommendationHeader}>
                        <Text style={styles.recommendationGameName}>{rec.gameName}</Text>
                        <View style={styles.confidenceBadge}>
                          <Text style={styles.confidenceText}>{rec.confidence}/10</Text>
                        </View>
                      </View>
                      <Text style={styles.recommendationReason}>{rec.reason}</Text>
                      <View style={styles.recommendationMeta}>
                        <Text style={styles.recommendationGenre}>{rec.genre}</Text>
                        <Text style={styles.recommendationPlaytime}>{rec.estimatedPlaytime}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noRecommendationsContainer}>
                  <Ionicons name="bulb-outline" size={24} color="#999" />
                  <Text style={styles.noRecommendationsText}>
                    Tap the refresh button to get AI-powered game recommendations based on your Steam profile
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.newScanButton} 
            onPress={() => setStats(null)}
          >
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.newScanButtonText}>Scan Another Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 30,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  helpSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  statsContainer: {
    flex: 1,
    padding: 16,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  playerRealName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  playerStatus: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  gamesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gameIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  gameHours: {
    fontSize: 12,
    color: '#666',
  },
  recentPlaytime: {
    color: '#007AFF',
    fontWeight: '600',
  },
  newScanButton: {
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 16,
  },
  newScanButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  privateProfileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  privateProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginTop: 8,
    marginBottom: 4,
  },
  privateProfileSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  noGamesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noGamesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 8,
    marginBottom: 4,
  },
  noGamesSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsContainer: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationGameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationGenre: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  recommendationPlaytime: {
    fontSize: 12,
    color: '#999',
  },
  noRecommendationsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noRecommendationsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
