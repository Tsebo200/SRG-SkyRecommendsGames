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
import { XboxAPIService, XboxGame, XboxProfile, XboxGamingStats } from '../../lib/xbox-api';

interface GamingStats {
  player: XboxProfile;
  totalGames: number;
  totalHours: number;
  topGames: XboxGame[];
  recentlyPlayed: XboxGame[];
  hasGames: boolean;
  isPrivate: boolean;
  gamingStats: XboxGamingStats;
}

export default function XboxProfileTab() {
  const [gamertag, setGamertag] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GamingStats | null>(null);
  const [xboxApi] = useState(new XboxAPIService());

  const handleGamertagSubmit = async () => {
    if (!gamertag.trim()) {
      Alert.alert('Error', 'Please enter an Xbox gamertag');
      return;
    }

    setLoading(true);
    try {
      let processedGamertag = gamertag.trim();
      
      // Check if it's a URL and extract gamertag
      if (gamertag.includes('xbox.com') || gamertag.includes('xbl.io')) {
        const extractedTag = XboxAPIService.extractGamertagFromUrl(gamertag);
        if (!extractedTag) {
          throw new Error('Invalid Xbox profile URL');
        }
        processedGamertag = extractedTag;
      }
      
      // Validate gamertag format
      if (!XboxAPIService.validateGamertag(processedGamertag)) {
        throw new Error(`Invalid gamertag format: ${processedGamertag}. Please enter a valid Xbox gamertag.`);
      }
      
      console.log('🔍 Processing Xbox gamertag:', processedGamertag);
      
      // Fetch gaming stats
      const gamingStats = await xboxApi.getGamingStats(processedGamertag);
      setStats(gamingStats);
      
    } catch (error) {
      console.error('Error fetching Xbox profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Xbox profile. Please check the gamertag.';
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

  const renderGameItem = ({ item }: { item: XboxGame }) => (
    <View style={styles.gameItem}>
      <Image 
        source={{ uri: item.imageUrl }}
        style={styles.gameIcon}
        defaultSource={require('../../assets/icon.png')}
      />
      <View style={styles.gameInfo}>
        <Text style={styles.gameName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.gameHours}>
          {formatHours(item.playtime)}
          {item.lastPlayedDate && (
            <Text style={styles.lastPlayed}> • Last played: {formatDate(item.lastPlayedDate)}</Text>
          )}
        </Text>
        <Text style={styles.gameAchievements}>
          {item.earnedAchievements}/{item.totalAchievements} achievements
        </Text>
      </View>
    </View>
  );

  const renderGamingStats = () => {
    if (!stats.gamingStats) return null;

    const { totalGamerscore, totalAchievements, earnedAchievements, completionRate } = stats.gamingStats;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Gaming Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalGamerscore.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Gamerscore</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{earnedAchievements}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#107C10" />
          <Text style={styles.loadingText}>Loading Xbox profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Xbox Profile Scanner</Text>
        <Text style={styles.headerSubtitle}>Scan achievements, games & playtime</Text>
      </View>

      {!stats ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter Xbox Gamertag</Text>
          <TextInput
            style={styles.input}
            placeholder="Xbox gamertag or profile URL"
            value={gamertag}
            onChangeText={setGamertag}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handleGamertagSubmit}
            disabled={loading}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Profile</Text>
          </TouchableOpacity>
          
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>Supported formats:</Text>
            <Text style={styles.helpText}>• Gamertag: YourGamertag</Text>
            <Text style={styles.helpText}>• Xbox URL: https://xbox.com/profile/YourGamertag</Text>
            <Text style={styles.helpText}>• XBL URL: https://xbl.io/YourGamertag</Text>
            <Text style={styles.helpSubtext}>Note: Some profiles may be private and won't show gaming data</Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.statsContainer}>
          {/* Player Info */}
          <View style={styles.playerCard}>
            <Image source={{ uri: stats.player.avatarUrl }} style={styles.playerAvatar} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{stats.player.gamertag}</Text>
              {stats.player.displayName && stats.player.displayName !== stats.player.gamertag && (
                <Text style={styles.playerRealName}>{stats.player.displayName}</Text>
              )}
              <Text style={styles.playerStatus}>
                {stats.player.isOnline ? 'Online' : 'Offline'}
                {stats.player.tier && <Text style={styles.tierStatus}> • {stats.player.tier}</Text>}
              </Text>
              <Text style={styles.gamerscore}>{stats.player.gamerscore.toLocaleString()} Gamerscore</Text>
            </View>
          </View>

          {/* Gaming Stats */}
          {renderGamingStats()}

          {/* Basic Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Library Statistics</Text>
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

          {/* Top Played Games - Only show if there are games */}
          {stats.hasGames && stats.topGames.length > 0 && (
            <View style={styles.gamesCard}>
              <Text style={styles.cardTitle}>Most Played Games</Text>
              <FlatList
                data={stats.topGames}
                renderItem={renderGameItem}
                keyExtractor={(item) => item.id}
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
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          <TouchableOpacity 
            style={styles.newScanButton} 
            onPress={() => setStats(null)}
          >
            <Ionicons name="refresh" size={20} color="#107C10" />
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
    backgroundColor: '#107C10',
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
    color: '#107C10',
    fontWeight: '600',
    marginBottom: 4,
  },
  tierStatus: {
    color: '#FFD700',
  },
  gamerscore: {
    fontSize: 14,
    color: '#107C10',
    fontWeight: 'bold',
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
    color: '#107C10',
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
  lastPlayed: {
    color: '#107C10',
    fontWeight: '600',
  },
  gameAchievements: {
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
    borderColor: '#107C10',
    marginTop: 16,
  },
  newScanButtonText: {
    color: '#107C10',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
