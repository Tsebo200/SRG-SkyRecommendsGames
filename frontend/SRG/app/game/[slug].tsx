import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { HybridFavouritesService } from '../../lib/favourites-hybrid';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GameDetailsScreen() {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {image && (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.titleRow}>
        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity
          onPress={toggleFavourite}
          style={[styles.favouriteButton, isFavourited && styles.favouriteButtonActive]}
          disabled={favouriteLoading}
          accessibilityRole="button"
          accessibilityLabel={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Ionicons 
            name={isFavourited ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isFavourited ? '#ff6b6b' : '#a0a0a0'} 
          />
        </TouchableOpacity>
      </View>

      {!!genres && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Genres</Text>
          <Text style={styles.sectionValue}>{genres}</Text>
        </View>
      )}

      {!!platforms && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Platforms</Text>
          <Text style={styles.sectionValue}>{platforms}</Text>
        </View>
      )}

      {storeEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Store Links</Text>
          <View style={styles.storeList}>
            {storeEntries.map(([storeName, url]) => (
              <TouchableOpacity
                key={storeName}
                onPress={() => Linking.openURL(url)}
                style={styles.storeButton}
                accessibilityRole="button"
                accessibilityLabel={`Open ${storeName} store link`}
              >
                <Text style={styles.storeButtonText}>{storeName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <SafeAreaView style={styles.section}>
        <Text style={styles.sectionLabel}>Your Feedback</Text>
        <View style={styles.feedbackRow}>
          <TouchableOpacity
            onPress={() => setLiked(true)}
            style={[styles.voteButton, liked === true && styles.voteActivePositive]}
            accessibilityRole="button"
            accessibilityLabel="Like this game"
          >
            <Text style={styles.voteText}>👍 Like</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLiked(false)}
            style={[styles.voteButton, liked === false && styles.voteActiveNegative]}
            accessibilityRole="button"
            accessibilityLabel="Dislike this game"
          >
            <Text style={styles.voteText}>👎 Dislike</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="Share your thoughts (optional)"
          placeholderTextColor="#6b6b6b"
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
          style={[styles.submitButton, submitting && { opacity: 0.6 }]}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: '#a0a0a0',
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
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  favouriteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  favouriteButtonActive: {
    backgroundColor: 'rgba(255,107,107,0.2)',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#a0a0a0',
    fontSize: 13,
    marginBottom: 6,
  },
  sectionValue: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  storeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  storeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  voteButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  voteActivePositive: {
    backgroundColor: 'rgba(52,199,89,0.18)',
    borderColor: 'rgba(48,209,88,0.6)',
  },
  voteActiveNegative: {
    backgroundColor: 'rgba(255,69,58,0.18)',
    borderColor: 'rgba(255,69,58,0.6)',
  },
  voteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentInput: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    color: '#fff',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});


