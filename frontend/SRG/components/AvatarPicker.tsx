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
}

export default function AvatarPicker({ onAvatarSelect, currentAvatar, currentSeed }: AvatarPickerProps) {
  const themeColors = useThemeColors();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentSeed || '');
  const [loading, setLoading] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);

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
      const avatarUrl = `https://api.dicebear.com/9.x/micah/svg?seed=${seed}&size=100&backgroundColor=transparent`;
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
    const randomUrl = `https://api.dicebear.com/9.x/micah/svg?seed=${randomSeed}&size=100&backgroundColor=transparent`;
    
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
        <Image
          source={{ uri: item.url }}
          style={styles.avatarImage}
          resizeMode="contain"
        />
        <Text style={[styles.avatarName, { color: themeColors.text }]}>
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
      />

      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
          Powered by DiceBear Micah style
        </Text>
        <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
          Licensed under CC BY 4.0
        </Text>
      </View>
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
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  avatarName: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
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
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});
