import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { HybridFavouritesService } from '../../lib/favourites-hybrid';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../lib/theme-context';

export default function GameDetailsScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [liked, setLiked] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);

  const name = typeof params.name === 'string' ? params.name : '';
  const image = typeof params.image === 'string' ? params.image : undefined;
  const genres = typeof params.genres === 'string' ? params.genres : '';
  const platforms = typeof params.platforms === 'string' ? params.platforms : '';
  const storesParam = typeof params.stores === 'string' ? params.stores : '{}';

  const stores: Record<string, string> = useMemo(() => {
    try {
      return JSON.parse(storesParam || '{}');
    } catch {
      return {};
    }
  }, [storesParam]);

  const storeEntries = Object.entries(stores);

  // Check if game is favourited on mount
  useEffect(() => {
    const checkFavourite = async () => {
      try {
        const slug = typeof params.slug === 'string' ? params.slug : '';
        const favourited = await HybridFavouritesService.isFavourited(slug);
        setIsFavourited(favourited);
      } catch (error) {
        console.error('Error checking favourite status:', error);
      }
    };
    checkFavourite();
  }, [params.slug]);

  const toggleFavourite = async () => {
    try {
      setFavouriteLoading(true);
      const slug = typeof params.slug === 'string' ? params.slug : '';
      
      const newFavouriteStatus = await HybridFavouritesService.toggleFavourite(
        slug, // Using slug as the ID
        name,
        slug,
        image
      );
      
      setIsFavourited(newFavouriteStatus);
      
      Alert.alert(
        newFavouriteStatus ? 'Added to Favourites' : 'Removed from Favourites',
        newFavouriteStatus 
          ? 'Game added to your favourites!' 
          : 'Game removed from your favourites.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update favourites');
    } finally {
      setFavouriteLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={[styles.backText, { color: themeColors.textSecondary }]}>← Back</Text>
      </TouchableOpacity>

      {image && (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: themeColors.text }]}>{name}</Text>
        <TouchableOpacity
          onPress={toggleFavourite}
          style={[styles.favouriteButton, { backgroundColor: themeColors.surface }, isFavourited && { backgroundColor: themeColors.error + '20' }]}
          disabled={favouriteLoading}
          accessibilityRole="button"
          accessibilityLabel={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Ionicons 
            name={isFavourited ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isFavourited ? themeColors.error : themeColors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {!!genres && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>Genres</Text>
          <Text style={[styles.sectionValue, { color: themeColors.text }]}>{genres}</Text>
        </View>
      )}

      {!!platforms && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>Platforms</Text>
          <Text style={[styles.sectionValue, { color: themeColors.text }]}>{platforms}</Text>
        </View>
      )}

      {storeEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>Store Links</Text>
          <View style={styles.storeList}>
            {storeEntries.map(([storeName, url]) => (
              <TouchableOpacity
                key={storeName}
                onPress={() => Linking.openURL(url)}
                style={[styles.storeButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${storeName} store link`}
              >
                <Text style={[styles.storeButtonText, { color: themeColors.text }]}>{storeName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <SafeAreaView style={styles.section}>
        <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>Your Feedback</Text>
        <View style={styles.feedbackRow}>
          <TouchableOpacity
            onPress={() => setLiked(true)}
            style={[styles.voteButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, liked === true && { backgroundColor: themeColors.success + '20', borderColor: themeColors.success }]}
            accessibilityRole="button"
            accessibilityLabel="Like this game"
          >
            <Text style={[styles.voteText, { color: themeColors.text }]}>👍 Like</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLiked(false)}
            style={[styles.voteButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, liked === false && { backgroundColor: themeColors.error + '20', borderColor: themeColors.error }]}
            accessibilityRole="button"
            accessibilityLabel="Dislike this game"
          >
            <Text style={[styles.voteText, { color: themeColors.text }]}>👎 Dislike</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.commentInput, { backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }]}
          placeholder="Share your thoughts (optional)"
          placeholderTextColor={themeColors.textSecondary}
          multiline
          value={comment}
          onChangeText={setComment}
          maxLength={600}
        />

        <TouchableOpacity
          onPress={async () => {
            if (liked === null && comment.trim().length === 0) {
              Alert.alert('Feedback', 'Please like/dislike or add a comment.');
              return;
            }
            try {
              setSubmitting(true);
              const slug = typeof params.slug === 'string' ? params.slug : '';
              const { error } = await supabase
                .from('feedback')
                .insert({
                  game_slug: slug,
                  liked,
                  comment: comment.trim() || null,
                });
              if (error) throw error;
              Alert.alert('Thank you!', 'Your feedback has been recorded.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to submit feedback');
            } finally {
              setSubmitting(false);
            }
          }}
          style={[styles.submitButton, { backgroundColor: themeColors.primary }, submitting && { opacity: 0.6 }]}
          disabled={submitting}
        >
          <Text style={[styles.submitText, { color: themeColors.buttonText }]}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  favouriteButton: {
    padding: 8,
    borderRadius: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  sectionValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  storeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeButton: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  storeButtonText: {
    fontSize: 14,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  voteButton: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  voteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentInput: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
});


