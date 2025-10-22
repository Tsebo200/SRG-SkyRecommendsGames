import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlayStationAPIService, PlayStationGame, PlayStationProfile, PlayStationTrophySummary } from '../../lib/playstation-api';

interface GamingStats {
  player: PlayStationProfile;
  totalGames: number;
  totalHours: number;
  topGames: PlayStationGame[];
  recentlyPlayed: PlayStationGame[];
  hasGames: boolean;
  isPrivate: boolean;
  trophySummary?: PlayStationTrophySummary;
}

export default function PlayStationProfileTab() {
  const [psnId, setPsnId] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GamingStats | null>(null);
  const [playstationApi] = useState(new PlayStationAPIService());

  const handlePSNIdSubmit = async () => {
    if (!psnId.trim()) {
      Alert.alert('Error', 'Please enter a PlayStation Network ID');
      return;
    }

    setLoading(true);
    try {
      let processedPSNId = psnId.trim();
      
      // Check if it's a URL and extract PSN ID
      if (psnId.includes('playstation.com') || psnId.includes('my.playstation.com')) {
        const extractedId = PlayStationAPIService.extractPSNIdFromUrl(psnId);
        if (!extractedId) {
          throw new Error('Invalid PlayStation profile URL');
        }
        processedPSNId = extractedId;
      }
      
      // Validate PSN ID format
      if (!PlayStationAPIService.validatePSNId(processedPSNId)) {
        throw new Error(`Invalid PSN ID format: ${processedPSNId}. Please enter a valid PlayStation Network ID.`);
      }
      
      console.log('🔍 Processing PSN ID:', processedPSNId);
      
      // Fetch gaming stats
      const gamingStats = await playstationApi.getGamingStats(processedPSNId);
      setStats(gamingStats);
      
    } catch (error) {
      console.error('Error fetching PlayStation profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch PlayStation profile. Please check the PSN ID.';
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

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const renderGameItem = ({ item }: { item: PlayStationGame }) => (
    <View style={styles.gameItem}>
      <Image 
        source={{ uri: item.imageUrl }}
        style={styles.gameIcon}
        defaultSource={require('../../assets/icon.png')}
      />
      <View style={styles.gameInfo}>
        <Text style={styles.gameName} numberOfLines={2}>{item.titleName}</Text>
        <Text style={styles.gameHours}>
          {formatHours(item.playDuration)}
          {item.lastPlayedDate && (
            <Text style={styles.lastPlayed}> • Last played: {formatDate(item.lastPlayedDate)}</Text>
          )}
        </Text>
        {item.progress > 0 && (
          <Text style={styles.gameProgress}>Progress: {item.progress}%</Text>
        )}
      </View>
    </View>
  );

  const renderTrophySummary = () => {
    if (!stats.trophySummary) return null;

    const { earnedTrophies, totalTrophies, level } = stats.trophySummary;
    const totalEarned = earnedTrophies.bronze + earnedTrophies.silver + earnedTrophies.gold + earnedTrophies.platinum;
    const totalAvailable = totalTrophies.bronze + totalTrophies.silver + totalTrophies.gold + totalTrophies.platinum;

    return (
      <View style={styles.trophyCard}>
        <Text style={styles.cardTitle}>Trophy Summary</Text>
        <View style={styles.trophyStats}>
          <View style={styles.trophyLevel}>
            <Text style={styles.trophyLevelNumber}>{level}</Text>
            <Text style={styles.trophyLevelLabel}>Level</Text>
          </View>
          <View style={styles.trophyCounts}>
            <View style={styles.trophyRow}>
              <View style={styles.trophyIconContainer}>
                <Ionicons name="trophy" size={16} color="#CD7F32" />
                <Text style={styles.trophyCount}>{earnedTrophies.bronze}/{totalTrophies.bronze}</Text>
              </View>
              <View style={styles.trophyIconContainer}>
                <Ionicons name="trophy" size={16} color="#C0C0C0" />
                <Text style={styles.trophyCount}>{earnedTrophies.silver}/{totalTrophies.silver}</Text>
              </View>
              <View style={styles.trophyIconContainer}>
                <Ionicons name="trophy" size={16} color="#FFD700" />
                <Text style={styles.trophyCount}>{earnedTrophies.gold}/{totalTrophies.gold}</Text>
              </View>
              <View style={styles.trophyIconContainer}>
                <Ionicons name="trophy" size={16} color="#E5E4E2" />
                <Text style={styles.trophyCount}>{earnedTrophies.platinum}/{totalTrophies.platinum}</Text>
              </View>
            </View>
            <Text style={styles.trophyTotal}>{totalEarned}/{totalAvailable} total trophies</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading PlayStation profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PlayStation Profile Scanner</Text>
        <Text style={styles.headerSubtitle}>Scan trophies, games & playtime</Text>
      </View>

      {!stats ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter PlayStation Network ID</Text>
          <TextInput
            style={styles.input}
            placeholder="PSN ID or PlayStation profile URL"
            value={psnId}
            onChangeText={setPsnId}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handlePSNIdSubmit}
            disabled={loading}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Profile</Text>
          </TouchableOpacity>
          
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>Supported formats:</Text>
            <Text style={styles.helpText}>• PSN ID: YourPlayStationID</Text>
            <Text style={styles.helpText}>• PlayStation URL: https://my.playstation.com/YourPlayStationID</Text>
            <Text style={styles.helpText}>• Trophy URL: https://playstation.com/trophies/YourPlayStationID</Text>
            <Text style={styles.helpSubtext}>Note: Some profiles may be private and won't show gaming data</Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.statsContainer}>
          {/* Player Info */}
          <View style={styles.playerCard}>
            <Image source={{ uri: stats.player.avatarUrl }} style={styles.playerAvatar} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{stats.player.onlineId}</Text>
              {stats.player.personalDetail?.firstName && (
                <Text style={styles.playerRealName}>{stats.player.personalDetail.firstName} {stats.player.personalDetail.lastName}</Text>
              )}
              <Text style={styles.playerStatus}>
                {stats.player.primaryOnlineStatus === 'online' ? 'Online' : 'Offline'}
                {stats.player.isPlus && <Text style={styles.plusStatus}> • PlayStation Plus</Text>}
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
              </View>
            )}
          </View>

          {/* Trophy Summary */}
          {stats.trophySummary && renderTrophySummary()}

          {/* Top Played Games - Only show if there are games */}
          {stats.hasGames && stats.topGames.length > 0 && (
            <View style={styles.gamesCard}>
              <Text style={styles.cardTitle}>Most Played Games</Text>
              <FlatList
                data={stats.topGames}
                renderItem={renderGameItem}
                keyExtractor={(item) => item.npTitleId}
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
                keyExtractor={(item) => item.npTitleId}
                scrollEnabled={false}
              />
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
  plusStatus: {
    color: '#FFD700',
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
  trophyCard: {
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
  trophyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyLevel: {
    alignItems: 'center',
    marginRight: 20,
  },
  trophyLevelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  trophyLevelLabel: {
    fontSize: 12,
    color: '#666',
  },
  trophyCounts: {
    flex: 1,
  },
  trophyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trophyIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  trophyTotal: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
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
  lastPlayed: {
    color: '#007AFF',
    fontWeight: '600',
  },
  gameProgress: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
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
});
