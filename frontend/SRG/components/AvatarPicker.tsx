import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { useThemeColors } from '../lib/theme-context';

interface AvatarOption {
  id: string;
  name: string;
  url: string;
  seed: string;
}

interface AvatarPickerProps {
  onAvatarSelect: (avatarUrl: string, seed: string) => void;
  currentAvatar?: string;
  currentSeed?: string;
  initialDisplayName?: string;
  onSaveProfile?: (displayName: string) => void;
}

export default function AvatarPicker({ onAvatarSelect, currentAvatar, currentSeed, initialDisplayName = '', onSaveProfile }: AvatarPickerProps) {
  const themeColors = useThemeColors();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentSeed || '');
  const [loading, setLoading] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [displayName, setDisplayName] = useState<string>(initialDisplayName);

  // Generate avatar options with different seeds
  const generateAvatarOptions = () => {
    const options: AvatarOption[] = [];
    const seeds = [
      'alex', 'jordan', 'sam', 'taylor', 'casey', 'riley', 'jamie', 'morgan',
      'avery', 'quinn', 'sage', 'drew', 'blake', 'cameron', 'dakota', 'finley',
      'harper', 'hayden', 'kendall', 'logan', 'mason', 'parker', 'peyton', 'reese',
      'rowan', 'skyler', 'spencer', 'tyler', 'zoe', 'zoe', 'alexis', 'bailey'
    ];

    seeds.forEach((seed, index) => {
      // Use PNG format instead of SVG for React Native compatibility
      const avatarUrl = `https://api.dicebear.com/9.x/micah/png?seed=${seed}&size=200&backgroundColor=transparent`;
      options.push({
        id: `avatar-${index}`,
        name: seed.charAt(0).toUpperCase() + seed.slice(1),
        url: avatarUrl,
        seed: seed,
      });
    });

    return options;
  };

  useEffect(() => {
    setAvatarOptions(generateAvatarOptions());
    if (currentSeed) {
      setSelectedAvatar(currentSeed);
    }
  }, [currentSeed]);

  useEffect(() => {
    setDisplayName(initialDisplayName);
  }, [initialDisplayName]);

  const handleAvatarSelect = (avatar: AvatarOption) => {
    setSelectedAvatar(avatar.seed);
    setLoading(true);
    
    // Simulate loading time for better UX
    setTimeout(() => {
      onAvatarSelect(avatar.url, avatar.seed);
      setLoading(false);
    }, 300);
  };

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    // Use PNG format instead of SVG for React Native compatibility
    const randomUrl = `https://api.dicebear.com/9.x/micah/png?seed=${randomSeed}&size=200&backgroundColor=transparent`;
    
    setLoading(true);
    setTimeout(() => {
      onAvatarSelect(randomUrl, randomSeed);
      setLoading(false);
    }, 300);
  };

  const renderAvatarItem = ({ item }: { item: AvatarOption }) => {
    const isSelected = selectedAvatar === item.seed;
    
    return (
      <TouchableOpacity
        style={[
          styles.avatarItem,
          { 
            backgroundColor: themeColors.card,
            borderColor: isSelected ? themeColors.primary : themeColors.border,
            borderWidth: isSelected ? 3 : 1,
          }
        ]}
        onPress={() => handleAvatarSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarImageContainer}>
          <Image
            source={{ uri: item.url }}
            style={styles.avatarImage}
            resizeMode="cover"
            onError={(error) => {
              console.log('❌ Avatar image failed to load:', item.url, error);
            }}
            onLoad={() => {
              console.log('✅ Avatar image loaded:', item.url);
            }}
          />
        </View>
        <Text style={[styles.avatarName, { color: themeColors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: themeColors.primary }]}>
            <Text style={[styles.checkmark, { color: themeColors.buttonText }]}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Generating avatar...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>
        Choose Your Avatar
      </Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Select from our collection of unique avatars powered by DiceBear
      </Text>

      {/* Username input */}
      {onSaveProfile && (
        <TextInput
          style={[styles.nameInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Enter username"
          placeholderTextColor={themeColors.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />)
      }

      <TouchableOpacity
        style={[styles.randomButton, { backgroundColor: themeColors.primary }]}
        onPress={generateRandomAvatar}
        activeOpacity={0.8}
      >
        <Text style={[styles.randomButtonText, { color: themeColors.buttonText }]}>
          🎲 Generate Random Avatar
        </Text>
      </TouchableOpacity>

      <FlatList
        data={avatarOptions}
        renderItem={renderAvatarItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.avatarGrid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Loading avatars...
            </Text>
          </View>
        }
      />

      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
          Powered by DiceBear Micah style
        </Text>
        <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
          Licensed under CC BY 4.0
        </Text>
      </View>

      {onSaveProfile && (
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
          onPress={() => {
            const trimmed = displayName.trim();
            if (trimmed.length < 3) {
              Alert.alert('Invalid Name', 'Username must be at least 3 characters.');
              return;
            }
            onSaveProfile(trimmed);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveButtonText, { color: themeColors.buttonText }]}>Save Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  randomButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  randomButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatarGrid: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarItem: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'visible',
  },
  avatarImageContainer: {
    width: '100%',
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  avatarName: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
